import type {
  MatchRepository,
} from '@modules/game/application/ports/MatchRepository.js';
import type { Move, Square } from '@modules/game/domain/game';

export class GetLegalMovesUseCase {
  constructor(private readonly repo: MatchRepository) {}

  execute({ matchId, fromSquare }: { matchId: string; fromSquare?: Square }): Move[] {
    const moves = this.repo.get(matchId).legalMoves();
    return fromSquare ? moves.filter((m) => m.from.equals(fromSquare)) : moves;
  }
}
