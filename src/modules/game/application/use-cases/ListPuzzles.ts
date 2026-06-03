import type {
  PuzzleListFilter,
  PuzzleRepository,
} from '@modules/game/application/ports/PuzzleRepository.js';
import type { Puzzle } from '@modules/game/domain/puzzles';

export class ListPuzzlesUseCase {
  constructor(private readonly repo: PuzzleRepository) {}

  execute(filter?: PuzzleListFilter): Puzzle[] {
    return this.repo.list(filter);
  }
}
