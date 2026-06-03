import type { EnginePosition } from '@engine/core/EnginePosition.js';
import {
  BLACK,
  BP,
  fileOf,
  rankOf,
  WHITE,
  WP,
} from '@engine/core/EnginePosition.js';

const PAWN_SHIELD_BONUS = 10;
const OPEN_FILE_PENALTY = -15;
const SEMI_OPEN_FILE_PENALTY = -8;

const hasPawnOnFile = (p: EnginePosition, file: number, color: number): boolean => {
  const target = color === WHITE ? WP : BP;
  for (let r = 0; r < 8; r++) {
    if (p.pieces[(r << 3) | file] === target) return true;
  }
  return false;
};

const pawnInFront = (
  p: EnginePosition,
  kingFile: number,
  kingRank: number,
  fileOffset: number,
  rankOffset: number,
  color: number,
): boolean => {
  const f = kingFile + fileOffset;
  const r = kingRank + rankOffset;
  if (f < 0 || f > 7 || r < 0 || r > 7) return false;
  const target = color === WHITE ? WP : BP;
  return p.pieces[(r << 3) | f] === target;
};

const evalForColor = (p: EnginePosition, color: number): number => {
  const kingSq = p.kingSquare[color]!;
  const kf = fileOf(kingSq);
  const kr = rankOf(kingSq);
  const forward = color === WHITE ? 1 : -1;

  // Pawn shield важен только если король «увёл» с центра (рокировка/прижатый угол).
  // Иначе центральный король и так получает штраф по PST.
  let score = 0;
  if (kf <= 2 || kf >= 5) {
    for (let df = -1; df <= 1; df++) {
      const f = kf + df;
      if (f < 0 || f > 7) continue;
      // Одна или две пешки перед королём — щит.
      if (pawnInFront(p, kf, kr, df, forward, color)) {
        score += PAWN_SHIELD_BONUS;
      } else if (pawnInFront(p, kf, kr, df, 2 * forward, color)) {
        score += Math.floor(PAWN_SHIELD_BONUS / 2);
      }
    }
  }

  // Открытые/полуоткрытые линии у короля — опасность.
  const enemy = color ^ 1;
  for (let df = -1; df <= 1; df++) {
    const f = kf + df;
    if (f < 0 || f > 7) continue;
    const ownPawn = hasPawnOnFile(p, f, color);
    const enemyPawn = hasPawnOnFile(p, f, enemy);
    if (!ownPawn && !enemyPawn) score += OPEN_FILE_PENALTY;
    else if (!ownPawn && enemyPawn) score += SEMI_OPEN_FILE_PENALTY;
  }

  return score;
};

/**
 * Возвращает MG-only king safety (white - black). В EG обнуляется через taper
 * (передаётся в Evaluator как mg-компонент).
 */
export const evalKingSafety = (p: EnginePosition): number => {
  return evalForColor(p, WHITE) - evalForColor(p, BLACK);
};
