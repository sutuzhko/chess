import {
  EMPTY,
  type EngineMove,
  pieceType,
} from '@engine/core/EnginePosition.js';
import { PIECE_VALUE } from '@engine/evaluation/PieceSquareTables.js';
import { sameMove } from './SearchTypes.js';

const SCORE_HASH = 1_000_000;
const SCORE_PROMO_QUEEN = 900_000;
const SCORE_CAPTURE_BASE = 100_000;
const SCORE_KILLER_1 = 90_000;
const SCORE_KILLER_2 = 80_000;
const SCORE_HISTORY_MAX = 70_000;
const MAX_PLY = 128;
const PROMO_QUEEN = 5;

const HISTORY_AGE_SHIFT = 2;

/**
 * Move ordering: hash move > промоция в ферзя > MVV-LVA взятия >
 *  killer-1 > killer-2 > history > всё остальное.
 *
 * Killers и history живут per-search: владелец Search вызывает clear()
 * в начале каждого root-поиска.
 */
export class MoveOrderer {
  private killers: (EngineMove | null)[][] = [];
  private history: Int32Array;
  private historyMax = 1;

  constructor() {
    for (let i = 0; i < MAX_PLY; i++) this.killers.push([null, null]);
    this.history = new Int32Array(64 * 64);
  }

  clear(): void {
    for (let i = 0; i < MAX_PLY; i++) this.killers[i] = [null, null];
    this.history = new Int32Array(64 * 64);
    this.historyMax = 1;
  }

  score(move: EngineMove, ttMove: EngineMove | null, ply: number): number {
    if (ttMove && sameMove(move, ttMove)) return SCORE_HASH;
    if (move.promotion === PROMO_QUEEN) return SCORE_PROMO_QUEEN;
    if (move.captured !== EMPTY) {
      const victim = PIECE_VALUE[pieceType(move.captured)]!;
      // MVV: жертва важна, аттакер играет тай-брейк (PIECE_VALUE первичный фактор).
      return SCORE_CAPTURE_BASE + victim * 10;
    }
    if (move.promotion !== 0) return SCORE_PROMO_QUEEN - 1000;
    if (ply >= 0 && ply < MAX_PLY) {
      const slots = this.killers[ply]!;
      if (slots[0] && sameMove(slots[0], move)) return SCORE_KILLER_1;
      if (slots[1] && sameMove(slots[1], move)) return SCORE_KILLER_2;
    }
    const h = this.history[(move.from << 6) | move.to]!;
    if (h <= 0) return 0;
    // Нормализуем до [0..SCORE_HISTORY_MAX-1].
    return Math.min(SCORE_HISTORY_MAX - 1, Math.floor((h * SCORE_HISTORY_MAX) / this.historyMax));
  }

  order(moves: EngineMove[], ttMove: EngineMove | null, ply: number): void {
    const n = moves.length;
    if (n < 2) return;
    const scores = new Int32Array(n);
    for (let i = 0; i < n; i++) scores[i] = this.score(moves[i]!, ttMove, ply);
    // Простая сортировка по убыванию score — n обычно ≤ 60.
    const indexed = moves.map((m, i) => ({ m, s: scores[i]! }));
    indexed.sort((a, b) => b.s - a.s);
    for (let i = 0; i < n; i++) moves[i] = indexed[i]!.m;
  }

  updateKillers(move: EngineMove, ply: number): void {
    if (move.captured !== EMPTY || move.promotion !== 0) return; // только quiet
    if (ply < 0 || ply >= MAX_PLY) return;
    const slots = this.killers[ply]!;
    if (slots[0] && sameMove(slots[0], move)) return;
    slots[1] = slots[0] ?? null;
    slots[0] = move;
  }

  updateHistory(move: EngineMove, depth: number): void {
    if (move.captured !== EMPTY || move.promotion !== 0) return;
    const idx = (move.from << 6) | move.to;
    const inc = depth * depth;
    const next = this.history[idx]! + inc;
    this.history[idx] = next;
    if (next > this.historyMax) this.historyMax = next;
    // Anti-overflow: периодически шкалируем при огромных значениях.
    if (this.historyMax > 1 << 28) {
      for (let i = 0; i < this.history.length; i++) {
        this.history[i] = (this.history[i]! >> HISTORY_AGE_SHIFT);
      }
      this.historyMax >>= HISTORY_AGE_SHIFT;
      if (this.historyMax < 1) this.historyMax = 1;
    }
  }
}
