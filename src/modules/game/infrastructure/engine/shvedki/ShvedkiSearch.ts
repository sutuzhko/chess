import {
  type BoardSnapshot,
  GameRules,
  MoveGenerator,
  oppositeColor,
  Square,
} from '@modules/game/domain/game';
import {
  type ShvedkiMove,
  ShvedkiMoveGenerator,
} from '@modules/game/domain/shvedki';
import { evaluateShvedki, SHVEDKI_PIECE_VALUE } from './ShvedkiEvaluator.js';
import type { ShvedkiPosition } from './ShvedkiPosition.js';

const MATE = 30000;
const INF = 1_000_000;

export interface ShvedkiSearchOptions {
  readonly maxDepth: number;
  readonly multiPV: number;
  readonly temperature: number;
  readonly noiseCP: number;
  readonly blunderProb: number;
  /** Максимум дроп-кандидатов на одну вершину поиска (не root). */
  readonly maxDropsPerNode: number;
}

export interface ShvedkiRootMove {
  readonly move: ShvedkiMove;
  readonly score: number;
}

export interface ShvedkiSearchResult {
  readonly bestMove: ShvedkiMove | null;
  readonly score: number;
  readonly rootMoves: readonly ShvedkiRootMove[];
}

interface OrderedMove {
  readonly move: ShvedkiMove;
  readonly order: number;
}

const chebyshev = (a: { file: number; rank: number }, b: { file: number; rank: number }): number =>
  Math.max(Math.abs(a.file - b.file), Math.abs(a.rank - b.rank));

const findKingSquare = (snap: BoardSnapshot, color: 'white' | 'black'): Square => {
  for (let i = 0; i < 64; i++) {
    const sq = Square.fromIndex(i);
    const p = snap.pieceAt(sq);
    if (p?.color === color && p.type === 'king') return sq;
  }
  // В легальной позиции мы сюда не попадаем.
  return Square.of(4, color === 'white' ? 0 : 7);
};

const orderKey = (move: ShvedkiMove, snap: BoardSnapshot, oppKing: Square): number => {
  const side = snap.sideToMove;
  const oppColor = oppositeColor(side);
  if (move.kind === 'normal') {
    const m = move.move;
    if (m.captured) {
      const attacker = snap.pieceAt(m.from);
      const lva = attacker ? SHVEDKI_PIECE_VALUE[attacker.type] : 100;
      return 100_000 + SHVEDKI_PIECE_VALUE[m.captured] * 10 - lva;
    }
    if (m.promotion) return 90_000;
    return 0;
  }
  let key = 0;
  const dist = chebyshev(move.to, oppKing);
  key += (7 - dist) * 80;

  const attackedByOpp = MoveGenerator.isSquareAttacked(snap, move.to, oppColor);
  const defendedBySelf = MoveGenerator.isSquareAttacked(snap, move.to, side);
  if (attackedByOpp && !defendedBySelf) {
    key -= SHVEDKI_PIECE_VALUE[move.piece];
  } else if (attackedByOpp && defendedBySelf && move.piece !== 'pawn') {
    key -= SHVEDKI_PIECE_VALUE[move.piece] * 0.4;
  }
  key += SHVEDKI_PIECE_VALUE[move.piece] * 0.05;
  return key;
};

const orderMoves = (
  moves: readonly ShvedkiMove[],
  snap: BoardSnapshot,
  maxDrops: number,
): ShvedkiMove[] => {
  const oppKing = findKingSquare(snap, oppositeColor(snap.sideToMove));
  const normals: OrderedMove[] = [];
  const drops: OrderedMove[] = [];
  for (const m of moves) {
    const o = orderKey(m, snap, oppKing);
    if (m.kind === 'normal') normals.push({ move: m, order: o });
    else drops.push({ move: m, order: o });
  }
  drops.sort((a, b) => b.order - a.order);
  const limited = drops.slice(0, maxDrops);
  const combined = [...normals, ...limited];
  combined.sort((a, b) => b.order - a.order);
  return combined.map((x) => x.move);
};

const gaussian = (sigma: number): number => {
  const u1 = Math.max(Math.random(), 1e-10);
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * sigma;
};

const weightedPick = (moves: readonly ShvedkiRootMove[], temperature: number): ShvedkiMove => {
  const first = moves[0];
  if (!first) throw new Error('weightedPick on empty list');
  const maxScore = first.score;
  const weights = moves.map((m) => Math.exp((m.score - maxScore) / (100 * temperature)));
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < moves.length; i++) {
    r -= weights[i] ?? 0;
    if (r <= 0) return moves[i]?.move ?? first.move;
  }
  return moves[moves.length - 1]?.move ?? first.move;
};

const pickFromLowerHalf = (moves: readonly ShvedkiRootMove[]): ShvedkiMove => {
  const start = Math.floor(moves.length / 2);
  const lower = moves.slice(start);
  const picked = lower[Math.floor(Math.random() * lower.length)];
  return picked?.move ?? moves[0]?.move ?? (() => { throw new Error('empty'); })();
};

const selectRootMove = (
  rootMoves: readonly ShvedkiRootMove[],
  opts: ShvedkiSearchOptions,
): ShvedkiMove | null => {
  if (rootMoves.length === 0) return null;
  const top = rootMoves.slice(0, Math.max(1, opts.multiPV));
  let pool: ShvedkiRootMove[] = top.map((m) => ({ move: m.move, score: m.score }));

  if (opts.noiseCP > 0) {
    pool = pool.map((m) => ({ move: m.move, score: m.score + gaussian(opts.noiseCP) }));
    pool.sort((a, b) => b.score - a.score);
  }

  if (opts.blunderProb > 0 && Math.random() < opts.blunderProb && pool.length > 1) {
    return pickFromLowerHalf(pool);
  }

  if (opts.temperature > 0.02) return weightedPick(pool, opts.temperature);
  return pool[0]?.move ?? null;
};

export class ShvedkiSearch {
  private nodes = 0;

  search(pos: ShvedkiPosition, opts: ShvedkiSearchOptions): ShvedkiSearchResult {
    this.nodes = 0;
    const moves = ShvedkiMoveGenerator.legalMoves(pos.snap, pos.reserves);
    if (moves.length === 0) {
      return { bestMove: null, score: 0, rootMoves: [] };
    }
    // На root рассматриваем больше дропов, чем во внутренних вершинах.
    const rootMaxDrops = Math.min(moves.filter((m) => m.kind === 'drop').length, 20);
    const ordered = orderMoves(moves, pos.snap, rootMaxDrops);

    const rootMoves: ShvedkiRootMove[] = [];
    let alpha = -INF;
    const beta = INF;
    for (const move of ordered) {
      const next = ShvedkiMoveGenerator.applyMove(pos.snap, pos.reserves, move);
      const score = -this.alphaBeta(
        { snap: next.snap, reserves: next.reserves },
        opts.maxDepth - 1,
        -beta,
        -alpha,
        1,
        opts.maxDropsPerNode,
      );
      rootMoves.push({ move, score });
      if (score > alpha) alpha = score;
    }
    rootMoves.sort((a, b) => b.score - a.score);
    const best = selectRootMove(rootMoves, opts);
    return {
      bestMove: best,
      score: rootMoves[0]?.score ?? 0,
      rootMoves,
    };
  }

  private alphaBeta(
    pos: ShvedkiPosition,
    depth: number,
    alpha: number,
    beta: number,
    ply: number,
    maxDrops: number,
  ): number {
    this.nodes++;
    if (depth <= 0) return evaluateShvedki(pos);

    const moves = ShvedkiMoveGenerator.legalMoves(pos.snap, pos.reserves);
    if (moves.length === 0) {
      const inCheck = GameRules.isInCheck(pos.snap, pos.snap.sideToMove);
      return inCheck ? -MATE + ply : 0;
    }
    const ordered = orderMoves(moves, pos.snap, maxDrops);

    let best = -INF;
    let a = alpha;
    for (const move of ordered) {
      const next = ShvedkiMoveGenerator.applyMove(pos.snap, pos.reserves, move);
      const score = -this.alphaBeta(
        { snap: next.snap, reserves: next.reserves },
        depth - 1,
        -beta,
        -a,
        ply + 1,
        maxDrops,
      );
      if (score > best) best = score;
      if (best > a) a = best;
      if (a >= beta) break;
    }
    return best;
  }

  get nodeCount(): number { return this.nodes; }
}
