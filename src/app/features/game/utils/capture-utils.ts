import {
  PIECE_SORT_ORDER,
  PIECE_VALUES,
} from '@app/features/game/config/piece-glyphs.js';
import type { CapturedMark } from '@app/shared/ui/CapturedPieces/types.js';
import type { Match, Move, PieceType } from '@modules/game/domain/game';

export interface CapturedPieces {
  byWhite: PieceType[];
  byBlack: PieceType[];
}

/** Структура для рендера через `<CapturedPieces>`-компонент (вместо v-html). */
export interface CapturedDisplay {
  readonly pieces: readonly CapturedMark[];
  readonly advantage: number;
}

export const EMPTY_CAPTURED: CapturedDisplay = { pieces: [], advantage: 0 };

export function getCaptured(match: Match): CapturedPieces {
  const byWhite: PieceType[] = [];
  const byBlack: PieceType[] = [];

  for (let i = 1; i < match.timeline.length; i++) {
    const prevSnap = match.timeline.entryAt(i - 1).snapshot;
    const entry = match.timeline.entryAt(i);
    const mv = entry.events.find((e) => e.type === 'MoveMade') as { move: Move } | undefined;
    if (!mv?.move.captured) continue;
    if (prevSnap.sideToMove === 'white') {
      byWhite.push(mv.move.captured);
    } else {
      byBlack.push(mv.move.captured);
    }
  }

  return { byWhite, byBlack };
}

/**
 * Готовит структурированные данные для `<CapturedPieces>`:
 * сортирует фигуры в каноническом порядке (Q-R-B-N-P) и определяет цвет
 * рендера (фигуру брал `side`, значит цвет фигуры противоположный).
 */
export function buildCapturedDisplay(
  pieces: readonly PieceType[],
  side: 'white' | 'black',
  advantage: number,
): CapturedDisplay {
  const capturedColor: 'white' | 'black' = side === 'white' ? 'black' : 'white';
  // Король не может быть «взят» в стандартных шахматах — фильтруем для безопасности.
  const filtered = pieces.filter((p): p is CapturedMark['piece'] => p !== 'king');
  const sorted = [...filtered].sort((a, b) => PIECE_SORT_ORDER[a] - PIECE_SORT_ORDER[b]);
  return {
    pieces: sorted.map<CapturedMark>((p) => ({ color: capturedColor, piece: p })),
    advantage,
  };
}

export function computeAdvantage(pieces: readonly PieceType[]): number {
  return pieces.reduce((sum, p) => sum + PIECE_VALUES[p], 0);
}
