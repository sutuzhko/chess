import type { Match } from '@modules/game/domain/game/Match.js';

export interface MatchRepository {
  save(match: Match): void;
  get(id: string): Match;
  has(id: string): boolean;
  delete(id: string): void;
}
