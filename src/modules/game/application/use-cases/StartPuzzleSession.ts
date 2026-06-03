import type {
  PuzzleRepository,
} from '@modules/game/application/ports/PuzzleRepository.js';
import { SolvingSession } from '@modules/game/domain/puzzles';

export interface StartPuzzleSessionInput {
  readonly puzzleId: string;
  readonly sessionId: string;
}

export class StartPuzzleSessionUseCase {
  constructor(private readonly repo: PuzzleRepository) {}

  execute(input: StartPuzzleSessionInput): SolvingSession {
    const puzzle = this.repo.get(input.puzzleId);
    if (!puzzle) throw new Error(`Puzzle not found: ${input.puzzleId}`);
    return SolvingSession.start(puzzle, input.sessionId);
  }
}
