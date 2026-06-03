import type { Color } from './Color.js';

export type CastlingSide = 'king' | 'queen';

export const CASTLING_FEN_LETTER = {
  whiteKing: 'K',
  whiteQueen: 'Q',
  blackKing: 'k',
  blackQueen: 'q',
} as const;

export class CastlingRights {
  private constructor(
    readonly whiteKingSide: boolean,
    readonly whiteQueenSide: boolean,
    readonly blackKingSide: boolean,
    readonly blackQueenSide: boolean,
  ) {}

  static initial(): CastlingRights {
    return new CastlingRights(true, true, true, true);
  }

  static none(): CastlingRights {
    return new CastlingRights(false, false, false, false);
  }

  static fromFen(s: string): CastlingRights {
    if (s === '-') return CastlingRights.none();
    return new CastlingRights(
      s.includes(CASTLING_FEN_LETTER.whiteKing),
      s.includes(CASTLING_FEN_LETTER.whiteQueen),
      s.includes(CASTLING_FEN_LETTER.blackKing),
      s.includes(CASTLING_FEN_LETTER.blackQueen),
    );
  }

  has(color: Color, side: CastlingSide): boolean {
    if (color === 'white') {
      return side === 'king' ? this.whiteKingSide : this.whiteQueenSide;
    }
    return side === 'king' ? this.blackKingSide : this.blackQueenSide;
  }

  remove(color: Color, side: CastlingSide): CastlingRights {
    if (!this.has(color, side)) return this;
    return new CastlingRights(
      color === 'white' && side === 'king' ? false : this.whiteKingSide,
      color === 'white' && side === 'queen' ? false : this.whiteQueenSide,
      color === 'black' && side === 'king' ? false : this.blackKingSide,
      color === 'black' && side === 'queen' ? false : this.blackQueenSide,
    );
  }

  removeColor(color: Color): CastlingRights {
    if (color === 'white') {
      if (!this.whiteKingSide && !this.whiteQueenSide) return this;
      return new CastlingRights(false, false, this.blackKingSide, this.blackQueenSide);
    }
    if (!this.blackKingSide && !this.blackQueenSide) return this;
    return new CastlingRights(this.whiteKingSide, this.whiteQueenSide, false, false);
  }

  toFen(): string {
    let s = '';
    if (this.whiteKingSide) s += CASTLING_FEN_LETTER.whiteKing;
    if (this.whiteQueenSide) s += CASTLING_FEN_LETTER.whiteQueen;
    if (this.blackKingSide) s += CASTLING_FEN_LETTER.blackKing;
    if (this.blackQueenSide) s += CASTLING_FEN_LETTER.blackQueen;
    return s === '' ? '-' : s;
  }

  equals(other: CastlingRights): boolean {
    return (
      this.whiteKingSide === other.whiteKingSide &&
      this.whiteQueenSide === other.whiteQueenSide &&
      this.blackKingSide === other.blackKingSide &&
      this.blackQueenSide === other.blackQueenSide
    );
  }
}
