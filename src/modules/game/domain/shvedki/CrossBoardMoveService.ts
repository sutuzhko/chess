import type {
  PieceType,
  PromotionPiece,
  Square,
} from '@modules/game/domain/game';
import {
  BoardSnapshot,
  GameRules,
  MoveGenerator,
  oppositeColor,
  Piece,
} from '@modules/game/domain/game';
import type { DualBoard } from './DualBoard.js';
import { type BoardId } from './DualBoard.js';
import { addToReserve, type DualReserves } from './PieceReserve.js';

export type CrossBoardMove =
  | { kind: 'normal'; boardId: BoardId; from: Square; to: Square; promotion?: PromotionPiece }
  | { kind: 'drop'; boardId: BoardId; piece: PieceType; to: Square };

export class IllegalCrossBoardMoveError extends Error {}

const otherBoard = (id: BoardId): BoardId => (id === 'A' ? 'B' : 'A');

export const applyDropToFen = (snap: BoardSnapshot, to: Square, piece: PieceType): string =>
  applyDropSnapshot(snap, to, piece).toFen();

export const applyDropToSnapshot = (
  snap: BoardSnapshot,
  to: Square,
  piece: PieceType,
): BoardSnapshot => applyDropSnapshot(snap, to, piece);

/**
 * Чистая валидация дропа без побочных эффектов. Возвращает snapshot после
 * дропа, либо бросает IllegalCrossBoardMoveError. Используется и в
 * `applyDrop`, и в
 * `ShvedkiMoveGenerator.legalMoves` — общая реализация правил.
 */
export const validateDrop = (
  snap: BoardSnapshot,
  reserves: DualReserves,
  piece: PieceType,
  to: Square,
): BoardSnapshot => {
  if (piece === 'king') {
    throw new IllegalCrossBoardMoveError('Cannot drop a king');
  }
  if (snap.pieceAt(to)) {
    throw new IllegalCrossBoardMoveError('Drop target is occupied');
  }
  if (piece === 'pawn' && (to.rank === 0 || to.rank === 7)) {
    throw new IllegalCrossBoardMoveError('Cannot drop a pawn on the first or last rank');
  }
  const pool = snap.sideToMove === 'white' ? reserves.white : reserves.black;
  if (pool.count(piece) <= 0) {
    throw new IllegalCrossBoardMoveError(`No ${piece} available in reserve`);
  }

  const after = applyDropSnapshot(snap, to, piece);

  if (GameRules.isInCheck(after, oppositeColor(snap.sideToMove))) {
    throw new IllegalCrossBoardMoveError('Cannot drop a piece to give check');
  }
  if (GameRules.isInCheck(after, snap.sideToMove)) {
    throw new IllegalCrossBoardMoveError('Drop leaves own king in check');
  }

  return after;
};

const applyDropSnapshot = (snap: BoardSnapshot, to: Square, piece: PieceType): BoardSnapshot => {
  const parts = snap.toFen().split(' ');
  const ranks = (parts[0] ?? '').split('/');
  const rIdx = 7 - to.rank;
  const expanded = (ranks[rIdx] ?? '').replace(/\d/g, (d) => '.'.repeat(Number(d)));
  const chars = expanded.split('');
  chars[to.file] = Piece.of(snap.sideToMove, piece).symbol;
  let collapsed = '';
  let empty = 0;
  for (const ch of chars) {
    if (ch === '.') empty++;
    else {
      if (empty > 0) {
        collapsed += empty.toString();
        empty = 0;
      }
      collapsed += ch;
    }
  }
  if (empty > 0) collapsed += empty.toString();
  ranks[rIdx] = collapsed;
  parts[0] = ranks.join('/');
  parts[1] = snap.sideToMove === 'white' ? 'b' : 'w';
  parts[3] = '-';
  parts[4] = '0';
  if (snap.sideToMove === 'black') parts[5] = String(Number(parts[5]) + 1);
  return BoardSnapshot.fromFen(parts.join(' '));
};

export class CrossBoardMoveService {
  static applyMove(dual: DualBoard, move: CrossBoardMove): void {
    if (move.kind === 'normal') {
      CrossBoardMoveService.applyNormal(dual, move);
    } else {
      CrossBoardMoveService.applyDrop(dual, move);
    }
  }

  private static applyNormal(
    dual: DualBoard,
    move: { boardId: BoardId; from: Square; to: Square; promotion?: PromotionPiece },
  ): void {
    const snap = dual.snapshot(move.boardId);
    const candidate = MoveGenerator.legalMoves(snap).find((m) =>
      m.matches(move.from, move.to, move.promotion ?? null),
    );
    if (!candidate) {
      throw new IllegalCrossBoardMoveError(
        `Illegal move on board ${move.boardId}: ${move.from.algebraic}${move.to.algebraic}`,
      );
    }
    const after = snap.apply(candidate);
    dual.setSnapshot(move.boardId, after);

    if (candidate.captured) {
      const capturer = snap.sideToMove;
      const targetBoard = otherBoard(move.boardId);
      const targetReserves = dual.reserves(targetBoard);
      // На другой доске тот же игрок играет противоположным цветом — фигура достаётся ему
      dual.setReserves(targetBoard, addToReserve(targetReserves, oppositeColor(capturer), candidate.captured));
    }
  }

  private static applyDrop(
    dual: DualBoard,
    move: { boardId: BoardId; piece: PieceType; to: Square },
  ): void {
    const snap = dual.snapshot(move.boardId);
    const reserves = dual.reserves(move.boardId);
    const after = validateDrop(snap, reserves, move.piece, move.to);

    dual.setSnapshot(move.boardId, after);
    const pool = snap.sideToMove === 'white' ? reserves.white : reserves.black;
    const updatedPool = pool.remove(move.piece as Exclude<PieceType, 'king'>);
    dual.setReserves(move.boardId, {
      white: snap.sideToMove === 'white' ? updatedPool : reserves.white,
      black: snap.sideToMove === 'black' ? updatedPool : reserves.black,
    });
  }
}
