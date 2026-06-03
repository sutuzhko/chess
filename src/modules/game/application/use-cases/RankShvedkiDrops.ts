import type {
  BoardSnapshot,
  Color,
  PieceType,
} from '@modules/game/domain/game';
import { Square } from '@modules/game/domain/game';
import type { DualReserves } from '@modules/game/domain/shvedki';
import { applyDropToFen } from '@modules/game/domain/shvedki';

export interface RankedDrop {
  readonly piece: PieceType;
  readonly to: Square;
  readonly rank: number;
}

const PIECE_HEURISTIC: Record<PieceType, number> = {
  pawn: 100, knight: 320, bishop: 330, rook: 500, queen: 900, king: 0,
};

/**
 * Эвристическое ранжирование Shvedki-drop'ов без обращения к движку —
 * центр доски, продвижение по линии, ценность фигуры. Используется
 * app-слоем (shvedki-ai), чтобы сократить перебор кандидатов перед
 * глубоким перебором engine'ом.
 */
export class RankShvedkiDropsUseCase {
  execute(
    snap: BoardSnapshot,
    reserves: DualReserves,
    aiColor: Color,
  ): RankedDrop[] {
    const pool = aiColor === 'white' ? reserves.white : reserves.black;
    if (pool.isEmpty()) return [];

    const all: RankedDrop[] = [];
    for (const piece of pool.available()) {
      for (let i = 0; i < 64; i++) {
        const sq = Square.fromIndex(i);
        if (snap.pieceAt(sq)) continue;
        if (piece === 'pawn' && (sq.rank === 0 || sq.rank === 7)) continue;
        const centerDist = Math.max(Math.abs(sq.file - 3.5), Math.abs(sq.rank - 3.5));
        const advance = aiColor === 'white' ? sq.rank : 7 - sq.rank;
        const rank = -centerDist + advance * 0.5 + PIECE_HEURISTIC[piece] * 0.001;
        all.push({ piece, to: sq, rank });
      }
    }
    all.sort((a, b) => b.rank - a.rank);
    return all;
  }
}

/**
 * Применяет drop к снапшоту и возвращает FEN — нужен для оценки
 * кандидата движком. Изолирует обращение к domain.shvedki от app-слоя.
 */
export class BuildFenAfterShvedkiDropUseCase {
  execute(snap: BoardSnapshot, to: Square, piece: PieceType): string {
    return applyDropToFen(snap, to, piece);
  }
}
