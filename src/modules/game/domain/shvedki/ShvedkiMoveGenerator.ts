import {
  type BoardSnapshot,
  GameRules,
  MoveGenerator,
  oppositeColor,
  type PieceType,
  Square,
} from '@modules/game/domain/game';
import { applyDropToSnapshot } from './CrossBoardMoveService.js';
import type { DualReserves, PieceReserve } from './PieceReserve.js';
import type { ShvedkiMove } from './ShvedkiMove.js';

type ReservePieceType = Exclude<PieceType, 'king'>;

// Версия `validateDrop` без исключений — на горячем пути поиска. Возвращает snapshot после дропа или null.
const tryDrop = (
  snap: BoardSnapshot,
  reserves: DualReserves,
  piece: ReservePieceType,
  to: Square,
): BoardSnapshot | null => {
  if (snap.pieceAt(to)) return null;
  if (piece === 'pawn' && (to.rank === 0 || to.rank === 7)) return null;
  const pool = snap.sideToMove === 'white' ? reserves.white : reserves.black;
  if (pool.count(piece) <= 0) return null;
  const after = applyDropToSnapshot(snap, to, piece);
  if (GameRules.isInCheck(after, oppositeColor(snap.sideToMove))) return null;
  if (GameRules.isInCheck(after, snap.sideToMove)) return null;
  return after;
};

/**
 * Объединённый генератор шведочных ходов: обычные перемещения +
 * легальные дропы из резерва с учётом всех правил
 * (см. CrossBoardMoveService.validateDrop).
 */
export class ShvedkiMoveGenerator {
  static legalMoves(snap: BoardSnapshot, reserves: DualReserves): ShvedkiMove[] {
    const out: ShvedkiMove[] = [];
    for (const move of MoveGenerator.legalMoves(snap)) {
      out.push({ kind: 'normal', move });
    }
    const pool = snap.sideToMove === 'white' ? reserves.white : reserves.black;
    if (!pool.isEmpty()) {
      for (const piece of pool.available()) {
        for (let i = 0; i < 64; i++) {
          const sq = Square.fromIndex(i);
          if (tryDrop(snap, reserves, piece, sq)) {
            out.push({ kind: 'drop', piece, to: sq });
          }
        }
      }
    }
    return out;
  }

  /**
   * Иммутабельное применение для поиска: возвращает новый snapshot
   * и обновлённые резервы (только при дропе). Захваты не модифицируют
   * резервы — это явление 2-досок и в shallow-поиске не моделируется.
   */
  static applyMove(
    snap: BoardSnapshot,
    reserves: DualReserves,
    move: ShvedkiMove,
  ): { snap: BoardSnapshot; reserves: DualReserves } {
    if (move.kind === 'normal') {
      return { snap: snap.apply(move.move), reserves };
    }
    const after = applyDropToSnapshot(snap, move.to, move.piece);
    const pool: PieceReserve = snap.sideToMove === 'white' ? reserves.white : reserves.black;
    const updated = pool.remove(move.piece);
    const newReserves: DualReserves = {
      white: snap.sideToMove === 'white' ? updated : reserves.white,
      black: snap.sideToMove === 'black' ? updated : reserves.black,
    };
    return { snap: after, reserves: newReserves };
  }

  /**
   * Быстрая проверка наличия любого легального шведочного хода — для
   * детектирования терминальной позиции (мат/пат с учётом дропов).
   */
  static hasAnyMove(snap: BoardSnapshot, reserves: DualReserves): boolean {
    if (MoveGenerator.legalMoves(snap).length > 0) return true;
    const pool = snap.sideToMove === 'white' ? reserves.white : reserves.black;
    if (pool.isEmpty()) return false;
    for (const piece of pool.available()) {
      for (let i = 0; i < 64; i++) {
        if (tryDrop(snap, reserves, piece, Square.fromIndex(i))) return true;
      }
    }
    return false;
  }
}
