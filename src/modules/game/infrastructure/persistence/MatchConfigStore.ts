export interface SerializedMatchConfig {
  readonly version: 1;
  readonly mode: 'standard' | 'shvedki' | 'opening_training';
  readonly opponent: 'ai' | 'hotseat';
  readonly aiLevel: number;
  readonly side: 'white' | 'black' | 'random';
  readonly initialSeconds: number;
  readonly incrementSeconds: number;
  readonly orientation: 'white' | 'black';
  /** Opening-training only: position the trained game started from. */
  readonly startFen?: string;
  /** Opening-training only: i18n key of the trained opening, or null. */
  readonly openingName?: string | null;
}

export class MatchConfigStore {
  constructor(
    private readonly storage: Storage,
    private readonly prefix = 'chess.match-config.',
  ) {}

  private key(id: string): string {
    return this.prefix + id;
  }

  save(matchId: string, config: SerializedMatchConfig): void {
    this.storage.setItem(this.key(matchId), JSON.stringify(config));
  }

  load(matchId: string): SerializedMatchConfig | null {
    const raw = this.storage.getItem(this.key(matchId));
    if (!raw) return null;
    try {
      const data = JSON.parse(raw) as SerializedMatchConfig;
      if ((data.version as number) !== 1) return null;
      return data;
    } catch {
      return null;
    }
  }

  delete(matchId: string): void {
    this.storage.removeItem(this.key(matchId));
  }
}
