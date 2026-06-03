import type { EnginePosition } from '@engine/core/EnginePosition.js';
import {
  BLACK,
  EMPTY,
  type EngineMove,
  pieceColor,
  pieceType,
  PT_PAWN,
  rankOf,
  WHITE,
} from '@engine/core/EnginePosition.js';
import { EngineMoveGen } from '@engine/core/MoveGen.js';
import { evaluate } from '@engine/evaluation/Evaluator.js';
import { adjustDepthForEndgame } from './EndgameDepth.js';
import { MoveOrderer } from './MoveOrdering.js';
import {
  INF,
  MATE,
  moveToUci,
  type RootMove,
  sameMove,
  type SearchOptions,
  type SearchResult,
} from './SearchTypes.js';
import {
  TranspositionTable,
  TT_EXACT,
  TT_LOWER,
  TT_UPPER,
  type TTEntry,
} from './TranspositionTable.js';

export {
  INF,
  MATE,
  moveToUci,
  type RootMove,
  type SearchOptions,
  type SearchResult,
} from './SearchTypes.js';

const TIME_CHECK_MASK = 4095;
const MATE_WINDOW = 100;

// Mate-скоры в TT хранятся относительно текущего узла (без ply-смещения от корня).
// При записи добавляем ply, при чтении — вычитаем. Без этой коррекции одна и та же
// позиция, достигнутая через разные глубины (transposition), возвращает «застывшую»
// дистанцию мата, что блокирует поиск более короткого мата в iterative deepening
// и даёт неверный mateIn.
function ttScoreToStore(score: number, ply: number): number {
  if (score >= MATE - MATE_WINDOW) return score + ply;
  if (score <= -MATE + MATE_WINDOW) return score - ply;
  return score;
}

function ttScoreFromStore(score: number, ply: number): number {
  if (score >= MATE - MATE_WINDOW) return score - ply;
  if (score <= -MATE + MATE_WINDOW) return score + ply;
  return score;
}

export class Search {
  private nodes = 0;
  private startTime = 0;
  private maxTimeMs = Number.POSITIVE_INFINITY;
  private stopRequested = false;
  private readonly tt: TranspositionTable;
  private readonly moveOrderer = new MoveOrderer();
  private shouldStop: (() => boolean) | undefined;
  private rootBest: EngineMove | null = null;
  private currentRootMoves: RootMove[] = [];
  private bestRootMoves: RootMove[] = [];

  constructor(tt?: TranspositionTable) {
    this.tt = tt ?? new TranspositionTable();
  }

  stop(): void {
    this.stopRequested = true;
  }

  search(position: EnginePosition, options: SearchOptions = {}): SearchResult {
    const baseDepth = options.maxDepth ?? 4;
    const maxDepth = adjustDepthForEndgame(position, baseDepth);
    this.maxTimeMs = options.maxTimeMs ?? Number.POSITIVE_INFINITY;
    this.shouldStop = options.shouldStop;
    this.stopRequested = false;
    this.startTime = Date.now();
    this.nodes = 0;
    this.rootBest = null;
    this.bestRootMoves = [];
    this.moveOrderer.clear();

    let bestMateScore = 0;
    let stableMateCount = 0;
    let lastResult: SearchResult = {
      bestMove: null,
      bestUci: null,
      score: 0,
      depth: 0,
      nodes: 0,
      pv: [],
      elapsedMs: 0,
      rootMoves: [],
    };

    for (let depth = 1; depth <= maxDepth; depth++) {
      if (this.outOfTime()) break;
      this.currentRootMoves = [];
      const score = this.alphaBeta(position, depth, 0, -INF, INF);
      if (this.outOfTime() && depth > 1) break;
      this.bestRootMoves = [...this.currentRootMoves].sort((a, b) => b.score - a.score);
      const pv = this.collectPv(position, depth);
      const result: SearchResult = {
        bestMove: this.rootBest,
        bestUci: this.rootBest ? moveToUci(this.rootBest) : null,
        score,
        depth,
        nodes: this.nodes,
        pv,
        elapsedMs: Date.now() - this.startTime,
        rootMoves: this.bestRootMoves,
      };
      lastResult = result;
      options.onProgress?.(result);

      // При найденном форсированном мате — НЕ обрывать iterative deepening сразу.
      // Глубже может найтись более короткий мат (мат-в-3 вместо мат-в-4). Прерываем
      // лишь когда: (а) мат-в-1/2 — короче не бывает, ИЛИ (б) дистанция не улучшилась
      // в течение ≥2 итераций подряд И глубина уже не меньше дистанции мата
      // (значит, более короткого мата просто нет).
      if (Math.abs(score) > MATE - MATE_WINDOW) {
        const mateDist = MATE - Math.abs(score);
        if (mateDist <= 3) break;
        if (bestMateScore === 0 || Math.abs(score) > Math.abs(bestMateScore)) {
          bestMateScore = score;
          stableMateCount = 1;
        } else if (Math.abs(score) === Math.abs(bestMateScore)) {
          stableMateCount++;
        }
        if (stableMateCount >= 2 && depth >= mateDist) break;
      }
    }
    return lastResult;
  }

  private outOfTime(): boolean {
    if (this.stopRequested) return true;
    if (this.shouldStop?.()) {
      this.stopRequested = true;
      return true;
    }
    if (Date.now() - this.startTime > this.maxTimeMs) {
      this.stopRequested = true;
      return true;
    }
    return false;
  }

  private alphaBeta(
    position: EnginePosition,
    depth: number,
    ply: number,
    alpha: number,
    beta: number,
  ): number {
    this.nodes++;
    if ((this.nodes & TIME_CHECK_MASK) === 0 && this.outOfTime()) return 0;

    const alphaOrig = alpha;
    const tt = this.tt.probe(position.hash);
    let ttMove: EngineMove | null = null;
    if (tt && tt.depth >= depth) {
      const ttScore = ttScoreFromStore(tt.score, ply);
      if (tt.flag === TT_EXACT) return ttScore;
      if (tt.flag === TT_LOWER && ttScore > alpha) alpha = ttScore;
      else if (tt.flag === TT_UPPER && ttScore < beta) beta = ttScore;
      if (alpha >= beta) return ttScore;
    }
    if (tt) ttMove = tt.bestMove;

    if (depth <= 0) return this.quiescence(position, alpha, beta, ply);

    const moves: EngineMove[] = [];
    EngineMoveGen.generateLegal(position, moves);
    if (moves.length === 0) {
      const us = position.sideToMove;
      const kingSq = position.kingSquare[us]!;
      if (EngineMoveGen.isSquareAttacked(position, kingSq, us ^ 1)) return -MATE + ply;
      return 0;
    }

    this.moveOrderer.order(moves, ttMove, ply);

    const us = position.sideToMove;
    const inCheck = EngineMoveGen.isSquareAttacked(position, position.kingSquare[us]!, us ^ 1);

    let bestScore = -INF;
    let bestMove: EngineMove | null = null;
    let moveIndex = 0;

    for (const move of moves) {
      const isQuiet = move.captured === EMPTY && move.promotion === 0;

      position.make(move);
      // Check extension: если ход ставит шах, копаем на 1 ply глубже.
      const them = position.sideToMove;
      const givesCheck = EngineMoveGen.isSquareAttacked(
        position,
        position.kingSquare[them]!,
        them ^ 1,
      );
      const ext = givesCheck ? 1 : 0;
      const doLmr = ply > 0 && depth >= 3 && moveIndex >= 2 && isQuiet && !inCheck && !givesCheck;

      let score: number;
      if (doLmr) {
        const reduction = moveIndex >= 6 ? 2 : 1;
        score = -this.alphaBeta(position, depth - 1 - reduction, ply + 1, -alpha - 1, -alpha);
        if (score > alpha) {
          score = -this.alphaBeta(position, depth - 1, ply + 1, -beta, -alpha);
        }
      } else {
        score = -this.alphaBeta(position, depth - 1 + ext, ply + 1, -beta, -alpha);
      }
      position.unmake();
      if (this.stopRequested) return 0;
      if (ply === 0) {
        this.currentRootMoves.push({ uci: moveToUci(move), score });
      }
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
        if (ply === 0) this.rootBest = move;
      }
      if (score > alpha) alpha = score;
      if (alpha >= beta) {
        if (isQuiet) {
          this.moveOrderer.updateKillers(move, ply);
          this.moveOrderer.updateHistory(move, depth);
        }
        break;
      }
      moveIndex++;
    }

    let flag: number;
    if (bestScore <= alphaOrig) flag = TT_UPPER;
    else if (bestScore >= beta) flag = TT_LOWER;
    else flag = TT_EXACT;

    const entry: TTEntry = {
      hash: position.hash,
      depth,
      score: ttScoreToStore(bestScore, ply),
      flag,
      bestMove,
    };
    this.tt.store(entry);
    return bestScore;
  }

  private quiescence(
    position: EnginePosition,
    alpha: number,
    beta: number,
    ply: number,
  ): number {
    this.nodes++;
    const standPat = evaluate(position);
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;

    const tactical: EngineMove[] = [];
    const all: EngineMove[] = [];
    EngineMoveGen.generateLegal(position, all);
    for (const m of all) {
      if (m.captured !== EMPTY || m.promotion !== 0) {
        tactical.push(m);
        continue;
      }
      // Pawn push на предпоследнюю горизонталь — угроза превращения.
      const piece = position.pieces[m.from]!;
      if (pieceType(piece) === PT_PAWN) {
        const toR = rankOf(m.to);
        const c = pieceColor(piece);
        if ((c === WHITE && toR === 6) || (c === BLACK && toR === 1)) {
          tactical.push(m);
        }
      }
    }
    this.moveOrderer.order(tactical, null, ply);

    for (const move of tactical) {
      position.make(move);
      const score = -this.quiescence(position, -beta, -alpha, ply + 1);
      position.unmake();
      if (this.stopRequested) return 0;
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  }

  private collectPv(position: EnginePosition, depth: number): string[] {
    const pv: string[] = [];
    const made: EngineMove[] = [];
    let cur: TTEntry | undefined = this.tt.probe(position.hash);
    let safety = 0;
    while (cur?.bestMove && safety < depth + 4) {
      const move = cur.bestMove;
      const moves: EngineMove[] = [];
      EngineMoveGen.generateLegal(position, moves);
      if (!moves.some((m) => sameMove(m, move))) break;
      pv.push(moveToUci(move));
      position.make(move);
      made.push(move);
      cur = this.tt.probe(position.hash);
      safety++;
    }
    for (let i = made.length - 1; i >= 0; i--) position.unmake();
    return pv;
  }
}
