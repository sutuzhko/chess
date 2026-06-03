export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;
export type ThemeName = typeof THEME[keyof typeof THEME];

export const ACCENT = {
  SILVER: 'silver',
  GOLD: 'gold',
  GREEN: 'green',
  BLUE: 'blue',
  COPPER: 'copper',
  PURPLE: 'purple',
} as const;
export type AccentName = typeof ACCENT[keyof typeof ACCENT];

export const BOARD = {
  WOOD: 'wood',
  GREEN: 'green',
  BLUE: 'blue',
  WALNUT: 'walnut',
  MONO: 'mono',
  LAVENDER: 'lavender',
  PURPLE: 'purple',
  ICE: 'ice',
} as const;
export type BoardName = typeof BOARD[keyof typeof BOARD];

export const DENSITY = {
  COMPACT: 'compact',
  NORMAL: 'normal',
  COMFY: 'comfy',
} as const;
export type DensityName = typeof DENSITY[keyof typeof DENSITY];

export const LANG = {
  RU: 'ru',
  EN: 'en',
  ES: 'es',
} as const;
export type LangName = typeof LANG[keyof typeof LANG];

export const PIECE_SET = {
  CLASSIC: 'classic',
  MODERN: 'modern',
  MINIMAL: 'minimal',
  NEON: 'neon',
} as const;
export type PieceSetName = typeof PIECE_SET[keyof typeof PIECE_SET];
