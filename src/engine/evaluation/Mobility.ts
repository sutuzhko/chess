import type { EnginePosition } from '@engine/core/EnginePosition.js';
import {
  EMPTY,
  fileOf,
  pieceColor,
  pieceType,
  PT_BISHOP,
  PT_KNIGHT,
  PT_QUEEN,
  PT_ROOK,
  rankOf,
  WHITE,
} from '@engine/core/EnginePosition.js';

import {
  BISHOP_DIRS,
  KNIGHT_OFFSETS,
  onBoard,
  ROOK_DIRS,
} from '@engine/core/PieceOffsets.js';

const MOB_KNIGHT = 4;
const MOB_BISHOP = 5;
const MOB_ROOK = 2;
const MOB_QUEEN = 1;

const countSteppingTargets = (
  p: EnginePosition,
  from: number,
  own: number,
  offsets: readonly (readonly [number, number])[],
): number => {
  const ff = fileOf(from);
  const fr = rankOf(from);
  let n = 0;
  for (const [df, dr] of offsets) {
    const f = ff + df;
    const r = fr + dr;
    if (!onBoard(f, r)) continue;
    const target = p.pieces[(r << 3) | f]!;
    if (target === EMPTY || pieceColor(target) !== own) n++;
  }
  return n;
};

const countSlidingTargets = (
  p: EnginePosition,
  from: number,
  own: number,
  dirs: readonly (readonly [number, number])[],
): number => {
  const ff = fileOf(from);
  const fr = rankOf(from);
  let n = 0;
  for (const [df, dr] of dirs) {
    let f = ff + df;
    let r = fr + dr;
    while (onBoard(f, r)) {
      const target = p.pieces[(r << 3) | f]!;
      if (target === EMPTY) {
        n++;
      } else {
        if (pieceColor(target) !== own) n++;
        break;
      }
      f += df;
      r += dr;
    }
  }
  return n;
};

/**
 * Возвращает мобильность (white - black) в сантипешках.
 * Считается одинаково для MG и EG — единое слагаемое в оценке.
 */
export const evalMobility = (p: EnginePosition): number => {
  let white = 0;
  let black = 0;
  for (let s = 0; s < 64; s++) {
    const piece = p.pieces[s]!;
    if (piece === EMPTY) continue;
    const t = pieceType(piece);
    const c = pieceColor(piece);
    let bonus = 0;
    if (t === PT_KNIGHT) {
      bonus = MOB_KNIGHT * countSteppingTargets(p, s, c, KNIGHT_OFFSETS);
    } else if (t === PT_BISHOP) {
      bonus = MOB_BISHOP * countSlidingTargets(p, s, c, BISHOP_DIRS);
    } else if (t === PT_ROOK) {
      bonus = MOB_ROOK * countSlidingTargets(p, s, c, ROOK_DIRS);
    } else if (t === PT_QUEEN) {
      bonus = MOB_QUEEN
        * (countSlidingTargets(p, s, c, BISHOP_DIRS)
          + countSlidingTargets(p, s, c, ROOK_DIRS));
    }
    if (c === WHITE) white += bonus;
    else black += bonus;
  }
  return white - black;
};
