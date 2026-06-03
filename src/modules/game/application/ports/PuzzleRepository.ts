import type { Puzzle, PuzzleData } from '@modules/game/domain/puzzles';

export interface PuzzleListFilter {
  readonly themes?: readonly string[];
  readonly minElo?: number;
  readonly maxElo?: number;
  readonly source?: 'bundled' | 'custom' | 'all';
  readonly query?: string;
}

export interface PuzzleRepository {
  list(filter?: PuzzleListFilter): Puzzle[];
  get(id: string): Puzzle | null;
  saveCustom(data: PuzzleData): Puzzle;
  deleteCustom(id: string): void;
  exportCustom(): PuzzleData[];
  importCustom(data: readonly PuzzleData[]): number;
}
