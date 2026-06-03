import type { Color } from './Color.js';

export type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';

export type PromotionPiece = 'queen' | 'rook' | 'bishop' | 'knight';

export const isPromotionPiece = (t: PieceType): t is PromotionPiece =>
  t === 'queen' || t === 'rook' || t === 'bishop' || t === 'knight';

export const PIECE_LETTER: Record<PieceType, string> = {
  pawn: 'P',
  knight: 'N',
  bishop: 'B',
  rook: 'R',
  queen: 'Q',
  king: 'K',
} as const;

const LETTER_TO_PIECE_TYPE: Record<string, PieceType> = {
  P: 'pawn',
  N: 'knight',
  B: 'bishop',
  R: 'rook',
  Q: 'queen',
  K: 'king',
};

export const pieceTypeFromLetter = (letter: string): PieceType | null =>
  LETTER_TO_PIECE_TYPE[letter.toUpperCase()] ?? null;

export const pieceTypeToFenSymbol = (type: PieceType, color: Color): string => {
  const u = PIECE_LETTER[type];
  return color === 'white' ? u : u.toLowerCase();
};

export const fenSymbolToPieceType = (symbol: string): PieceType | null =>
  pieceTypeFromLetter(symbol);
