import { CastlingRights } from './value-objects/CastlingRights.js';
import { type Color, oppositeColor } from './value-objects/Color.js';
import type { Move } from './value-objects/Move.js';
import { Piece } from './value-objects/Piece.js';
import { Square } from './value-objects/Square.js';

export const INITIAL_FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export class BoardSnapshot {
  private constructor(
    private readonly squares: readonly (Piece | null)[],
    readonly sideToMove: Color,
    readonly castlingRights: CastlingRights,
    readonly enPassantTarget: Square | null,
    readonly halfmoveClock: number,
    readonly fullmoveNumber: number,
  ) {}

  static initial(): BoardSnapshot {
    return BoardSnapshot.fromFen(INITIAL_FEN);
  }

  static empty(): BoardSnapshot {
    return new BoardSnapshot(
      new Array<Piece | null>(64).fill(null),
      'white',
      CastlingRights.none(),
      null,
      0,
      1,
    );
  }

  static fromFen(fen: string): BoardSnapshot {
    const parts = fen.trim().split(/\s+/);
    if (parts.length < 4) {
      throw new Error(`Invalid FEN: "${fen}"`);
    }
    const placement = parts[0];
    const side = parts[1];
    const castling = parts[2];
    const ep = parts[3];
    const half = parts[4] ?? '0';
    const full = parts[5] ?? '1';
    if (!placement || !side || !castling || ep === undefined) {
      throw new Error(`Invalid FEN: "${fen}"`);
    }

    const squares: (Piece | null)[] = new Array<Piece | null>(64).fill(null);
    const ranks = placement.split('/');
    if (ranks.length !== 8) throw new Error(`Invalid FEN placement: "${placement}"`);

    for (let r = 0; r < 8; r++) {
      const rankStr = ranks[7 - r] ?? '';
      let file = 0;
      for (const ch of rankStr) {
        if (ch >= '1' && ch <= '8') {
          file += Number.parseInt(ch, 10);
        } else {
          if (file > 7) throw new Error(`Invalid FEN rank: "${rankStr}"`);
          squares[r * 8 + file] = Piece.fromSymbol(ch);
          file++;
        }
      }
      if (file !== 8) throw new Error(`Invalid FEN rank width: "${rankStr}"`);
    }

    if (side !== 'w' && side !== 'b') {
      throw new Error(`Invalid FEN side-to-move: "${side}"`);
    }

    return new BoardSnapshot(
      squares,
      side === 'w' ? 'white' : 'black',
      CastlingRights.fromFen(castling),
      ep === '-' ? null : Square.fromAlgebraic(ep),
      Number.parseInt(half, 10),
      Number.parseInt(full, 10),
    );
  }

  toFen(): string {
    const ranks: string[] = [];
    for (let r = 7; r >= 0; r--) {
      let s = '';
      let empty = 0;
      for (let f = 0; f < 8; f++) {
        const piece = this.squares[r * 8 + f];
        if (!piece) {
          empty++;
        } else {
          if (empty > 0) {
            s += empty.toString();
            empty = 0;
          }
          s += piece.symbol;
        }
      }
      if (empty > 0) s += empty.toString();
      ranks.push(s);
    }
    return [
      ranks.join('/'),
      this.sideToMove === 'white' ? 'w' : 'b',
      this.castlingRights.toFen(),
      this.enPassantTarget ? this.enPassantTarget.algebraic : '-',
      this.halfmoveClock.toString(),
      this.fullmoveNumber.toString(),
    ].join(' ');
  }

  positionKey(): string {
    return this.toFen().split(' ').slice(0, 4).join(' ');
  }

  pieceAt(square: Square): Piece | null {
    return this.squares[square.index] ?? null;
  }

  findKing(color: Color): Square {
    for (let i = 0; i < 64; i++) {
      const p = this.squares[i];
      if (p?.color === color && p.type === 'king') {
        return Square.fromIndex(i);
      }
    }
    throw new Error(`No ${color} king on the board`);
  }

  *pieces(): Generator<{ square: Square; piece: Piece }> {
    for (let i = 0; i < 64; i++) {
      const p = this.squares[i];
      if (p) yield { square: Square.fromIndex(i), piece: p };
    }
  }

  apply(move: Move): BoardSnapshot {
    const newSquares = this.squares.slice();
    const movingPiece = newSquares[move.from.index];
    if (!movingPiece) {
      throw new Error(`No piece on ${move.from.algebraic}`);
    }

    newSquares[move.from.index] = null;
    newSquares[move.to.index] = move.promotion
      ? Piece.of(movingPiece.color, move.promotion)
      : movingPiece;

    if (move.special === 'en-passant') {
      const capturedSq = Square.of(move.to.file, move.from.rank);
      newSquares[capturedSq.index] = null;
    }

    if (move.special === 'castle-king') {
      const r = move.from.rank;
      newSquares[Square.of(7, r).index] = null;
      newSquares[Square.of(5, r).index] = Piece.of(movingPiece.color, 'rook');
    } else if (move.special === 'castle-queen') {
      const r = move.from.rank;
      newSquares[Square.of(0, r).index] = null;
      newSquares[Square.of(3, r).index] = Piece.of(movingPiece.color, 'rook');
    }

    let rights = this.castlingRights;
    if (movingPiece.type === 'king') {
      rights = rights.removeColor(movingPiece.color);
    } else if (movingPiece.type === 'rook') {
      const homeRank = movingPiece.color === 'white' ? 0 : 7;
      if (move.from.rank === homeRank) {
        if (move.from.file === 0) rights = rights.remove(movingPiece.color, 'queen');
        else if (move.from.file === 7) rights = rights.remove(movingPiece.color, 'king');
      }
    }
    if (move.captured === 'rook') {
      const enemy = oppositeColor(movingPiece.color);
      const enemyHome = enemy === 'white' ? 0 : 7;
      if (move.to.rank === enemyHome) {
        if (move.to.file === 0) rights = rights.remove(enemy, 'queen');
        else if (move.to.file === 7) rights = rights.remove(enemy, 'king');
      }
    }

    let epTarget: Square | null = null;
    if (move.special === 'double-push') {
      const dir = movingPiece.color === 'white' ? 1 : -1;
      epTarget = Square.of(move.from.file, move.from.rank + dir);
    }

    let halfmove = this.halfmoveClock + 1;
    if (movingPiece.type === 'pawn' || move.captured !== null) halfmove = 0;

    let fullmove = this.fullmoveNumber;
    if (this.sideToMove === 'black') fullmove++;

    return new BoardSnapshot(
      newSquares,
      oppositeColor(this.sideToMove),
      rights,
      epTarget,
      halfmove,
      fullmove,
    );
  }
}
