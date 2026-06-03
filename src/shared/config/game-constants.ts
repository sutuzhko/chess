export const GAME_MODE = {
  STANDARD: 'standard',
  SHVEDKI: 'shvedki',
  OPENING_TRAINING: 'opening_training',
} as const;
export type GameMode = typeof GAME_MODE[keyof typeof GAME_MODE];

export const OPPONENT = {
  AI: 'ai',
  HOTSEAT: 'hotseat',
} as const;
export type OpponentType = typeof OPPONENT[keyof typeof OPPONENT];

export const AI_SIDE = {
  OFF: 'off',
  WHITE: 'white',
  BLACK: 'black',
} as const;
export type AiSide = typeof AI_SIDE[keyof typeof AI_SIDE];

export const PLAYER_SIDE = {
  WHITE: 'white',
  BLACK: 'black',
  RANDOM: 'random',
} as const;
export type PlayerSide = typeof PLAYER_SIDE[keyof typeof PLAYER_SIDE];
