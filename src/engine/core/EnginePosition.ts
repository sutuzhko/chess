import { Zobrist } from './Zobrist.js';

export const EMPTY = 0;
export const WP = 1, WN = 2, WB = 3, WR = 4, WQ = 5, WK = 6;
export const BP = 9, BN = 10, BB = 11, BR = 12, BQ = 13, BK = 14;

export const WHITE = 0;
export const BLACK = 1;

export const PT_PAWN = 1, PT_KNIGHT = 2, PT_BISHOP = 3, PT_ROOK = 4, PT_QUEEN = 5, PT_KING = 6;

export const pieceColor = (p: number): number => (p >> 3) & 1;
export const pieceType = (p: number): number => p & 7;
export const makePiece = (color: number, type: number): number => (color << 3) | type;

export const CASTLE_WK = 1;
export const CASTLE_WQ = 2;
export const CASTLE_BK = 4;
export const CASTLE_BQ = 8;

export const NO_SQUARE = -1;

export interface UndoEntry {
  capturedPiece: number;
  prevCastling: number;
  prevEpSquare: number;
  prevHalfmove: number;
  prevHash: bigint;
  fromSquare: number;
  toSquare: number;
  special: number;
  movingPiece: number;
  promotion: number;
}

export const SP_NONE = 0;
export const SP_DOUBLE = 1;
export const SP_EP = 2;
export const SP_CASTLE_K = 3;
export const SP_CASTLE_Q = 4;

export interface EngineMove {
  from: number;
  to: number;
  special: number;
  promotion: number;
  captured: number;
}

const FILE_OF = (sq: number): number => sq & 7;
const RANK_OF = (sq: number): number => sq >> 3;
const SQ = (file: number, rank: number): number => (rank << 3) | file;

const PIECE_FROM_FEN: Record<string, number> = {
  P: WP, N: WN, B: WB, R: WR, Q: WQ, K: WK,
  p: BP, n: BN, b: BB, r: BR, q: BQ, k: BK,
};

const PIECE_TO_FEN = ['', 'P', 'N', 'B', 'R', 'Q', 'K', '', '', 'p', 'n', 'b', 'r', 'q', 'k'];

export class EnginePosition {
  pieces: Int8Array = new Int8Array(64);
  sideToMove: number = WHITE;
  castling: number = 0;
  epSquare: number = NO_SQUARE;
  halfmove: number = 0;
  fullmove: number = 1;
  hash: bigint = 0n;
  kingSquare: Int8Array = new Int8Array(2);
  history: UndoEntry[] = [];

  static fromFen(fen: string): EnginePosition {
    const p = new EnginePosition();
    const parts = fen.trim().split(/\s+/);
    const [placement, side, castling, ep, half = '0', full = '1'] = parts;
    if (!placement || !side || !castling || ep === undefined) {
      throw new Error(`Invalid FEN: ${fen}`);
    }
    const ranks = placement.split('/');
    if (ranks.length !== 8) throw new Error(`Invalid FEN: ${fen}`);
    for (let r = 0; r < 8; r++) {
      const rankStr = ranks[7 - r]!;
      let f = 0;
      for (const ch of rankStr) {
        if (ch >= '1' && ch <= '8') {
          f += Number.parseInt(ch, 10);
        } else {
          const piece = PIECE_FROM_FEN[ch];
          if (piece === undefined) throw new Error(`Invalid FEN: ${fen}`);
          p.pieces[SQ(f, r)] = piece;
          if (piece === WK) p.kingSquare[WHITE] = SQ(f, r);
          if (piece === BK) p.kingSquare[BLACK] = SQ(f, r);
          f++;
        }
      }
    }
    p.sideToMove = side === 'w' ? WHITE : BLACK;
    p.castling = 0;
    if (castling.includes('K')) p.castling |= CASTLE_WK;
    if (castling.includes('Q')) p.castling |= CASTLE_WQ;
    if (castling.includes('k')) p.castling |= CASTLE_BK;
    if (castling.includes('q')) p.castling |= CASTLE_BQ;
    p.epSquare = ep === '-' ? NO_SQUARE : algebraicToSquare(ep);
    p.halfmove = Number.parseInt(half, 10);
    p.fullmove = Number.parseInt(full, 10);
    p.hash = Zobrist.computeHash(p);
    return p;
  }

  toFen(): string {
    const ranks: string[] = [];
    for (let r = 7; r >= 0; r--) {
      let s = '';
      let empty = 0;
      for (let f = 0; f < 8; f++) {
        const piece = this.pieces[SQ(f, r)]!;
        if (piece === EMPTY) {
          empty++;
        } else {
          if (empty > 0) {
            s += empty.toString();
            empty = 0;
          }
          s += PIECE_TO_FEN[piece];
        }
      }
      if (empty > 0) s += empty.toString();
      ranks.push(s);
    }
    let castling = '';
    if (this.castling & CASTLE_WK) castling += 'K';
    if (this.castling & CASTLE_WQ) castling += 'Q';
    if (this.castling & CASTLE_BK) castling += 'k';
    if (this.castling & CASTLE_BQ) castling += 'q';
    if (castling === '') castling = '-';
    return [
      ranks.join('/'),
      this.sideToMove === WHITE ? 'w' : 'b',
      castling,
      this.epSquare === NO_SQUARE ? '-' : squareToAlgebraic(this.epSquare),
      this.halfmove.toString(),
      this.fullmove.toString(),
    ].join(' ');
  }

  make(move: EngineMove): void {
    const undo: UndoEntry = {
      capturedPiece: EMPTY,
      prevCastling: this.castling,
      prevEpSquare: this.epSquare,
      prevHalfmove: this.halfmove,
      prevHash: this.hash,
      fromSquare: move.from,
      toSquare: move.to,
      special: move.special,
      movingPiece: this.pieces[move.from]!,
      promotion: move.promotion,
    };

    const movingPiece = this.pieces[move.from]!;
    const movingColor = pieceColor(movingPiece);
    let capturedSquare = move.to;
    let captured = this.pieces[move.to]!;

    if (move.special === SP_EP) {
      capturedSquare = SQ(FILE_OF(move.to), RANK_OF(move.from));
      captured = this.pieces[capturedSquare]!;
    }
    undo.capturedPiece = captured;

    if (this.epSquare !== NO_SQUARE) {
      this.hash ^= Zobrist.epFile(FILE_OF(this.epSquare));
    }

    if (captured !== EMPTY) {
      this.hash ^= Zobrist.piece(captured, capturedSquare);
      this.pieces[capturedSquare] = EMPTY;
    }

    this.hash ^= Zobrist.piece(movingPiece, move.from);
    this.pieces[move.from] = EMPTY;
    if (move.promotion !== EMPTY) {
      const promoted = makePiece(movingColor, move.promotion);
      this.pieces[move.to] = promoted;
      this.hash ^= Zobrist.piece(promoted, move.to);
    } else {
      this.pieces[move.to] = movingPiece;
      this.hash ^= Zobrist.piece(movingPiece, move.to);
    }

    if (pieceType(movingPiece) === PT_KING) {
      this.kingSquare[movingColor] = move.to;
    }

    if (move.special === SP_CASTLE_K) {
      const r = RANK_OF(move.from);
      const rookFrom = SQ(7, r);
      const rookTo = SQ(5, r);
      const rook = this.pieces[rookFrom]!;
      this.pieces[rookFrom] = EMPTY;
      this.pieces[rookTo] = rook;
      this.hash ^= Zobrist.piece(rook, rookFrom);
      this.hash ^= Zobrist.piece(rook, rookTo);
    } else if (move.special === SP_CASTLE_Q) {
      const r = RANK_OF(move.from);
      const rookFrom = SQ(0, r);
      const rookTo = SQ(3, r);
      const rook = this.pieces[rookFrom]!;
      this.pieces[rookFrom] = EMPTY;
      this.pieces[rookTo] = rook;
      this.hash ^= Zobrist.piece(rook, rookFrom);
      this.hash ^= Zobrist.piece(rook, rookTo);
    }

    const oldCastling = this.castling;
    if (pieceType(movingPiece) === PT_KING) {
      if (movingColor === WHITE) this.castling &= ~(CASTLE_WK | CASTLE_WQ);
      else this.castling &= ~(CASTLE_BK | CASTLE_BQ);
    } else if (pieceType(movingPiece) === PT_ROOK) {
      if (movingColor === WHITE) {
        if (move.from === 0) this.castling &= ~CASTLE_WQ;
        else if (move.from === 7) this.castling &= ~CASTLE_WK;
      } else {
        if (move.from === 56) this.castling &= ~CASTLE_BQ;
        else if (move.from === 63) this.castling &= ~CASTLE_BK;
      }
    }
    if (captured !== EMPTY && pieceType(captured) === PT_ROOK) {
      if (capturedSquare === 0) this.castling &= ~CASTLE_WQ;
      else if (capturedSquare === 7) this.castling &= ~CASTLE_WK;
      else if (capturedSquare === 56) this.castling &= ~CASTLE_BQ;
      else if (capturedSquare === 63) this.castling &= ~CASTLE_BK;
    }
    if (oldCastling !== this.castling) {
      this.hash ^= Zobrist.castling(oldCastling);
      this.hash ^= Zobrist.castling(this.castling);
    }

    if (move.special === SP_DOUBLE) {
      const dir = movingColor === WHITE ? 1 : -1;
      this.epSquare = SQ(FILE_OF(move.from), RANK_OF(move.from) + dir);
      this.hash ^= Zobrist.epFile(FILE_OF(this.epSquare));
    } else {
      this.epSquare = NO_SQUARE;
    }

    if (pieceType(movingPiece) === PT_PAWN || captured !== EMPTY) this.halfmove = 0;
    else this.halfmove++;

    if (this.sideToMove === BLACK) this.fullmove++;
    this.sideToMove ^= 1;
    this.hash ^= Zobrist.side();

    this.history.push(undo);
  }

  unmake(): void {
    const undo = this.history.pop();
    if (!undo) throw new Error('No move to unmake');

    this.sideToMove ^= 1;
    if (this.sideToMove === BLACK) this.fullmove--;

    const movingPiece = undo.movingPiece;
    const movingColor = pieceColor(movingPiece);

    this.pieces[undo.fromSquare] = movingPiece;
    this.pieces[undo.toSquare] = EMPTY;

    if (undo.special === SP_EP) {
      const capSq = SQ(FILE_OF(undo.toSquare), RANK_OF(undo.fromSquare));
      this.pieces[capSq] = undo.capturedPiece;
    } else if (undo.capturedPiece !== EMPTY) {
      this.pieces[undo.toSquare] = undo.capturedPiece;
    }

    if (undo.special === SP_CASTLE_K) {
      const r = RANK_OF(undo.fromSquare);
      this.pieces[SQ(5, r)] = EMPTY;
      this.pieces[SQ(7, r)] = makePiece(movingColor, PT_ROOK);
    } else if (undo.special === SP_CASTLE_Q) {
      const r = RANK_OF(undo.fromSquare);
      this.pieces[SQ(3, r)] = EMPTY;
      this.pieces[SQ(0, r)] = makePiece(movingColor, PT_ROOK);
    }

    if (pieceType(movingPiece) === PT_KING) {
      this.kingSquare[movingColor] = undo.fromSquare;
    }

    this.castling = undo.prevCastling;
    this.epSquare = undo.prevEpSquare;
    this.halfmove = undo.prevHalfmove;
    this.hash = undo.prevHash;
  }

  clone(): EnginePosition {
    const c = new EnginePosition();
    c.pieces = new Int8Array(this.pieces);
    c.sideToMove = this.sideToMove;
    c.castling = this.castling;
    c.epSquare = this.epSquare;
    c.halfmove = this.halfmove;
    c.fullmove = this.fullmove;
    c.hash = this.hash;
    c.kingSquare = new Int8Array(this.kingSquare);
    return c;
  }
}

export const fileOf = FILE_OF;
export const rankOf = RANK_OF;
export const sq = SQ;

export const algebraicToSquare = (s: string): number => {
  const f = s.charCodeAt(0) - 'a'.charCodeAt(0);
  const r = Number.parseInt(s[1]!, 10) - 1;
  return SQ(f, r);
};

export const squareToAlgebraic = (n: number): string => {
  return String.fromCharCode('a'.charCodeAt(0) + FILE_OF(n)) + (RANK_OF(n) + 1);
};
