import { EnginePosition, Search } from '@engine/index.js';
import type { RootMove } from '@engine/search/Search.js';

export interface AnalyzeRequest {
  type: 'analyze';
  id: number;
  fen: string;
  maxDepth?: number;
  maxTimeMs?: number;
  multiPV?: number;
  temperature?: number;
  noiseCP?: number;
  blunderProb?: number;
}

export interface CancelRequest {
  type: 'cancel';
  id: number;
}

export type WorkerRequest = AnalyzeRequest | CancelRequest;

export interface ProgressMessage {
  type: 'progress';
  id: number;
  depth: number;
  score: number;
  bestMoveUci: string | null;
  nodes: number;
  pv: string[];
  elapsedMs: number;
}

export interface ResultMessage {
  type: 'result';
  id: number;
  depth: number;
  score: number;
  bestMoveUci: string | null;
  nodes: number;
  pv: string[];
  elapsedMs: number;
}

export interface ErrorMessage {
  type: 'error';
  id: number;
  message: string;
}

export type WorkerMessage = ProgressMessage | ResultMessage | ErrorMessage;

function gaussianNoise(sigma: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(Math.max(u1, 1e-10))) * Math.cos(2 * Math.PI * u2);
  return z * sigma;
}

function weightedPick(candidates: RootMove[], temperature: number): string {
  const first = candidates[0];
  if (!first) return '';
  const maxScore = first.score;
  const weights = candidates.map((c) => Math.exp((c.score - maxScore) / (100 * temperature)));
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i] ?? 0;
    if (r <= 0) return candidates[i]?.uci ?? first.uci;
  }
  return candidates[candidates.length - 1]?.uci ?? first.uci;
}

function pickFromLowerHalf(pool: readonly RootMove[]): string {
  const lowerHalfStart = Math.floor(pool.length / 2);
  const lower = pool.slice(lowerHalfStart);
  const picked = lower[Math.floor(Math.random() * lower.length)];
  return picked?.uci ?? pool[0]?.uci ?? '';
}

function selectMove(
  rootMoves: RootMove[],
  multiPV: number,
  temperature: number,
  noiseCP: number,
  blunderProb: number,
): string {
  const candidates = rootMoves.slice(0, multiPV);
  if (candidates.length === 0) return rootMoves[0]?.uci ?? '';

  if (noiseCP > 0) {
    const noisy = candidates.map((c) => ({ uci: c.uci, score: c.score + gaussianNoise(noiseCP) }));
    noisy.sort((a, b) => b.score - a.score);

    if (blunderProb > 0 && Math.random() < blunderProb && noisy.length > 1) {
      return pickFromLowerHalf(noisy);
    }

    if (temperature > 0.02) return weightedPick(noisy, temperature);
    return noisy[0]?.uci ?? candidates[0]?.uci ?? '';
  }

  if (blunderProb > 0 && Math.random() < blunderProb && candidates.length > 1) {
    return pickFromLowerHalf(candidates);
  }

  if (temperature > 0.02) return weightedPick(candidates, temperature);
  return candidates[0]?.uci ?? '';
}

let activeSearch: Search | null = null;
const cancelledIds = new Set<number>();

self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const data = event.data;
  if (data.type === 'cancel') {
    cancelledIds.add(data.id);
    activeSearch?.stop();
    return;
  }

  const multiPV = data.multiPV ?? 1;
  const temperature = data.temperature ?? 0.01;
  const noiseCP = data.noiseCP ?? 0;
  const blunderProb = data.blunderProb ?? 0;

  try {
    const position = EnginePosition.fromFen(data.fen);
    const search = new Search();
    activeSearch = search;
    const result = search.search(position, {
      maxDepth: data.maxDepth ?? 4,
      maxTimeMs: data.maxTimeMs ?? Number.POSITIVE_INFINITY,
      onProgress: (info) => {
        if (cancelledIds.has(data.id)) return;
        const progress: ProgressMessage = {
          type: 'progress',
          id: data.id,
          depth: info.depth,
          score: info.score,
          bestMoveUci: info.bestUci,
          nodes: info.nodes,
          pv: info.pv,
          elapsedMs: info.elapsedMs,
        };
        (self as unknown as Worker).postMessage(progress);
      },
    });

    const rootMoves = result.rootMoves.length > 0 ? result.rootMoves : (result.bestUci ? [{ uci: result.bestUci, score: result.score }] : []);
    const chosenUci = rootMoves.length > 1
      ? selectMove(rootMoves, multiPV, temperature, noiseCP, blunderProb)
      : (result.bestUci ?? null);

    const final: ResultMessage = {
      type: 'result',
      id: data.id,
      depth: result.depth,
      score: result.score,
      bestMoveUci: chosenUci,
      nodes: result.nodes,
      pv: result.pv,
      elapsedMs: result.elapsedMs,
    };
    (self as unknown as Worker).postMessage(final);
  } catch (e) {
    const err: ErrorMessage = {
      type: 'error',
      id: data.id,
      message: e instanceof Error ? e.message : String(e),
    };
    (self as unknown as Worker).postMessage(err);
  } finally {
    activeSearch = null;
  }
});
