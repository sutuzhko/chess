import type { EnginePosition } from './EnginePosition.js';
import {
  CASTLE_BK,
  CASTLE_BQ,
  CASTLE_WK,
  CASTLE_WQ,
  EMPTY,
  type EngineMove,
  fileOf,
  pieceColor,
  pieceType,
  PT_BISHOP,
  PT_KING,
  PT_KNIGHT,
  PT_PAWN,
  PT_QUEEN,
  PT_ROOK,
  rankOf,
  SP_CASTLE_K,
  SP_CASTLE_Q,
  SP_DOUBLE,
  SP_EP,
  SP_NONE,
  sq,
  WHITE,
} from './EnginePosition.js';

import {
  BISHOP_DIRS,
  KING_OFFSETS,
  KNIGHT_OFFSETS,
  onBoard,
  ROOK_DIRS,
} from './PieceOffsets.js';

export class EngineMoveGen {
  static isSquareAttacked(p: EnginePosition, target: number, byColor: number): boolean {
    const tf = fileOf(target);
    const tr = rankOf(target);
    const pawnDir = byColor === WHITE ? -1 : 1;
    for (const df of [-1, 1]) {
      const f = tf + df;
      const r = tr + pawnDir;
      if (!onBoard(f, r)) continue;
      const piece = p.pieces[sq(f, r)]!;
      if (piece !== EMPTY && pieceColor(piece) === byColor && pieceType(piece) === PT_PAWN) {
        return true;
      }
    }
    for (const [df, dr] of KNIGHT_OFFSETS) {
      const f = tf + df;
      const r = tr + dr;
      if (!onBoard(f, r)) continue;
      const piece = p.pieces[sq(f, r)]!;
      if (piece !== EMPTY && pieceColor(piece) === byColor && pieceType(piece) === PT_KNIGHT) {
        return true;
      }
    }
    for (const [df, dr] of KING_OFFSETS) {
      const f = tf + df;
      const r = tr + dr;
      if (!onBoard(f, r)) continue;
      const piece = p.pieces[sq(f, r)]!;
      if (piece !== EMPTY && pieceColor(piece) === byColor && pieceType(piece) === PT_KING) {
        return true;
      }
    }
    for (const [df, dr] of BISHOP_DIRS) {
      let f = tf + df;
      let r = tr + dr;
      while (onBoard(f, r)) {
        const piece = p.pieces[sq(f, r)]!;
        if (piece !== EMPTY) {
          if (pieceColor(piece) === byColor) {
            const t = pieceType(piece);
            if (t === PT_BISHOP || t === PT_QUEEN) return true;
          }
          break;
        }
        f += df;
        r += dr;
      }
    }
    for (const [df, dr] of ROOK_DIRS) {
      let f = tf + df;
      let r = tr + dr;
      while (onBoard(f, r)) {
        const piece = p.pieces[sq(f, r)]!;
        if (piece !== EMPTY) {
          if (pieceColor(piece) === byColor) {
            const t = pieceType(piece);
            if (t === PT_ROOK || t === PT_QUEEN) return true;
          }
          break;
        }
        f += df;
        r += dr;
      }
    }
    return false;
  }

  static generatePseudoLegal(p: EnginePosition, out: EngineMove[]): void {
    const us = p.sideToMove;
    for (let s = 0; s < 64; s++) {
      const piece = p.pieces[s]!;
      if (piece === EMPTY || pieceColor(piece) !== us) continue;
      const t = pieceType(piece);
      if (t === PT_PAWN) EngineMoveGen.pawn(p, s, us, out);
      else if (t === PT_KNIGHT) EngineMoveGen.stepping(p, s, us, KNIGHT_OFFSETS, out);
      else if (t === PT_BISHOP) EngineMoveGen.sliding(p, s, us, BISHOP_DIRS, out);
      else if (t === PT_ROOK) EngineMoveGen.sliding(p, s, us, ROOK_DIRS, out);
      else if (t === PT_QUEEN) {
        EngineMoveGen.sliding(p, s, us, BISHOP_DIRS, out);
        EngineMoveGen.sliding(p, s, us, ROOK_DIRS, out);
      } else if (t === PT_KING) {
        EngineMoveGen.stepping(p, s, us, KING_OFFSETS, out);
        EngineMoveGen.castling(p, s, us, out);
      }
    }
  }

  static generateLegal(p: EnginePosition, out: EngineMove[]): void {
    const pseudo: EngineMove[] = [];
    EngineMoveGen.generatePseudoLegal(p, pseudo);
    const us = p.sideToMove;
    const them = us ^ 1;
    for (const move of pseudo) {
      p.make(move);
      const kingSq = p.kingSquare[us]!;
      if (!EngineMoveGen.isSquareAttacked(p, kingSq, them)) out.push(move);
      p.unmake();
    }
  }

  private static stepping(
    p: EnginePosition,
    from: number,
    us: number,
    offsets: readonly (readonly [number, number])[],
    out: EngineMove[],
  ): void {
    const ff = fileOf(from);
    const fr = rankOf(from);
    for (const [df, dr] of offsets) {
      const f = ff + df;
      const r = fr + dr;
      if (!onBoard(f, r)) continue;
      const to = sq(f, r);
      const target = p.pieces[to]!;
      if (target === EMPTY) {
        out.push({ from, to, special: SP_NONE, promotion: 0, captured: EMPTY });
      } else if (pieceColor(target) !== us) {
        out.push({ from, to, special: SP_NONE, promotion: 0, captured: target });
      }
    }
  }

  private static sliding(
    p: EnginePosition,
    from: number,
    us: number,
    dirs: readonly (readonly [number, number])[],
    out: EngineMove[],
  ): void {
    const ff = fileOf(from);
    const fr = rankOf(from);
    for (const [df, dr] of dirs) {
      let f = ff + df;
      let r = fr + dr;
      while (onBoard(f, r)) {
        const to = sq(f, r);
        const target = p.pieces[to]!;
        if (target === EMPTY) {
          out.push({ from, to, special: SP_NONE, promotion: 0, captured: EMPTY });
        } else {
          if (pieceColor(target) !== us) {
            out.push({ from, to, special: SP_NONE, promotion: 0, captured: target });
          }
          break;
        }
        f += df;
        r += dr;
      }
    }
  }

  private static pawn(p: EnginePosition, from: number, us: number, out: EngineMove[]): void {
    const ff = fileOf(from);
    const fr = rankOf(from);
    const dir = us === WHITE ? 1 : -1;
    const startRank = us === WHITE ? 1 : 6;
    const promoRank = us === WHITE ? 7 : 0;

    const oneR = fr + dir;
    if (onBoard(ff, oneR)) {
      const oneSq = sq(ff, oneR);
      if (p.pieces[oneSq] === EMPTY) {
        if (oneR === promoRank) {
          for (const promo of [PT_QUEEN, PT_ROOK, PT_BISHOP, PT_KNIGHT]) {
            out.push({ from, to: oneSq, special: SP_NONE, promotion: promo, captured: EMPTY });
          }
        } else {
          out.push({ from, to: oneSq, special: SP_NONE, promotion: 0, captured: EMPTY });
          if (fr === startRank) {
            const twoR = fr + 2 * dir;
            const twoSq = sq(ff, twoR);
            if (p.pieces[twoSq] === EMPTY) {
              out.push({ from, to: twoSq, special: SP_DOUBLE, promotion: 0, captured: EMPTY });
            }
          }
        }
      }
    }

    for (const df of [-1, 1]) {
      const f = ff + df;
      const r = fr + dir;
      if (!onBoard(f, r)) continue;
      const to = sq(f, r);
      const target = p.pieces[to]!;
      if (target !== EMPTY && pieceColor(target) !== us) {
        if (r === promoRank) {
          for (const promo of [PT_QUEEN, PT_ROOK, PT_BISHOP, PT_KNIGHT]) {
            out.push({ from, to, special: SP_NONE, promotion: promo, captured: target });
          }
        } else {
          out.push({ from, to, special: SP_NONE, promotion: 0, captured: target });
        }
      } else if (target === EMPTY && p.epSquare === to) {
        out.push({ from, to, special: SP_EP, promotion: 0, captured: 0 });
      }
    }
  }

  private static castling(p: EnginePosition, from: number, us: number, out: EngineMove[]): void {
    const homeRank = us === WHITE ? 0 : 7;
    if (fileOf(from) !== 4 || rankOf(from) !== homeRank) return;
    const them = us ^ 1;
    const kingMask = us === WHITE ? CASTLE_WK : CASTLE_BK;
    const queenMask = us === WHITE ? CASTLE_WQ : CASTLE_BQ;

    if (p.castling & kingMask) {
      const f = sq(5, homeRank);
      const g = sq(6, homeRank);
      if (p.pieces[f] === EMPTY && p.pieces[g] === EMPTY) {
        if (
          !EngineMoveGen.isSquareAttacked(p, from, them) &&
          !EngineMoveGen.isSquareAttacked(p, f, them) &&
          !EngineMoveGen.isSquareAttacked(p, g, them)
        ) {
          out.push({ from, to: g, special: SP_CASTLE_K, promotion: 0, captured: EMPTY });
        }
      }
    }
    if (p.castling & queenMask) {
      const d = sq(3, homeRank);
      const c = sq(2, homeRank);
      const b = sq(1, homeRank);
      if (p.pieces[d] === EMPTY && p.pieces[c] === EMPTY && p.pieces[b] === EMPTY) {
        if (
          !EngineMoveGen.isSquareAttacked(p, from, them) &&
          !EngineMoveGen.isSquareAttacked(p, d, them) &&
          !EngineMoveGen.isSquareAttacked(p, c, them)
        ) {
          out.push({ from, to: c, special: SP_CASTLE_Q, promotion: 0, captured: EMPTY });
        }
      }
    }
  }
}
