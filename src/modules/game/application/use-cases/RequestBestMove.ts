import type {
  AnalysisResult,
  EngineAdapter,
} from '@modules/game/application/ports/EngineAdapter.js';
import type {
  MatchRepository,
} from '@modules/game/application/ports/MatchRepository.js';
import {
  AnalysisCompleted,
  AnalysisStarted,
  EvaluationUpdated,
} from '@modules/game/domain/analysis/events';
import type { EventBus } from '@shared/types/EventBus.js';

export interface RequestBestMoveInput {
  readonly matchId: string;
  readonly maxDepth?: number;
  readonly maxTimeMs?: number;
  readonly multiPV?: number;
  readonly temperature?: number;
  readonly noiseCP?: number;
  readonly blunderProb?: number;
}

export class RequestBestMoveUseCase {
  constructor(
    private readonly repo: MatchRepository,
    private readonly engine: EngineAdapter,
    private readonly bus: EventBus,
  ) {}

  async execute(input: RequestBestMoveInput): Promise<AnalysisResult> {
    const match = this.repo.get(input.matchId);
    const fen = match.currentSnapshot.toFen();
    const maxDepth = input.maxDepth ?? 4;
    this.bus.publish(new AnalysisStarted(input.matchId, fen, maxDepth));
    const result = await this.engine.analyze(
      {
        fen,
        ...(input.maxDepth !== undefined ? { maxDepth: input.maxDepth } : {}),
        ...(input.maxTimeMs !== undefined ? { maxTimeMs: input.maxTimeMs } : {}),
        ...(input.multiPV !== undefined ? { multiPV: input.multiPV } : {}),
        ...(input.temperature !== undefined ? { temperature: input.temperature } : {}),
        ...(input.noiseCP !== undefined ? { noiseCP: input.noiseCP } : {}),
        ...(input.blunderProb !== undefined ? { blunderProb: input.blunderProb } : {}),
      },
      (info) => {
        this.bus.publish(
          new EvaluationUpdated(
            input.matchId,
            info.depth,
            info.score,
            info.bestMoveUci,
            info.nodes,
            info.pv,
          ),
        );
      },
    );
    this.bus.publish(
      new AnalysisCompleted(
        input.matchId,
        result.bestMoveUci,
        result.score,
        result.depth,
        result.nodes,
        result.pv,
        result.elapsedMs,
      ),
    );
    return result;
  }
}
