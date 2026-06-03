import type { MatchRepository } from '@modules/game/application';
import type { Match } from '@modules/game/domain/game';
import { JsonMatchCodec, type SerializedMatch } from './JsonMatchCodec.js';

export class LocalStorageMatchRepository implements MatchRepository {
  private readonly cache = new Map<string, Match>();

  constructor(
    private readonly storage: Storage,
    private readonly prefix = 'chess.match.',
  ) {}

  private key(id: string): string {
    return this.prefix + id;
  }

  save(match: Match): void {
    this.cache.set(match.id, match);
    const data: SerializedMatch = { ...JsonMatchCodec.serialize(match), savedAt: new Date().toISOString() };
    this.storage.setItem(this.key(match.id), JSON.stringify(data));
  }

  get(id: string): Match {
    const cached = this.cache.get(id);
    if (cached) return cached;
    const raw = this.storage.getItem(this.key(id));
    if (!raw) throw new Error(`Match not found: ${id}`);
    const data = JSON.parse(raw) as SerializedMatch;
    const match = JsonMatchCodec.deserialize(data);
    this.cache.set(id, match);
    return match;
  }

  has(id: string): boolean {
    if (this.cache.has(id)) return true;
    return this.storage.getItem(this.key(id)) !== null;
  }

  delete(id: string): void {
    this.cache.delete(id);
    this.storage.removeItem(this.key(id));
  }

  list(): string[] {
    const ids: string[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key?.startsWith(this.prefix)) ids.push(key.slice(this.prefix.length));
    }
    return ids;
  }
}
