import {
  type EngineMove,
  squareToAlgebraic,
} from '@engine/core/EnginePosition.js';

export const MATE = 30000;
export const INF = 32000;

export interface RootMove {
  readonly uci: string;
  readonly score: number;
}

export interface SearchResult {
  bestMove: EngineMove | null;
  bestUci: string | null;
  score: number;
  depth: number;
  nodes: number;
  pv: string[];
  elapsedMs: number;
  rootMoves: RootMove[];
}

export interface SearchOptions {
  maxDepth?: number;
  maxTimeMs?: number;
  onProgress?: (info: SearchResult) => void;
  shouldStop?: () => boolean;
}

const PROMO_LETTER: Record<number, string> = {
  2: 'n',
  3: 'b',
  4: 'r',
  5: 'q',
};

export const moveToUci = (m: EngineMove): string => {
  let s = squareToAlgebraic(m.from) + squareToAlgebraic(m.to);
  if (m.promotion) s += PROMO_LETTER[m.promotion];
  return s;
};

export const sameMove = (a: EngineMove, b: EngineMove): boolean =>
  a.from === b.from && a.to === b.to && a.promotion === b.promotion && a.special === b.special;
