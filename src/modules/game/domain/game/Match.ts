import type { DomainEvent } from '@shared/types/DomainEvent.js';
import { BoardSnapshot } from './BoardSnapshot.js';
import {
  CheckDeclared,
  MatchEnded,
  MoveMade,
  PawnPromoted,
  UndoMoveMade,
} from './events';
import { GameRules } from './GameRules.js';
import { type GameStatus, isTerminal } from './GameStatus.js';
import { MoveGenerator } from './MoveGenerator.js';
import { Timeline } from './Timeline.js';
import { type Color, oppositeColor } from './value-objects/Color.js';
import type { Move } from './value-objects/Move.js';
import type { PromotionPiece } from './value-objects/PieceType.js';
import type { Square } from './value-objects/Square.js';

export interface MoveInput {
  readonly from: Square;
  readonly to: Square;
  readonly promotion?: PromotionPiece;
}

export class IllegalMoveError extends Error {}
export class MatchOverError extends Error {}

export class Match {
  private readonly _timeline: Timeline;
  private _status: GameStatus;

  private constructor(
    readonly id: string,
    timeline: Timeline,
    status: GameStatus,
  ) {
    this._timeline = timeline;
    this._status = status;
  }

  static start(id: string, initial: BoardSnapshot = BoardSnapshot.initial()): Match {
    return new Match(id, Timeline.from(initial), GameRules.status(initial));
  }

  get currentSnapshot(): BoardSnapshot {
    return this._timeline.current;
  }

  get status(): GameStatus {
    return this._status;
  }

  get timeline(): Timeline {
    return this._timeline;
  }

  legalMoves(): Move[] {
    return MoveGenerator.legalMoves(this.currentSnapshot);
  }

  applyMove(input: MoveInput): DomainEvent[] {
    if (isTerminal(this._status)) {
      throw new MatchOverError(`Match is over: ${this._status.kind}`);
    }
    const candidate = this.legalMoves().find((m) =>
      m.matches(input.from, input.to, input.promotion ?? null),
    );
    if (!candidate) {
      throw new IllegalMoveError(
        `Illegal move: ${input.from.algebraic}${input.to.algebraic}` +
          (input.promotion ? `=${input.promotion}` : ''),
      );
    }

    const before = this.currentSnapshot;
    const after = before.apply(candidate);
    const events: DomainEvent[] = [new MoveMade(this.id, candidate, before, after)];

    if (candidate.isPromotion && candidate.promotion) {
      events.push(new PawnPromoted(this.id, candidate.to, candidate.promotion));
    }

    const opponent = oppositeColor(before.sideToMove);
    if (GameRules.isInCheck(after, opponent)) {
      events.push(new CheckDeclared(this.id, opponent));
    }

    let newStatus = GameRules.status(after);
    if (newStatus.kind === 'in-progress') {
      const key = after.positionKey();
      let repeatCount = 0;
      for (const entry of this._timeline.iter()) {
        if (entry.snapshot.positionKey() === key) repeatCount++;
      }
      if (repeatCount >= 2) {
        newStatus = { kind: 'draw-threefold-repetition' };
      }
    }
    this._status = newStatus;
    if (isTerminal(newStatus)) {
      events.push(new MatchEnded(this.id, newStatus));
    }

    this._timeline.push(after, events);
    return events;
  }

  forfeit(loser: Color): DomainEvent[] {
    if (isTerminal(this._status)) return [];
    const winner = oppositeColor(loser);
    const newStatus: GameStatus = { kind: 'time-forfeit', winner };
    this._status = newStatus;
    return [new MatchEnded(this.id, newStatus)];
  }

  resign(loser: Color): DomainEvent[] {
    if (isTerminal(this._status)) return [];
    const winner = oppositeColor(loser);
    const newStatus: GameStatus = { kind: 'resignation', winner };
    this._status = newStatus;
    return [new MatchEnded(this.id, newStatus)];
  }

  undo(): DomainEvent[] {
    if (!this._timeline.undo()) return [];
    this._status = GameRules.status(this.currentSnapshot);
    return [new UndoMoveMade(this.id, this.currentSnapshot)];
  }

  redo(): DomainEvent[] {
    if (!this._timeline.redo()) return [];
    this._status = GameRules.status(this.currentSnapshot);
    const entry = this._timeline.entryAt(this._timeline.currentIndex);
    return entry.events.slice();
  }

  jumpTo(index: number): void {
    this._timeline.jumpTo(index);
    this._status = GameRules.status(this.currentSnapshot);
  }
}
