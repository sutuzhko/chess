export type Offset = readonly [number, number];

export const KNIGHT_OFFSETS: readonly Offset[] = [
  [1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1],
];

export const KING_OFFSETS: readonly Offset[] = [
  [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1],
];

export const BISHOP_DIRS: readonly Offset[] = [
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

export const ROOK_DIRS: readonly Offset[] = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
];

export const onBoard = (f: number, r: number): boolean =>
  f >= 0 && f < 8 && r >= 0 && r < 8;
