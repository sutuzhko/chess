import type {
  EngineAdapter,
} from '@modules/game/application/ports/EngineAdapter.js';
import type { Task } from '@modules/puzzles/domain/training/Task.js';

export interface Hint {
  readonly nextExpectedUci: string | null;
  readonly engineSuggestion: string | null;
  readonly engineScore: number | null;
}

export class HintGenerator {
  constructor(private readonly engine?: EngineAdapter) {}

  async hintFor(task: Task, fen: string, expectedNextUci: string | null): Promise<Hint> {
    if (!this.engine) {
      return {
        nextExpectedUci: expectedNextUci,
        engineSuggestion: null,
        engineScore: null,
      };
    }
    const result = await this.engine.analyze({ fen, maxDepth: 4 });
    return {
      nextExpectedUci: expectedNextUci,
      engineSuggestion: result.bestMoveUci,
      engineScore: result.score,
    };
  }
}
