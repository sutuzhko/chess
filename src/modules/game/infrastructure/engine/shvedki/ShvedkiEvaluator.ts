import {
  type BoardSnapshot,
  type Color,
  oppositeColor,
  type PieceType,
  Square,
} from '@modules/game/domain/game';
import type { DualReserves } from '@modules/game/domain/shvedki';
import type { ShvedkiPosition } from './ShvedkiPosition.js';

type ReservePieceType = Exclude<PieceType, 'king'>;

const PIECE_VALUE: Record<PieceType, number> = {
  pawn: 100,
  knight: 320,
  bishop: 330,
  rook: 500,
  queen: 900,
  king: 20000,
};

const PST_PAWN: readonly number[] = [
   0,  0,  0,  0,  0,  0,  0,  0,
   5, 10, 10,-20,-20, 10, 10,  5,
   5, -5,-10,  0,  0,-10, -5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5,  5, 10, 25, 25, 10,  5,  5,
  10, 10, 20, 30, 30, 20, 10, 10,
  50, 50, 50, 50, 50, 50, 50, 50,
   0,  0,  0,  0,  0,  0,  0,  0,
];
const PST_KNIGHT: readonly number[] = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
];
const PST_BISHOP: readonly number[] = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
];
const PST_ROOK: readonly number[] = [
   0,  0,  0,  5,  5,  0,  0,  0,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
   5, 10, 10, 10, 10, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0,
];
const PST_QUEEN: readonly number[] = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -10,  5,  5,  5,  5,  5,  0,-10,
    0,  0,  5,  5,  5,  5,  0, -5,
   -5,  0,  5,  5,  5,  5,  0, -5,
  -10,  0,  5,  5,  5,  5,  0,-10,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20,
];
const PST_KING: readonly number[] = [
   20, 30, 10,  0,  0, 10, 30, 20,
   20, 20,  0,  0,  0,  0, 20, 20,
  -10,-20,-20,-20,-20,-20,-20,-10,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
];

const PST: Record<PieceType, readonly number[]> = {
  pawn: PST_PAWN,
  knight: PST_KNIGHT,
  bishop: PST_BISHOP,
  rook: PST_ROOK,
  queen: PST_QUEEN,
  king: PST_KING,
};

const mirror = (idx: number): number => idx ^ 56;

const RESERVE_VALUE_FACTOR = 0.75;
const CHECK_DROP_PENALTY = 60;
const ZONE_DROP_PENALTY = 12;
const DEVELOPMENT_BONUS = 12;

const pieceAttacksSquare = (
  pt: PieceType,
  fromIdx: number,
  toIdx: number,
  snap: BoardSnapshot,
  attackerColor: Color,
): boolean => {
  const ff = fromIdx & 7, fr = fromIdx >> 3;
  const tf = toIdx & 7,   tr = toIdx >> 3;
  const df = tf - ff, dr = tr - fr;
  switch (pt) {
    case 'pawn': {
      const dir = attackerColor === 'white' ? 1 : -1;
      return Math.abs(df) === 1 && dr === dir;
    }
    case 'knight':
      return (Math.abs(df) === 1 && Math.abs(dr) === 2) ||
             (Math.abs(df) === 2 && Math.abs(dr) === 1);
    case 'king':
      return Math.abs(df) <= 1 && Math.abs(dr) <= 1 && (df !== 0 || dr !== 0);
    case 'bishop':
    case 'rook':
    case 'queen': {
      const diag = Math.abs(df) === Math.abs(dr) && df !== 0;
      const line = (df === 0 && dr !== 0) || (dr === 0 && df !== 0);
      if (pt === 'bishop' && !diag) return false;
      if (pt === 'rook' && !line) return false;
      if (pt === 'queen' && !diag && !line) return false;
      const stepF = Math.sign(df), stepR = Math.sign(dr);
      let f = ff + stepF, r = fr + stepR;
      while (f !== tf || r !== tr) {
        if (snap.pieceAt(Square.of(f, r))) return false;
        f += stepF; r += stepR;
      }
      return true;
    }
  }
};

/**
 * Сколько различных дроп-шахов соперник может организовать в текущей
 * позиции. Учитывает только пустые клетки и фигуры в его резерве.
 */
const countCheckDropThreats = (
  snap: BoardSnapshot,
  oppReserves: DualReserves,
  defendingColor: Color,
): number => {
  const oppColor = oppositeColor(defendingColor);
  const pool = oppColor === 'white' ? oppReserves.white : oppReserves.black;
  if (pool.isEmpty()) return 0;
  let kingIdx = -1;
  for (let i = 0; i < 64; i++) {
    const p = snap.pieceAt(Square.fromIndex(i));
    if (p?.color === defendingColor && p.type === 'king') { kingIdx = i; break; }
  }
  if (kingIdx < 0) return 0;
  let threats = 0;
  for (const pt of pool.available()) {
    for (let i = 0; i < 64; i++) {
      const sq = Square.fromIndex(i);
      if (snap.pieceAt(sq)) continue;
      if (pt === 'pawn' && (sq.rank === 0 || sq.rank === 7)) continue;
      if (pieceAttacksSquare(pt, i, kingIdx, snap, oppColor)) {
        threats++;
      }
    }
  }
  return threats;
};

/**
 * Empty squares within Chebyshev-2 of king — heuristic "king zone openness".
 */
const kingZoneOpenness = (snap: BoardSnapshot, color: Color): number => {
  let kingIdx = -1;
  for (let i = 0; i < 64; i++) {
    const p = snap.pieceAt(Square.fromIndex(i));
    if (p?.color === color && p.type === 'king') { kingIdx = i; break; }
  }
  if (kingIdx < 0) return 0;
  const kf = kingIdx & 7, kr = kingIdx >> 3;
  let count = 0;
  for (let dr = -2; dr <= 2; dr++) {
    for (let df = -2; df <= 2; df++) {
      const f = kf + df, r = kr + dr;
      if (f < 0 || f > 7 || r < 0 || r > 7) continue;
      if (df === 0 && dr === 0) continue;
      if (!snap.pieceAt(Square.of(f, r))) count++;
    }
  }
  return count;
};

const reserveMaterial = (reserves: DualReserves, color: Color): number => {
  const pool = color === 'white' ? reserves.white : reserves.black;
  let total = 0;
  for (const [pt, count] of pool.entries()) {
    total += PIECE_VALUE[pt] * count;
  }
  return total;
};

/**
 * Penalty (positive) на сторону `defending` за то, что соперник может
 * пользоваться резервом возле короля. Объединяет дроп-шахи и
 * «открытость» королевской зоны умноженную на «боеприпасы» соперника.
 */
const kingDropSafetyPenalty = (
  snap: BoardSnapshot,
  reserves: DualReserves,
  defending: Color,
): number => {
  const oppColor = oppositeColor(defending);
  const oppPool = oppColor === 'white' ? reserves.white : reserves.black;
  if (oppPool.isEmpty()) return 0;
  const checks = countCheckDropThreats(snap, reserves, defending);
  const zone = kingZoneOpenness(snap, defending);
  let ammo = 0;
  for (const [, c] of oppPool.entries()) ammo += c;
  return checks * CHECK_DROP_PENALTY + zone * Math.min(ammo, 6) * ZONE_DROP_PENALTY / 6;
};

const developmentBonus = (snap: BoardSnapshot, color: Color): number => {
  // Bonus per moved minor piece in early game. Discourages stalling on dropouts.
  if (snap.fullmoveNumber > 8) return 0;
  const homeRank = color === 'white' ? 0 : 7;
  let movedMinors = 0;
  const homeFiles: Record<number, ReservePieceType | undefined> = {
    1: 'knight', 2: 'bishop', 5: 'bishop', 6: 'knight',
  };
  for (const [file, expected] of Object.entries(homeFiles)) {
    const sq = Square.of(Number(file), homeRank);
    const p = snap.pieceAt(sq);
    if (p?.color !== color || p.type !== expected) movedMinors++;
  }
  return movedMinors * DEVELOPMENT_BONUS;
};

const sideScore = (snap: BoardSnapshot, color: Color): number => {
  let score = 0;
  for (const { square, piece } of snap.pieces()) {
    if (piece.color !== color) continue;
    score += PIECE_VALUE[piece.type];
    const pst = PST[piece.type];
    const idx = piece.color === 'white' ? square.index : mirror(square.index);
    score += pst[idx] ?? 0;
  }
  return score;
};

/**
 * Шведочная оценка позиции: материал на доске + PST + ценность резервов
 * (с коэффициентом RESERVE_VALUE_FACTOR = 0.75) + штраф за дроп-угрозы
 * вокруг собственного короля + ранний-дебют бонус за развитие.
 *
 * Возвращает оценку с точки зрения side-to-move (как у обычного движка):
 * положительное число хорошо для того, чей ход.
 */
export const evaluateShvedki = (pos: ShvedkiPosition): number => {
  const { snap, reserves } = pos;
  const whiteOnBoard = sideScore(snap, 'white');
  const blackOnBoard = sideScore(snap, 'black');
  const whiteReserve = reserveMaterial(reserves, 'white') * RESERVE_VALUE_FACTOR;
  const blackReserve = reserveMaterial(reserves, 'black') * RESERVE_VALUE_FACTOR;
  const whiteDanger = kingDropSafetyPenalty(snap, reserves, 'white');
  const blackDanger = kingDropSafetyPenalty(snap, reserves, 'black');
  const whiteDev = developmentBonus(snap, 'white');
  const blackDev = developmentBonus(snap, 'black');

  const whiteTotal = whiteOnBoard + whiteReserve - whiteDanger + whiteDev;
  const blackTotal = blackOnBoard + blackReserve - blackDanger + blackDev;
  const cpWhitePov = whiteTotal - blackTotal;
  return snap.sideToMove === 'white' ? cpWhitePov : -cpWhitePov;
};

export const SHVEDKI_PIECE_VALUE = PIECE_VALUE;
