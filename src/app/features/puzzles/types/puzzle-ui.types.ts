import type {
  PuzzleEloRangeId,
} from '@app/features/puzzles/config/puzzle-elo-ranges.js';

export interface PuzzleFilterState {
  themes: string[];
  elo: PuzzleEloRangeId;
  query: string;
}

export const EMPTY_FILTERS: PuzzleFilterState = {
  themes: [],
  elo: 'all',
  query: '',
};
