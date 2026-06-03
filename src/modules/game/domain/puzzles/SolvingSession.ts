import { parseUci } from '@modules/game/application/uci.js';
import {
  BoardSnapshot,
  Match,
  type Move,
  MoveMade,
  type PromotionPiece,
  type Square,
} from '@modules/game/domain/game';
import { type DomainEvent } from '@shared/types/DomainEvent.js';
import {
  PuzzleAwaitingOpponent,
  PuzzleFailed,
  PuzzleHintRevealed,
  PuzzleMoveAccepted,
  PuzzleMoveRejected,
  PuzzleOpponentReplied,
  PuzzleSolved,
} from './events';
import { evaluateObjective, type PuzzleObjective } from './objective.js';
import type { Puzzle, SolutionLine } from './Puzzle.js';

export const PUZZLE_STATUS = {
  solving: 'solving',
  solved: 'solved',
  failed: 'failed',
} as const;
export type PuzzleStatus = (typeof PUZZLE_STATUS)[keyof typeof PUZZLE_STATUS];

export const OPPONENT_MODE = {
  scripted: 'scripted',
  ai: 'ai',
} as const;
export type OpponentMode = (typeof OPPONENT_MODE)[keyof typeof OPPONENT_MODE];

export interface PuzzleAttemptInput {
  readonly from: Square;
  readonly to: Square;
  readonly promotion?: PromotionPiece;
}

export class SolvingSession {
  private readonly match: Match;
  private _status: PuzzleStatus = PUZZLE_STATUS.solving;
  private _ply = 0;
  private _hintsRevealed = 0;
  private readonly _movesPlayed: Move[] = [];
  private _candidateLines: readonly SolutionLine[];
  private _opponentMode: OpponentMode = OPPONENT_MODE.scripted;
  private _offScript = false;
  private _solverMoves = 0;
  private readonly _objective: PuzzleObjective | undefined;
  /** Принятые первые ходы решающей стороны для objective=best-move (UCI). */
  private readonly _acceptedFirstMoves: ReadonlySet<string>;

  private constructor(
    readonly puzzle: Puzzle,
    private readonly sessionId: string,
  ) {
    this.match = Match.start(`puzzle-${sessionId}`, BoardSnapshot.fromFen(puzzle.fen));
    this._candidateLines = puzzle.solutions;
    this._objective = puzzle.objective;
    this._acceptedFirstMoves = new Set(
      puzzle.solutions.map((line) => line[0]).filter((u): u is string => typeof u === 'string'),
    );
  }

  static start(puzzle: Puzzle, sessionId: string): SolvingSession {
    return new SolvingSession(puzzle, sessionId);
  }

  get status(): PuzzleStatus { return this._status; }
  get solutionIndex(): number { return this._ply; }
  get hintsRevealed(): number { return this._hintsRevealed; }
  get currentSnapshot(): BoardSnapshot { return this.match.currentSnapshot; }
  /** FEN текущей позиции — для UI и application-уровня без вытаскивания domain-типов. */
  get currentFen(): string { return this.match.currentSnapshot.toFen(); }
  get id(): string { return this.sessionId; }
  get movesPlayed(): readonly Move[] { return this._movesPlayed; }
  get opponentMode(): OpponentMode { return this._opponentMode; }
  get isOffScript(): boolean { return this._offScript; }
  /** Цель задачи (если задана) — для UI и логики free-режима. */
  get objective(): PuzzleObjective | undefined { return this._objective; }
  /** Кол-во ходов решающей стороны, сделанных в свободном режиме. */
  get solverMoves(): number { return this._solverMoves; }
  /** В свободном режиме (есть objective) принимаем любой легальный ход. */
  get isFreeMode(): boolean { return this._objective !== undefined; }

  setOpponentMode(mode: OpponentMode): void { this._opponentMode = mode; }

  legalMoves(): readonly Move[] {
    return this.match.legalMoves();
  }

  /** Длина самой длинной оставшейся (или главной) линии — для UI прогресса. */
  get totalPlies(): number {
    if (this._candidateLines.length === 0) return this.puzzle.mainLine.length;
    return Math.max(...this._candidateLines.map((l) => l.length));
  }

  tryMove(input: PuzzleAttemptInput): DomainEvent[] {
    if (this._status !== PUZZLE_STATUS.solving) return [];

    const inputUci = this.toUci(input);

    // Свободный режим (есть objective): любой легальный ход, цель проверяется после.
    if (this._objective) {
      return this.applyPlayerFreeMode(input, inputUci, this._objective);
    }

    // Off-script (AI-режим после развилки) — принимаем любой легальный ход.
    if (this._offScript) {
      return this.applyPlayerOffScript(input, inputUci);
    }

    const matched = this._candidateLines.filter(
      (line) => line[this._ply] === inputUci,
    );

    if (matched.length === 0) {
      const expected = this._candidateLines[0]?.[this._ply] ?? '';
      this._status = PUZZLE_STATUS.failed;
      return [new PuzzleFailed(this.sessionId, this.puzzle.id, expected, inputUci)];
    }

    const playerEvents = this.match.applyMove({
      from: input.from,
      to: input.to,
      ...(input.promotion ? { promotion: input.promotion } : {}),
    });
    const lastMove = this._extractMove(playerEvents);
    if (lastMove) this._movesPlayed.push(lastMove);
    this._ply++;
    this._candidateLines = matched;

    const events: DomainEvent[] = [
      new PuzzleMoveAccepted(this.sessionId, this.puzzle.id, inputUci, this._ply),
    ];

    if (this.allLinesConsumed()) {
      this._status = PUZZLE_STATUS.solved;
      events.push(new PuzzleSolved(this.sessionId, this.puzzle.id, this._hintsRevealed));
      return events;
    }

    if (this._opponentMode === OPPONENT_MODE.ai) {
      events.push(
        new PuzzleAwaitingOpponent(this.sessionId, this.puzzle.id, this.match.currentSnapshot.toFen()),
      );
      return events;
    }

    return [...events, ...this.applyScriptedReply()];
  }

  /** Применяет ход соперника, выбранный снаружи (AI-движок). Используется при `opponentMode === 'ai'`. */
  applyOpponentReply(uci: string): DomainEvent[] {
    if (this._status !== PUZZLE_STATUS.solving) return [];
    const move = parseUci(uci);
    const replyEvents = this.match.applyMove({
      from: move.from,
      to: move.to,
      ...(move.promotion ? { promotion: move.promotion } : {}),
    });
    const lastMove = this._extractMove(replyEvents);
    if (lastMove) this._movesPlayed.push(lastMove);

    if (!this._offScript) {
      const matched = this._candidateLines.filter(
        (line) => line[this._ply] === uci,
      );
      if (matched.length === 0) {
        this._offScript = true;
        this._candidateLines = [];
      } else {
        this._candidateLines = matched;
      }
    }
    this._ply++;

    const events: DomainEvent[] = [
      new PuzzleOpponentReplied(this.sessionId, this.puzzle.id, uci),
    ];
    if (this.allLinesConsumed()) {
      this._status = PUZZLE_STATUS.solved;
      events.push(new PuzzleSolved(this.sessionId, this.puzzle.id, this._hintsRevealed));
    }
    return events;
  }

  revealHint(): DomainEvent[] {
    if (this._status !== PUZZLE_STATUS.solving) return [];
    const next = this._candidateLines[0]?.[this._ply];
    if (!next) return [];
    this._hintsRevealed++;
    return [new PuzzleHintRevealed(this.sessionId, this.puzzle.id, next, this._hintsRevealed)];
  }

  rejectAttempt(input: PuzzleAttemptInput): DomainEvent[] {
    return [new PuzzleMoveRejected(this.sessionId, this.puzzle.id, this.toUci(input))];
  }

  private applyScriptedReply(): DomainEvent[] {
    const replyUci = this._candidateLines[0]?.[this._ply];
    if (!replyUci) return [];
    const reply = parseUci(replyUci);
    const replyEvents = this.match.applyMove({
      from: reply.from,
      to: reply.to,
      ...(reply.promotion ? { promotion: reply.promotion } : {}),
    });
    const replyMove = this._extractMove(replyEvents);
    if (replyMove) this._movesPlayed.push(replyMove);
    this._candidateLines = this._candidateLines.filter(
      (line) => line[this._ply] === replyUci,
    );
    this._ply++;

    const out: DomainEvent[] = [
      new PuzzleOpponentReplied(this.sessionId, this.puzzle.id, replyUci),
    ];
    if (this.allLinesConsumed()) {
      this._status = PUZZLE_STATUS.solved;
      out.push(new PuzzleSolved(this.sessionId, this.puzzle.id, this._hintsRevealed));
    }
    return out;
  }

  private applyPlayerOffScript(input: PuzzleAttemptInput, inputUci: string): DomainEvent[] {
    const legal = this.match.legalMoves().some(
      (m) => m.from.equals(input.from) && m.to.equals(input.to)
        && (m.promotion ?? null) === (input.promotion ?? null),
    );
    if (!legal) {
      return [new PuzzleMoveRejected(this.sessionId, this.puzzle.id, inputUci)];
    }
    const playerEvents = this.match.applyMove({
      from: input.from,
      to: input.to,
      ...(input.promotion ? { promotion: input.promotion } : {}),
    });
    const lastMove = this._extractMove(playerEvents);
    if (lastMove) this._movesPlayed.push(lastMove);
    this._ply++;

    const events: DomainEvent[] = [
      new PuzzleMoveAccepted(this.sessionId, this.puzzle.id, inputUci, this._ply),
    ];

    const matchStatus = this.match.status.kind;
    if (matchStatus === 'checkmate') {
      this._status = PUZZLE_STATUS.solved;
      events.push(new PuzzleSolved(this.sessionId, this.puzzle.id, this._hintsRevealed));
      return events;
    }

    if (this._opponentMode === OPPONENT_MODE.ai && matchStatus === 'in-progress') {
      events.push(
        new PuzzleAwaitingOpponent(this.sessionId, this.puzzle.id, this.match.currentSnapshot.toFen()),
      );
    }
    return events;
  }

  /**
   * Свободный режим: задача с заданным `objective`. Принимаем любой легальный
   * ход, после каждого хода игрока вызываем evaluateObjective. Между ходами
   * игрока
   * (для бюджета > 1) — ответ оппонента через AI (PuzzleAwaitingOpponent) или
   * скриптовая линия, если она задана.
   */
  private applyPlayerFreeMode(
    input: PuzzleAttemptInput,
    inputUci: string,
    objective: PuzzleObjective,
  ): DomainEvent[] {
    const legal = this.match.legalMoves().some(
      (m) => m.from.equals(input.from) && m.to.equals(input.to)
        && (m.promotion ?? null) === (input.promotion ?? null),
    );
    if (!legal) {
      return [new PuzzleMoveRejected(this.sessionId, this.puzzle.id, inputUci)];
    }
    const playerEvents = this.match.applyMove({
      from: input.from,
      to: input.to,
      ...(input.promotion ? { promotion: input.promotion } : {}),
    });
    const lastMove = this._extractMove(playerEvents);
    if (lastMove) this._movesPlayed.push(lastMove);
    this._ply++;
    this._solverMoves++;

    const outcome = evaluateObjective({
      match: this.match,
      objective,
      lastInputUci: inputUci,
      solverMoves: this._solverMoves,
      acceptedFirstMoves: this._acceptedFirstMoves,
    });

    // На `failed` НЕ эмитим PuzzleMoveAccepted — иначе UI запишет 2 попытки
    // (одну как «верный ход» и одну как «не подходит»). Provider семантика
    // Accepted = «ход двигает решение», а провальный ход решение не двигает.
    if (outcome === 'failed') {
      this._status = PUZZLE_STATUS.failed;
      const expected = this.puzzle.mainLine[0] ?? '';
      return [new PuzzleFailed(this.sessionId, this.puzzle.id, expected, inputUci)];
    }

    const events: DomainEvent[] = [
      new PuzzleMoveAccepted(this.sessionId, this.puzzle.id, inputUci, this._ply),
    ];

    if (outcome === 'reached') {
      this._status = PUZZLE_STATUS.solved;
      events.push(new PuzzleSolved(this.sessionId, this.puzzle.id, this._hintsRevealed));
      return events;
    }

    // Продолжаем: оппонент должен ответить (если игра не окончена).
    if (this.match.status.kind !== 'in-progress') return events;

    if (this._opponentMode === OPPONENT_MODE.ai) {
      events.push(
        new PuzzleAwaitingOpponent(this.sessionId, this.puzzle.id, this.match.currentSnapshot.toFen()),
      );
      return events;
    }

    // Скриптовый ответ оппонента (если задан в solutions).
    return [...events, ...this.applyScriptedReply()];
  }

  private allLinesConsumed(): boolean {
    if (this._candidateLines.length === 0) return false;
    return this._candidateLines.some((line) => line.length <= this._ply);
  }

  private toUci(input: PuzzleAttemptInput): string {
    const promo = input.promotion
      ? { queen: 'q', rook: 'r', bishop: 'b', knight: 'n' }[input.promotion]
      : '';
    return `${input.from.algebraic}${input.to.algebraic}${promo}`;
  }

  private _extractMove(events: DomainEvent[]): Move | null {
    for (const e of events) {
      if (e instanceof MoveMade) return e.move;
    }
    return null;
  }
}
