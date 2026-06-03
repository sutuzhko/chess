import type { EnginePosition } from '@engine/core/EnginePosition.js';
import {
  EMPTY,
  pieceColor,
  pieceType,
  WHITE,
} from '@engine/core/EnginePosition.js';
import { evalKingSafety } from './KingSafety.js';
import { evalMobility } from './Mobility.js';
import { evalPawnStructure } from './PawnStructure.js';
import { phaseOf, taperedScore } from './Phase.js';
import {
  mirrorSquare,
  PIECE_VALUE,
  PST_EG,
  PST_MG,
} from './PieceSquareTables.js';

export { PIECE_VALUE } from './PieceSquareTables.js';

/**
 * Полная статическая оценка позиции с tapered eval (интерполяция MG/EG по
 * фазе).
 *
 * Слагаемые:
 *  • Материал + PST (MG и EG, разные таблицы для короля и пешек).
 *  • Pawn structure (passed/doubled/isolated) — MG/EG split.
 *  • King safety (pawn shield, открытые линии) — только MG, в EG обнуляется
 * через taper.
 *  • Mobility — единое слагаемое (одинаково в MG/EG).
 *
 * Возвращает оценку с точки зрения `sideToMove` (positive = side выигрывает).
 */
export const evaluate = (p: EnginePosition): number => {
  let mg = 0;
  let eg = 0;

  for (let s = 0; s < 64; s++) {
    const piece = p.pieces[s]!;
    if (piece === EMPTY) continue;
    const t = pieceType(piece);
    const c = pieceColor(piece);
    const value = PIECE_VALUE[t]!;
    const pstMg = PST_MG[t]!;
    const pstEg = PST_EG[t]!;
    if (c === WHITE) {
      mg += value + pstMg[s]!;
      eg += value + pstEg[s]!;
    } else {
      const m = mirrorSquare(s);
      mg -= value + pstMg[m]!;
      eg -= value + pstEg[m]!;
    }
  }

  const pawn = evalPawnStructure(p);
  mg += pawn.mg;
  eg += pawn.eg;

  // King safety применяется только в MG (через taper естественно гасится в EG).
  mg += evalKingSafety(p);

  // Mobility — единое слагаемое.
  const mob = evalMobility(p);
  mg += mob;
  eg += mob;

  const phase = phaseOf(p);
  const score = taperedScore(mg, eg, phase);
  return p.sideToMove === WHITE ? score : -score;
};
