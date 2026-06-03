export const PUZZLE_ELO_RANGES = [
  { id: 'all', label: 'Любой', min: 0, max: 9999 },
  { id: 'beginner', label: 'Легкий', min: 0, max: 900 },
  { id: 'amateur', label: 'Умеренный', min: 900, max: 1700 },
  { id: 'expert', label: 'Сложный', min: 1700, max: 9999 },
] as const;

export type PuzzleEloRangeId = (typeof PUZZLE_ELO_RANGES)[number]['id'];
export const DEFAULT_ELO_RANGE: PuzzleEloRangeId = 'all';

export function getEloRange(id: PuzzleEloRangeId): { min: number; max: number } {
  const r = PUZZLE_ELO_RANGES.find((x) => x.id === id) ?? PUZZLE_ELO_RANGES[0];
  return { min: r.min, max: r.max };
}
