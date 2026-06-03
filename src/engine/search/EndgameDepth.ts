import type { EnginePosition } from '@engine/core/EnginePosition.js';
import { EMPTY, pieceType, PT_KING } from '@engine/core/EnginePosition.js';
import { PIECE_VALUE } from '@engine/evaluation/PieceSquareTables.js';

// На сторону: < ладья + лёгкая (≈ 820) → +2 ply, < ладья (≈ 500) → +4 ply.
const ENDGAME_PER_SIDE_LIGHT = 1300;
const ENDGAME_PER_SIDE_DEEP = 800;
const BONUS_LIGHT = 2;
const BONUS_DEEP = 4;

const totalNonKingMaterial = (p: EnginePosition): number => {
  let total = 0;
  for (let s = 0; s < 64; s++) {
    const piece = p.pieces[s]!;
    if (piece === EMPTY) continue;
    const t = pieceType(piece);
    if (t === PT_KING) continue;
    total += PIECE_VALUE[t]!;
  }
  return total;
};

/**
 * Адаптивная глубина в эндшпиле: branching factor падает с ~30 до ~8-10,
 * поэтому при малом материале можно копать на 2-4 ply глубже за те же
 * ресурсы. Лимит сверху всё равно держит maxTimeMs.
 */
export const adjustDepthForEndgame = (p: EnginePosition, baseDepth: number): number => {
  const perSide = totalNonKingMaterial(p) / 2;
  if (perSide < ENDGAME_PER_SIDE_DEEP) return baseDepth + BONUS_DEEP;
  if (perSide < ENDGAME_PER_SIDE_LIGHT) return baseDepth + BONUS_LIGHT;
  return baseDepth;
};
