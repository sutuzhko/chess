import type { OpeningSource } from '@modules/game/application';
import { pickWeighted, sideToMoveFromFen } from '@modules/game/application';
import type {
  AnalysisProgress,
  AnalysisRequest,
  AnalysisResult,
  EngineAdapter,
} from '@modules/game/application/ports/EngineAdapter.js';
import type {
  WorkerMessage,
} from '@modules/game/infrastructure/workers/ai.worker.js';

export class WorkerEngineAdapter implements EngineAdapter {
  private worker: Worker;
  private nextId = 1;
  private currentId: number | null = null;
  private source: OpeningSource | null;

  constructor(worker: Worker, source: OpeningSource | null = null) {
    this.worker = worker;
    this.source = source;
  }

  static create(source: OpeningSource | null = null): WorkerEngineAdapter {
    const worker = new Worker(new URL('../workers/ai.worker.ts', import.meta.url), {
      type: 'module',
    });
    return new WorkerEngineAdapter(worker, source);
  }

  async analyze(
    request: AnalysisRequest,
    onProgress?: (info: AnalysisProgress) => void,
  ): Promise<AnalysisResult> {
    if (request.useOpeningBook !== false && this.source) {
      try {
        const moves = await this.source.movesAt(request.fen);
        const bookMove = pickWeighted(moves, sideToMoveFromFen(request.fen));
        if (bookMove) {
          return {
            depth: 0,
            score: 0,
            bestMoveUci: bookMove,
            nodes: 0,
            pv: [bookMove],
            elapsedMs: 0,
          };
        }
      } catch {
        // Источник упал — проваливаемся в обычный поиск движка.
      }
    }
    return this.search(request, onProgress);
  }

  private search(
    request: AnalysisRequest,
    onProgress?: (info: AnalysisProgress) => void,
  ): Promise<AnalysisResult> {
    const id = this.nextId++;
    this.currentId = id;
    return new Promise<AnalysisResult>((resolve, reject) => {
      const handler = (event: MessageEvent<WorkerMessage>): void => {
        const data = event.data;
        if (data.id !== id) return;
        if (data.type === 'progress') {
          onProgress?.({
            depth: data.depth,
            score: data.score,
            bestMoveUci: data.bestMoveUci,
            nodes: data.nodes,
            pv: data.pv,
            elapsedMs: data.elapsedMs,
          });
          return;
        }
        this.worker.removeEventListener('message', handler);
        if (data.type === 'error') {
          reject(new Error(data.message));
          return;
        }
        if (!data.bestMoveUci) {
          reject(new Error('No best move'));
          return;
        }
        resolve({
          depth: data.depth,
          score: data.score,
          bestMoveUci: data.bestMoveUci,
          nodes: data.nodes,
          pv: data.pv,
          elapsedMs: data.elapsedMs,
        });
      };
      this.worker.addEventListener('message', handler);
      this.worker.postMessage({
        type: 'analyze',
        id,
        fen: request.fen,
        maxDepth: request.maxDepth,
        maxTimeMs: request.maxTimeMs,
        multiPV: request.multiPV,
        temperature: request.temperature,
        noiseCP: request.noiseCP,
        blunderProb: request.blunderProb,
      });
    });
  }

  cancel(): void {
    if (this.currentId !== null) {
      this.worker.postMessage({ type: 'cancel', id: this.currentId });
    }
  }

  terminate(): void {
    this.worker.terminate();
  }
}
