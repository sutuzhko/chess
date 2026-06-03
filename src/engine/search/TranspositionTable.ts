import type { EngineMove } from '@engine/core/EnginePosition.js';

export const TT_EXACT = 0;
export const TT_LOWER = 1;
export const TT_UPPER = 2;

export interface TTEntry {
  hash: bigint;
  depth: number;
  score: number;
  flag: number;
  bestMove: EngineMove | null;
}

export class TranspositionTable {
  private table: Map<bigint, TTEntry>;
  private readonly maxEntries: number;

  constructor(maxEntries: number = 1 << 18) {
    this.table = new Map();
    this.maxEntries = maxEntries;
  }

  probe(hash: bigint): TTEntry | undefined {
    return this.table.get(hash);
  }

  store(entry: TTEntry): void {
    if (this.table.size >= this.maxEntries) {
      const firstKey = this.table.keys().next().value;
      if (firstKey !== undefined) this.table.delete(firstKey);
    }
    this.table.set(entry.hash, entry);
  }

  clear(): void {
    this.table.clear();
  }

  get size(): number {
    return this.table.size;
  }
}
