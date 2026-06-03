import type { EnginePosition } from '@engine/core/EnginePosition.js';
import {
  BLACK,
  BP,
  EMPTY,
  fileOf,
  pieceColor,
  pieceType,
  PT_PAWN,
  rankOf,
  WHITE,
  WP,
} from '@engine/core/EnginePosition.js';

export interface PawnScore {
  mg: number;
  eg: number;
}

const PASSED_BONUS_MG: readonly number[] = [0, 5, 10, 15, 25, 50, 80, 0];
const PASSED_BONUS_EG: readonly number[] = [0, 10, 20, 40, 70, 110, 160, 0];

const DOUBLED_PENALTY_MG = -10;
const DOUBLED_PENALTY_EG = -20;
const ISOLATED_PENALTY_MG = -15;
const ISOLATED_PENALTY_EG = -15;

interface PawnMap {
  // pawnsByFile[file] = битмаска рангов (0..7), где есть пешка.
  white: Uint8Array;
  black: Uint8Array;
}

const buildPawnMap = (p: EnginePosition): PawnMap => {
  const white = new Uint8Array(8);
  const black = new Uint8Array(8);
  for (let s = 0; s < 64; s++) {
    const piece = p.pieces[s]!;
    if (piece === EMPTY) continue;
    if (piece === WP) white[fileOf(s)]! |= 1 << rankOf(s);
    else if (piece === BP) black[fileOf(s)]! |= 1 << rankOf(s);
  }
  return { white, black };
};

const isPassedWhite = (file: number, rank: number, enemyByFile: Uint8Array): boolean => {
  const aheadMask = ~((1 << (rank + 1)) - 1) & 0xff;
  for (let df = -1; df <= 1; df++) {
    const f = file + df;
    if (f < 0 || f > 7) continue;
    if ((enemyByFile[f]! & aheadMask) !== 0) return false;
  }
  return true;
};

const isPassedBlack = (file: number, rank: number, enemyByFile: Uint8Array): boolean => {
  const aheadMask = (1 << rank) - 1; // ранги ниже текущего
  for (let df = -1; df <= 1; df++) {
    const f = file + df;
    if (f < 0 || f > 7) continue;
    if ((enemyByFile[f]! & aheadMask) !== 0) return false;
  }
  return true;
};

const evalForColor = (
  p: EnginePosition,
  color: number,
  map: PawnMap,
): PawnScore => {
  const ownByFile = color === WHITE ? map.white : map.black;
  const enemyByFile = color === WHITE ? map.black : map.white;
  let mg = 0;
  let eg = 0;

  for (let s = 0; s < 64; s++) {
    const piece = p.pieces[s]!;
    if (piece === EMPTY) continue;
    if (pieceColor(piece) !== color || pieceType(piece) !== PT_PAWN) continue;

    const f = fileOf(s);
    const r = rankOf(s);

    // Изолированные: нет своих пешек на соседних вертикалях.
    const leftOwn = f > 0 ? ownByFile[f - 1]! : 0;
    const rightOwn = f < 7 ? ownByFile[f + 1]! : 0;
    if (leftOwn === 0 && rightOwn === 0) {
      mg += ISOLATED_PENALTY_MG;
      eg += ISOLATED_PENALTY_EG;
    }

    // Проходные: впереди по своей и соседним вертикалям нет вражеских.
    const passed = color === WHITE
      ? isPassedWhite(f, r, enemyByFile)
      : isPassedBlack(f, r, enemyByFile);
    if (passed) {
      // Для бонуса используем «продвинутость»: для белых = r, для чёрных = 7 - r.
      const advance = color === WHITE ? r : 7 - r;
      mg += PASSED_BONUS_MG[advance]!;
      eg += PASSED_BONUS_EG[advance]!;
    }
  }

  // Сдвоенные: на одной вертикали ≥ 2 своих пешки. По каждой лишней — штраф.
  for (let f = 0; f < 8; f++) {
    let cnt = 0;
    let mask = ownByFile[f]!;
    while (mask !== 0) {
      cnt += mask & 1;
      mask >>>= 1;
    }
    if (cnt > 1) {
      mg += DOUBLED_PENALTY_MG * (cnt - 1);
      eg += DOUBLED_PENALTY_EG * (cnt - 1);
    }
  }

  return { mg, eg };
};

/** Возвращает (white - black) PawnScore с точки зрения белых. */
export const evalPawnStructure = (p: EnginePosition): PawnScore => {
  const map = buildPawnMap(p);
  const w = evalForColor(p, WHITE, map);
  const b = evalForColor(p, BLACK, map);
  return { mg: w.mg - b.mg, eg: w.eg - b.eg };
};
