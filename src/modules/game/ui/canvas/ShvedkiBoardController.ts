import type {
  BoardSnapshot,
  Color,
  Move,
  PieceType,
  PromotionPiece,
  Square,
} from '@modules/game/domain/game';
import { MoveGenerator } from '@modules/game/domain/game';
import { moveToSan } from '@modules/game/domain/game/notation/San.js';
import {
  PIECE_LETTER,
} from '@modules/game/domain/game/value-objects/PieceType.js';
import type { BoardId, DualReserves } from '@modules/game/domain/shvedki';
import { CrossBoardMoveService, DualBoard } from '@modules/game/domain/shvedki';
import type {
  SerializedShvedkiState,
} from '@modules/game/infrastructure/persistence/ShvedkiStateStore.js';
import type { BoardDisplayOptions } from './BoardController.js';
import type {
  ShvedkiBoardControllerOptions,
  ShvedkiCaptureMap,
} from './shvedki/controller-types.js';
import { checkGameEnd, teamOf } from './shvedki/game-end.js';
import { renderBoards, renderReserves } from './shvedki/render-boards.js';
import {
  restoreShvedki,
  serializeShvedki,
  type ShvedkiEndReason,
  type ShvedkiGamePhase,
  type ShvedkiGameResult,
  type ShvedkiMoveRecord,
  type ShvedkiSerializableState,
} from './shvedki/serialization.js';

export type { ShvedkiEndReason, ShvedkiGameResult, ShvedkiGamePhase, ShvedkiMoveRecord };
export type { ShvedkiBoardControllerOptions, ShvedkiCaptureMap };

const DEFAULT_DISPLAY: BoardDisplayOptions = {
  showCoordinates: true, showLastMove: true, showHints: true,
};

export class ShvedkiBoardController {
  private dualBoard: DualBoard;
  private selectedA: Square | null = null;
  private selectedB: Square | null = null;
  private lastMoveA: Move | null = null;
  private lastMoveB: Move | null = null;
  private dropPending: { boardId: BoardId; piece: PieceType } | null = null;
  private phase: ShvedkiGamePhase = { kind: 'playing' };
  private capturedByA: { white: PieceType[]; black: PieceType[] } = { white: [], black: [] };
  private capturedByB: { white: PieceType[]; black: PieceType[] } = { white: [], black: [] };
  private movesA: ShvedkiMoveRecord[] = [];
  private movesB: ShvedkiMoveRecord[] = [];
  private mateBoardId: BoardId | null = null;

  constructor(private readonly opts: ShvedkiBoardControllerOptions) {
    this.dualBoard = DualBoard.initial();
  }

  mount(): void {
    this.opts.inputA.onSquareClick((sq) => { this.handleClick('A', sq); });
    this.opts.inputB.onSquareClick((sq) => { this.handleClick('B', sq); });
    this.render();
  }

  reset(): void {
    this.dualBoard = DualBoard.initial();
    this.selectedA = null;
    this.selectedB = null;
    this.lastMoveA = null;
    this.lastMoveB = null;
    this.dropPending = null;
    this.phase = { kind: 'playing' };
    this.capturedByA = { white: [], black: [] };
    this.capturedByB = { white: [], black: [] };
    this.movesA = [];
    this.movesB = [];
    this.mateBoardId = null;
    this.emitDerived();
    this.render();
  }

  rerender(): void { this.render(); }

  /** Команда {@link losingTeam} сдаётся. Завершает партию, вызывает onGameEnd. */
  resign(losingTeam: 1 | 2): void {
    if (this.phase.kind === 'finished') return;
    const result: ShvedkiGameResult = losingTeam === 1 ? 'team-2-wins' : 'team-1-wins';
    this.phase = { kind: 'finished', result };
    this.opts.onGameEnd?.(result, 'resign');
    this.render();
  }

  /** Команда {@link losingTeam} проиграла по времени. */
  loseOnTime(losingTeam: 1 | 2): void {
    if (this.phase.kind === 'finished') return;
    const result: ShvedkiGameResult = losingTeam === 1 ? 'team-2-wins' : 'team-1-wins';
    this.phase = { kind: 'finished', result };
    this.opts.onGameEnd?.(result, 'time');
    this.render();
  }

  detach(): void {
    this.opts.inputA.detach();
    this.opts.inputB.detach();
  }

  getSnapshot(boardId: BoardId): BoardSnapshot { return this.dualBoard.snapshot(boardId); }
  getReserves(boardId: BoardId): DualReserves { return this.dualBoard.reserves(boardId); }
  getPhase(): ShvedkiGamePhase { return this.phase; }
  hasMoves(): boolean { return this.movesA.length > 0 || this.movesB.length > 0; }

  serialize(): SerializedShvedkiState {
    return serializeShvedki({
      dualBoard: this.dualBoard,
      capturedByA: this.capturedByA,
      capturedByB: this.capturedByB,
      movesA: this.movesA,
      movesB: this.movesB,
      mateBoardId: this.mateBoardId,
      phase: this.phase,
    });
  }

  restore(state: SerializedShvedkiState): void {
    const restored = restoreShvedki(state);
    this.dualBoard = restored.dualBoard;
    this.capturedByA = restored.capturedByA;
    this.capturedByB = restored.capturedByB;
    this.movesA = restored.movesA;
    this.movesB = restored.movesB;
    this.mateBoardId = restored.mateBoardId;
    this.phase = restored.phase;
    this.selectedA = null;
    this.selectedB = null;
    this.lastMoveA = null;
    this.lastMoveB = null;
    this.dropPending = null;
    this.emitDerived();
    this.render();
  }

  applyAiMove(boardId: BoardId, from: Square, to: Square, promotion?: PromotionPiece): void {
    if (!this.canActOn(boardId)) return;
    const snap = this.dualBoard.snapshot(boardId);
    const legalMoves = MoveGenerator.legalMoves(snap);
    const move = legalMoves.find((m) => m.matches(from, to, promotion));
    if (!move) return;
    try {
      CrossBoardMoveService.applyMove(this.dualBoard, {
        kind: 'normal',
        boardId,
        from,
        to,
        ...(move.promotion ? { promotion: move.promotion } : {}),
      });
      if (boardId === 'A') { this.lastMoveA = move; this.selectedA = null; }
      else { this.lastMoveB = move; this.selectedB = null; }
    } catch { return; }
    const movedColor = snap.sideToMove;
    this.trackMove(boardId, movedColor, snap, move);
    if (move.captured) this.trackCapture(boardId, movedColor, move.captured);
    this.runCheckGameEnd(boardId);
    this.emitDerived();
    this.render();
    this.opts.onMoveMade?.(boardId, movedColor);
  }

  applyAiDrop(boardId: BoardId, piece: PieceType, to: Square): void {
    if (!this.canActOn(boardId)) return;
    const snap = this.dualBoard.snapshot(boardId);
    const movedColor = snap.sideToMove;
    try {
      CrossBoardMoveService.applyMove(this.dualBoard, { kind: 'drop', boardId, piece, to });
    } catch { return; }
    if (boardId === 'A') { this.lastMoveA = null; this.selectedA = null; }
    else { this.lastMoveB = null; this.selectedB = null; }
    this.trackDrop(boardId, movedColor, piece, to);
    this.runCheckGameEnd(boardId);
    this.emitDerived();
    this.render();
    this.opts.onMoveMade?.(boardId, movedColor);
  }

  private isHumanColorOnBoard(boardId: BoardId, color: Color): boolean {
    const ai = this.opts.aiColorOnBoard?.(boardId) ?? null;
    return ai !== color;
  }

  private trackCapture(boardId: BoardId, capturer: Color, captured: PieceType): void {
    const target = boardId === 'A' ? this.capturedByA : this.capturedByB;
    if (capturer === 'white') target.white.push(captured);
    else target.black.push(captured);
  }

  private trackMove(boardId: BoardId, color: Color, before: BoardSnapshot, move: Move): void {
    let san: string;
    try { san = moveToSan(before, move); } catch { san = move.toUci(); }
    const list = boardId === 'A' ? this.movesA : this.movesB;
    list.push({ boardId, color, san, index: list.length });
  }

  private trackDrop(boardId: BoardId, color: Color, piece: PieceType, to: Square): void {
    const san = `${PIECE_LETTER[piece]}@${to.algebraic}`;
    const list = boardId === 'A' ? this.movesA : this.movesB;
    list.push({ boardId, color, san, index: list.length });
  }

  private emitDerived(): void {
    this.opts.onCapturesChanged?.({
      whiteA: [...this.capturedByA.white],
      blackA: [...this.capturedByA.black],
      whiteB: [...this.capturedByB.white],
      blackB: [...this.capturedByB.black],
    });
    this.opts.onMovesChanged?.([...this.movesA], [...this.movesB]);
  }

  private canActOn(boardId: BoardId): boolean {
    if (this.phase.kind === 'finished') return false;
    if (this.phase.kind === 'last-move') return this.phase.boardId === boardId;
    return true;
  }

  private runCheckGameEnd(movedBoardId: BoardId): void {
    // `state` ниже — это «снимок» полей контроллера, который checkGameEnd мутирует:
    // переприсваивает state.phase и state.mateBoardId. Поскольку присваивание свойства
    // объекта не пробрасывается обратно в this.phase / this.mateBoardId, после вызова
    // мы вручную считываем мутированные значения и применяем их на контроллер.
    const state: ShvedkiSerializableState = {
      dualBoard: this.dualBoard,
      capturedByA: this.capturedByA, capturedByB: this.capturedByB,
      movesA: this.movesA, movesB: this.movesB,
      mateBoardId: this.mateBoardId, phase: this.phase,
    };
    checkGameEnd({
      state,
      movedBoardId,
      formatMateStatus: this.opts.formatMateStatus,
      onStatusUpdate: this.opts.onStatusUpdate,
      ...(this.opts.onLastMoveStarted ? { onLastMoveStarted: this.opts.onLastMoveStarted } : {}),
      ...(this.opts.onGameEnd ? { onGameEnd: this.opts.onGameEnd } : {}),
    });
    this.phase = state.phase;
    this.mateBoardId = state.mateBoardId;
  }

  private render(): void {
    const display = this.opts.displayOptions?.() ?? DEFAULT_DISPLAY;
    const { snapA, snapB } = renderBoards({
      dualBoard: this.dualBoard,
      viewA: this.opts.viewA,
      viewB: this.opts.viewB,
      selectedA: this.selectedA,
      selectedB: this.selectedB,
      lastMoveA: this.lastMoveA,
      lastMoveB: this.lastMoveB,
      display,
    });

    renderReserves({
      dualBoard: this.dualBoard,
      phase: this.phase,
      dropPending: this.dropPending,
      reserveAWhiteEl: this.opts.reserveAWhiteEl(),
      reserveABlackEl: this.opts.reserveABlackEl(),
      reserveBWhiteEl: this.opts.reserveBWhiteEl(),
      reserveBBlackEl: this.opts.reserveBBlackEl(),
      isHumanColor: (b, c) => this.isHumanColorOnBoard(b, c),
      onPick: (boardId, piece) => {
        const isSelected =
          this.dropPending?.boardId === boardId && this.dropPending.piece === piece;
        this.dropPending = isSelected ? null : { boardId, piece };
        this.render();
      },
    });

    this.opts.onTurnUpdate(snapA.sideToMove, snapB.sideToMove);
    if (this.phase.kind === 'playing') {
      this.opts.onStatusUpdate(
        this.opts.formatPlayingStatus(snapA.sideToMove, snapB.sideToMove),
      );
    }
  }

  private handleClick(boardId: BoardId, sq: Square): void {
    if (!this.canActOn(boardId)) return;
    // В фазе спасения (last-move) ходить может любая сторона на доске спасения —
    // окно длиной RESCUE_PLIES_BUDGET полуходов, по обычным правилам очередности.

    const snap = this.dualBoard.snapshot(boardId);
    if (!this.isHumanColorOnBoard(boardId, snap.sideToMove)) return;
    const curSelected = boardId === 'A' ? this.selectedA : this.selectedB;

    if (this.dropPending?.boardId === boardId) {
      this.tryHumanDrop(boardId, sq);
      return;
    }

    if (curSelected) {
      this.tryHumanMove(boardId, sq, snap, curSelected);
      return;
    }

    const piece = snap.pieceAt(sq);
    if (piece?.color === snap.sideToMove) {
      if (boardId === 'A') this.selectedA = sq;
      else this.selectedB = sq;
      this.render();
    }
  }

  private tryHumanDrop(boardId: BoardId, sq: Square): void {
    if (!this.dropPending) return;
    const snap = this.dualBoard.snapshot(boardId);
    const movedColor = snap.sideToMove;
    const droppedPiece = this.dropPending.piece;
    let dropped = false;
    try {
      CrossBoardMoveService.applyMove(this.dualBoard, {
        kind: 'drop', boardId, piece: droppedPiece, to: sq,
      });
      if (boardId === 'A') this.lastMoveA = null;
      else this.lastMoveB = null;
      dropped = true;
    } catch (e) {
      this.opts.onIllegalDrop((e as Error).message);
    }
    this.dropPending = null;
    if (dropped) {
      this.trackDrop(boardId, movedColor, droppedPiece, sq);
      this.runCheckGameEnd(boardId);
      this.emitDerived();
    }
    this.render();
    if (dropped) this.opts.onMoveMade?.(boardId, movedColor);
  }

  private tryHumanMove(boardId: BoardId, sq: Square, snap: BoardSnapshot, from: Square): void {
    if (from.equals(sq)) {
      if (boardId === 'A') this.selectedA = null;
      else this.selectedB = null;
      this.render();
      return;
    }
    const candidates = MoveGenerator.legalMoves(snap).filter(
      (m) => m.from.equals(from) && m.to.equals(sq),
    );
    if (candidates.length > 0) {
      const first = candidates[0];
      if (!first) { this.render(); return; }
      const movedColor = snap.sideToMove;
      let moved = false;
      try {
        CrossBoardMoveService.applyMove(this.dualBoard, {
          kind: 'normal', boardId, from, to: sq,
          ...(first.promotion ? { promotion: first.promotion } : {}),
        });
        if (boardId === 'A') { this.lastMoveA = first; this.selectedA = null; }
        else { this.lastMoveB = first; this.selectedB = null; }
        moved = true;
      } catch {
        if (boardId === 'A') this.selectedA = null;
        else this.selectedB = null;
      }
      if (moved) {
        this.trackMove(boardId, movedColor, snap, first);
        if (first.captured) this.trackCapture(boardId, movedColor, first.captured);
        this.runCheckGameEnd(boardId);
        this.emitDerived();
      }
      this.render();
      if (moved) this.opts.onMoveMade?.(boardId, movedColor);
      return;
    }
    const piece = snap.pieceAt(sq);
    const next = piece?.color === snap.sideToMove ? sq : null;
    if (boardId === 'A') this.selectedA = next;
    else this.selectedB = next;
    this.render();
  }
}

export { teamOf };
