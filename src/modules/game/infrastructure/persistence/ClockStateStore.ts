export interface SerializedClockState {
  readonly version: 1;
  readonly whiteMs: number;
  readonly blackMs: number;
  readonly active: 'white' | 'black' | null;
}

export interface SerializedShvedkiClocks {
  readonly version: 1;
  readonly clockA: SerializedClockState;
  readonly clockB: SerializedClockState;
  readonly aStarted: boolean;
  readonly bStarted: boolean;
}

export class ClockStateStore {
  constructor(
    private readonly storage: Storage,
    private readonly prefix = 'chess.clock-state.',
  ) {}

  private key(id: string, suffix: string): string {
    return `${this.prefix}${suffix}.${id}`;
  }

  saveStandard(matchId: string, state: SerializedClockState): void {
    this.storage.setItem(this.key(matchId, 'std'), JSON.stringify(state));
  }

  loadStandard(matchId: string): SerializedClockState | null {
    const raw = readVersioned(this.storage, this.key(matchId, 'std'));
    return raw as SerializedClockState | null;
  }

  saveShvedki(matchId: string, state: SerializedShvedkiClocks): void {
    this.storage.setItem(this.key(matchId, 'shv'), JSON.stringify(state));
  }

  loadShvedki(matchId: string): SerializedShvedkiClocks | null {
    const raw = readVersioned(this.storage, this.key(matchId, 'shv'));
    return raw as SerializedShvedkiClocks | null;
  }

  delete(matchId: string): void {
    this.storage.removeItem(this.key(matchId, 'std'));
    this.storage.removeItem(this.key(matchId, 'shv'));
  }
}

function readVersioned(storage: Storage, key: string): { version: 1 } | null {
  const raw = storage.getItem(key);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as { version: 1 };
    if ((data.version as number) !== 1) return null;
    return data;
  } catch {
    return null;
  }
}
