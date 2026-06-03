import type {
  MatchRepository,
} from '@modules/game/application/ports/MatchRepository.js';
import type { Match } from '@modules/game/domain/game/Match.js';

export class InMemoryMatchRepository implements MatchRepository {
  private readonly store = new Map<string, Match>();

  save(match: Match): void {
    this.store.set(match.id, match);
  }

  get(id: string): Match {
    const match = this.store.get(id);
    if (!match) throw new Error(`Match not found: ${id}`);
    return match;
  }

  has(id: string): boolean {
    return this.store.has(id);
  }

  delete(id: string): void {
    this.store.delete(id);
  }
}
