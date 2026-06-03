import type {
  PuzzleRepository,
} from '@modules/game/application/ports/PuzzleRepository.js';
import type { Puzzle, PuzzleData } from '@modules/game/domain/puzzles';

export class SaveCustomPuzzleUseCase {
  constructor(private readonly repo: PuzzleRepository) {}

  execute(data: PuzzleData): Puzzle {
    return this.repo.saveCustom(data);
  }
}

export class DeleteCustomPuzzleUseCase {
  constructor(private readonly repo: PuzzleRepository) {}

  execute(id: string): void {
    this.repo.deleteCustom(id);
  }
}
