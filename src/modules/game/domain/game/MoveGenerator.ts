import type { BoardSnapshot } from './BoardSnapshot.js';
import { type Color, oppositeColor } from './value-objects/Color.js';
import { Move } from './value-objects/Move.js';
import type { Piece } from './value-objects/Piece.js';
import type { PromotionPiece } from './value-objects/PieceType.js';
import { Square } from './value-objects/Square.js';

const KNIGHT_OFFSETS: readonly (readonly [number, number])[] = [
  [1, 2], [2, 1], [-1, 2], [-2, 1],
  [1, -2], [2, -1], [-1, -2], [-2, -1],
];

const KING_OFFSETS: readonly (readonly [number, number])[] = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

const BISHOP_DIRS: readonly (readonly [number, number])[] = [
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

const ROOK_DIRS: readonly (readonly [number, number])[] = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
];

const PROMOTIONS: readonly PromotionPiece[] = ['queen', 'rook', 'bishop', 'knight'];

export class MoveGenerator {
  static legalMoves(snap: BoardSnapshot): Move[] {
    const own = snap.sideToMove;
    const enemy = oppositeColor(own);
    const result: Move[] = [];
    for (const move of MoveGenerator.pseudoLegalMoves(snap)) {
      const next = snap.apply(move);
      const kingSq = next.findKing(own);
      if (!MoveGenerator.isSquareAttacked(next, kingSq, enemy)) {
        result.push(move);
      }
    }
    return result;
  }

  static pseudoLegalMoves(snap: BoardSnapshot): Move[] {
    const out: Move[] = [];
    for (const { square, piece } of snap.pieces()) {
      if (piece.color !== snap.sideToMove) continue;
      MoveGenerator.movesForPiece(snap, piece, square, out);
    }
    return out;
  }

  static isSquareAttacked(snap: BoardSnapshot, target: Square, byColor: Color): boolean {
    const pawnFromDir = byColor === 'white' ? -1 : 1;
    for (const df of [-1, 1]) {
      const p = target.offset(df, pawnFromDir);
      if (!p) continue;
      const piece = snap.pieceAt(p);
      if (piece?.color === byColor && piece.type === 'pawn') return true;
    }

    for (const [df, dr] of KNIGHT_OFFSETS) {
      const p = target.offset(df, dr);
      if (!p) continue;
      const piece = snap.pieceAt(p);
      if (piece?.color === byColor && piece.type === 'knight') return true;
    }

    for (const [df, dr] of KING_OFFSETS) {
      const p = target.offset(df, dr);
      if (!p) continue;
      const piece = snap.pieceAt(p);
      if (piece?.color === byColor && piece.type === 'king') return true;
    }

    for (const [df, dr] of BISHOP_DIRS) {
      let cur = target.offset(df, dr);
      while (cur) {
        const piece = snap.pieceAt(cur);
        if (piece) {
          if (piece.color === byColor && (piece.type === 'bishop' || piece.type === 'queen')) {
            return true;
          }
          break;
        }
        cur = cur.offset(df, dr);
      }
    }

    for (const [df, dr] of ROOK_DIRS) {
      let cur = target.offset(df, dr);
      while (cur) {
        const piece = snap.pieceAt(cur);
        if (piece) {
          if (piece.color === byColor && (piece.type === 'rook' || piece.type === 'queen')) {
            return true;
          }
          break;
        }
        cur = cur.offset(df, dr);
      }
    }

    return false;
  }

  private static movesForPiece(
    snap: BoardSnapshot,
    piece: Piece,
    from: Square,
    out: Move[],
  ): void {
    switch (piece.type) {
      case 'pawn':
        MoveGenerator.pawnMoves(snap, piece.color, from, out);
        break;
      case 'knight':
        MoveGenerator.steppingMoves(snap, piece.color, from, KNIGHT_OFFSETS, out);
        break;
      case 'bishop':
        MoveGenerator.slidingMoves(snap, piece.color, from, BISHOP_DIRS, out);
        break;
      case 'rook':
        MoveGenerator.slidingMoves(snap, piece.color, from, ROOK_DIRS, out);
        break;
      case 'queen':
        MoveGenerator.slidingMoves(snap, piece.color, from, BISHOP_DIRS, out);
        MoveGenerator.slidingMoves(snap, piece.color, from, ROOK_DIRS, out);
        break;
      case 'king':
        MoveGenerator.steppingMoves(snap, piece.color, from, KING_OFFSETS, out);
        MoveGenerator.castlingMoves(snap, piece.color, from, out);
        break;
    }
  }

  private static steppingMoves(
    snap: BoardSnapshot,
    color: Color,
    from: Square,
    offsets: readonly (readonly [number, number])[],
    out: Move[],
  ): void {
    for (const [df, dr] of offsets) {
      const to = from.offset(df, dr);
      if (!to) continue;
      const target = snap.pieceAt(to);
      if (!target) {
        out.push(new Move(from, to));
      } else if (target.color !== color) {
        out.push(new Move(from, to, null, null, target.type));
      }
    }
  }

  private static slidingMoves(
    snap: BoardSnapshot,
    color: Color,
    from: Square,
    dirs: readonly (readonly [number, number])[],
    out: Move[],
  ): void {
    for (const [df, dr] of dirs) {
      let cur = from.offset(df, dr);
      while (cur) {
        const target = snap.pieceAt(cur);
        if (!target) {
          out.push(new Move(from, cur));
        } else {
          if (target.color !== color) {
            out.push(new Move(from, cur, null, null, target.type));
          }
          break;
        }
        cur = cur.offset(df, dr);
      }
    }
  }

  private static pawnMoves(
    snap: BoardSnapshot,
    color: Color,
    from: Square,
    out: Move[],
  ): void {
    const dir = color === 'white' ? 1 : -1;
    const startRank = color === 'white' ? 1 : 6;
    const promoRank = color === 'white' ? 7 : 0;

    const oneStep = from.offset(0, dir);
    if (oneStep && !snap.pieceAt(oneStep)) {
      if (oneStep.rank === promoRank) {
        for (const promo of PROMOTIONS) {
          out.push(new Move(from, oneStep, null, promo));
        }
      } else {
        out.push(new Move(from, oneStep));
        if (from.rank === startRank) {
          const twoStep = from.offset(0, dir * 2);
          if (twoStep && !snap.pieceAt(twoStep)) {
            out.push(new Move(from, twoStep, 'double-push'));
          }
        }
      }
    }

    for (const df of [-1, 1]) {
      const cap = from.offset(df, dir);
      if (!cap) continue;
      const target = snap.pieceAt(cap);
      if (target && target.color !== color) {
        if (cap.rank === promoRank) {
          for (const promo of PROMOTIONS) {
            out.push(new Move(from, cap, null, promo, target.type));
          }
        } else {
          out.push(new Move(from, cap, null, null, target.type));
        }
      } else if (!target && snap.enPassantTarget?.equals(cap)) {
        out.push(new Move(from, cap, 'en-passant', null, 'pawn'));
      }
    }
  }

  private static castlingMoves(
    snap: BoardSnapshot,
    color: Color,
    from: Square,
    out: Move[],
  ): void {
    const homeRank = color === 'white' ? 0 : 7;
    if (from.file !== 4 || from.rank !== homeRank) return;
    const enemy = oppositeColor(color);

    if (snap.castlingRights.has(color, 'king')) {
      const f = Square.of(5, homeRank);
      const g = Square.of(6, homeRank);
      if (!snap.pieceAt(f) && !snap.pieceAt(g)) {
        if (
          !MoveGenerator.isSquareAttacked(snap, from, enemy) &&
          !MoveGenerator.isSquareAttacked(snap, f, enemy) &&
          !MoveGenerator.isSquareAttacked(snap, g, enemy)
        ) {
          out.push(new Move(from, g, 'castle-king'));
        }
      }
    }

    if (snap.castlingRights.has(color, 'queen')) {
      const d = Square.of(3, homeRank);
      const c = Square.of(2, homeRank);
      const b = Square.of(1, homeRank);
      if (!snap.pieceAt(d) && !snap.pieceAt(c) && !snap.pieceAt(b)) {
        if (
          !MoveGenerator.isSquareAttacked(snap, from, enemy) &&
          !MoveGenerator.isSquareAttacked(snap, d, enemy) &&
          !MoveGenerator.isSquareAttacked(snap, c, enemy)
        ) {
          out.push(new Move(from, c, 'castle-queen'));
        }
      }
    }
  }
}
