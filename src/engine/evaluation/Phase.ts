import type { EnginePosition } from '@engine/core/EnginePosition.js';
import {
  EMPTY,
  pieceType,
  PT_BISHOP,
  PT_KNIGHT,
  PT_QUEEN,
  PT_ROOK,
} from '@engine/core/EnginePosition.js';

const PHASE_KNIGHT = 1;
const PHASE_BISHOP = 1;
const PHASE_ROOK = 2;
const PHASE_QUEEN = 4;

// 2 коня*1 + 2 слона*1 + 2 ладьи*2 + 1 ферзь*4 на сторону → max = 24.
export const PHASE_MAX_RAW = 24;
export const PHASE_SCALE = 256;

/**
 * Возвращает фазу игры: 256 = старт (полный материал, MG),
 * 0 = чистый пешечник (EG). Используется для интерполяции
 * между MG и EG оценками.
 */
export const phaseOf = (p: EnginePosition): number => {
  let raw = 0;
  for (let s = 0; s < 64; s++) {
    const piece = p.pieces[s]!;
    if (piece === EMPTY) continue;
    const t = pieceType(piece);
    if (t === PT_KNIGHT) raw += PHASE_KNIGHT;
    else if (t === PT_BISHOP) raw += PHASE_BISHOP;
    else if (t === PT_ROOK) raw += PHASE_ROOK;
    else if (t === PT_QUEEN) raw += PHASE_QUEEN;
  }
  if (raw > PHASE_MAX_RAW) raw = PHASE_MAX_RAW;
  return (raw * PHASE_SCALE) / PHASE_MAX_RAW;
};

/** Интерполяция между MG и EG счётом по текущей фазе. */
export const taperedScore = (mg: number, eg: number, phase: number): number => {
  return Math.round((mg * phase + eg * (PHASE_SCALE - phase)) / PHASE_SCALE);
};
