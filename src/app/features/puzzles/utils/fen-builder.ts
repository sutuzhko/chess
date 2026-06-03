import type { Color } from '@modules/game/domain/game';
import type {
  PieceType,
} from '@modules/game/domain/game/value-objects/PieceType.js';

export type { Color };

export interface PlacedPiece {
  readonly color: Color;
  readonly type: PieceType;
}

export interface CastlingFlags {
  whiteKing: boolean;
  whiteQueen: boolean;
  blackKing: boolean;
  blackQueen: boolean;
}

const PIECE_LETTER_LOWER: Record<PieceType, string> = {
  pawn: 'p',
  knight: 'n',
  bishop: 'b',
  rook: 'r',
  queen: 'q',
  king: 'k',
};

const CASTLING_LETTER = { whiteKing: 'K', whiteQueen: 'Q', blackKing: 'k', blackQueen: 'q' } as const;

const LETTER_TO_TYPE: Record<string, PieceType> = {
  p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king',
};

export function pieceToSymbol(p: PlacedPiece): string {
  const s = PIECE_LETTER_LOWER[p.type];
  return p.color === 'white' ? s.toUpperCase() : s;
}

export function squareIndex(file: number, rank: number): number {
  return rank * 8 + file;
}

export function squaresToPlacement(squares: readonly (PlacedPiece | null)[]): string {
  const ranks: string[] = [];
  for (let r = 7; r >= 0; r--) {
    let s = '';
    let empty = 0;
    for (let f = 0; f < 8; f++) {
      const p = squares[squareIndex(f, r)];
      if (!p) {
        empty++;
      } else {
        if (empty > 0) {
          s += empty.toString();
          empty = 0;
        }
        s += pieceToSymbol(p);
      }
    }
    if (empty > 0) s += empty.toString();
    ranks.push(s);
  }
  return ranks.join('/');
}

export function castlingToFen(c: CastlingFlags): string {
  let s = '';
  if (c.whiteKing) s += CASTLING_LETTER.whiteKing;
  if (c.whiteQueen) s += CASTLING_LETTER.whiteQueen;
  if (c.blackKing) s += CASTLING_LETTER.blackKing;
  if (c.blackQueen) s += CASTLING_LETTER.blackQueen;
  return s === '' ? '-' : s;
}

export function buildFen(
  squares: readonly (PlacedPiece | null)[],
  sideToMove: Color,
  castling: CastlingFlags,
): string {
  return [
    squaresToPlacement(squares),
    sideToMove === 'white' ? 'w' : 'b',
    castlingToFen(castling),
    '-',
    '0',
    '1',
  ].join(' ');
}

export function placementFromFen(fen: string): {
  squares: (PlacedPiece | null)[];
  sideToMove: Color;
  castling: CastlingFlags;
} {
  const parts = fen.trim().split(/\s+/);
  const placement = parts[0] ?? '';
  const side = parts[1] ?? 'w';
  const castling = parts[2] ?? '-';
  const ranks = placement.split('/');
  if (ranks.length !== 8) throw new Error('Invalid FEN placement');

  const squares: (PlacedPiece | null)[] = new Array<PlacedPiece | null>(64).fill(null);
  for (let r = 0; r < 8; r++) {
    const rankStr = ranks[7 - r] ?? '';
    let file = 0;
    for (const ch of rankStr) {
      if (ch >= '1' && ch <= '8') {
        file += Number.parseInt(ch, 10);
      } else {
        const lower = ch.toLowerCase();
        const type = LETTER_TO_TYPE[lower];
        if (!type) throw new Error(`Invalid piece symbol: "${ch}"`);
        const color: Color = ch === lower ? 'black' : 'white';
        squares[squareIndex(file, r)] = { color, type };
        file++;
      }
    }
    if (file !== 8) throw new Error('Invalid FEN rank width');
  }

  return {
    squares,
    sideToMove: side === 'b' ? 'black' : 'white',
    castling: {
      whiteKing: castling.includes(CASTLING_LETTER.whiteKing),
      whiteQueen: castling.includes(CASTLING_LETTER.whiteQueen),
      blackKing: castling.includes(CASTLING_LETTER.blackKing),
      blackQueen: castling.includes(CASTLING_LETTER.blackQueen),
    },
  };
}

export function emptySquares(): (PlacedPiece | null)[] {
  return new Array<PlacedPiece | null>(64).fill(null);
}

export const INITIAL_FEN_BUILDER =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const EMPTY_FEN = '8/8/8/8/8/8/8/8 w - - 0 1';
