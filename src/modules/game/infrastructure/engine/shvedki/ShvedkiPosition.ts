import type { BoardSnapshot, Color } from '@modules/game/domain/game';
import type { DualReserves } from '@modules/game/domain/shvedki';

/**
 * Лёгкая структура позиции для шведочного поиска: snapshot одной доски +
 * резервы обеих сторон на ЭТОЙ доске. Партнёрская доска и её резерв в
 * shallow-поиске не моделируются.
 */
export interface ShvedkiPosition {
  readonly snap: BoardSnapshot;
  readonly reserves: DualReserves;
}

export const sideToMoveOf = (pos: ShvedkiPosition): Color => pos.snap.sideToMove;
