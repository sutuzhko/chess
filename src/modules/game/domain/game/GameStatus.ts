import type { Color } from './value-objects/Color.js';

export type GameStatus =
  | { kind: 'in-progress' }
  | { kind: 'checkmate'; winner: Color }
  | { kind: 'stalemate' }
  | { kind: 'draw-50-move' }
  | { kind: 'draw-insufficient-material' }
  | { kind: 'draw-threefold-repetition' }
  | { kind: 'resignation'; winner: Color }
  | { kind: 'agreed-draw' }
  | { kind: 'time-forfeit'; winner: Color };

export const isTerminal = (s: GameStatus): boolean => s.kind !== 'in-progress';
