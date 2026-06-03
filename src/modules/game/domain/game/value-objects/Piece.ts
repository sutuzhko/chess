import type { Color } from './Color.js';
import {
  type PieceType,
  pieceTypeFromLetter,
  pieceTypeToFenSymbol,
} from './PieceType.js';

export class Piece {
  private constructor(
    readonly color: Color,
    readonly type: PieceType,
  ) {}

  private static readonly cache = new Map<string, Piece>();

  static of(color: Color, type: PieceType): Piece {
    const key = `${color}:${type}`;
    let cached = Piece.cache.get(key);
    if (!cached) {
      cached = new Piece(color, type);
      Piece.cache.set(key, cached);
    }
    return cached;
  }

  static fromSymbol(symbol: string): Piece {
    if (symbol.length !== 1) {
      throw new Error(`Invalid piece symbol: "${symbol}"`);
    }
    const type = pieceTypeFromLetter(symbol);
    if (!type) {
      throw new Error(`Unknown piece symbol: "${symbol}"`);
    }
    const color: Color = symbol === symbol.toUpperCase() ? 'white' : 'black';
    return Piece.of(color, type);
  }

  get symbol(): string {
    return pieceTypeToFenSymbol(this.type, this.color);
  }

  equals(other: Piece): boolean {
    return this.color === other.color && this.type === other.type;
  }

  toString(): string {
    return this.symbol;
  }
}
