import type {
  MatchRepository,
} from '@modules/game/application/ports/MatchRepository.js';
import { BoardSnapshot } from '@modules/game/domain/game/BoardSnapshot.js';
import { Match } from '@modules/game/domain/game/Match.js';

export interface StartMatchInput {
  readonly matchId: string;
  readonly fen?: string;
}

export class StartMatchUseCase {
  constructor(private readonly repo: MatchRepository) {}

  execute(input: StartMatchInput): Match {
    if (this.repo.has(input.matchId)) {
      throw new Error(`Match already exists: ${input.matchId}`);
    }
    const initial = input.fen ? BoardSnapshot.fromFen(input.fen) : BoardSnapshot.initial();
    const match = Match.start(input.matchId, initial);
    this.repo.save(match);
    return match;
  }
}
