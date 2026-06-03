import type {
  PuzzleListFilter,
  PuzzleRepository,
} from '@modules/game/application/ports/PuzzleRepository.js';
import {
  Puzzle,
  PUZZLE_SOURCE,
  type PuzzleData,
} from '@modules/game/domain/puzzles';
import bundledRaw from './bundled-puzzles.json';
import { PuzzleCodec } from './PuzzleCodec.js';

const STORAGE_KEY = 'chess.puzzles.custom';

export class LocalStoragePuzzleRepository implements PuzzleRepository {
  private readonly bundled: Puzzle[];
  private custom: Puzzle[] = [];

  constructor(private readonly storage: Storage) {
    this.bundled = PuzzleCodec.parseList(bundledRaw, PUZZLE_SOURCE.bundled);
    this.custom = this.readCustom();
  }

  list(filter?: PuzzleListFilter): Puzzle[] {
    const source = filter?.source ?? 'all';
    const pool: Puzzle[] = [];
    if (source === 'all' || source === 'bundled') pool.push(...this.bundled);
    if (source === 'all' || source === 'custom') pool.push(...this.custom);

    return pool.filter((p) => {
      if (filter?.minElo !== undefined && p.elo < filter.minElo) return false;
      if (filter?.maxElo !== undefined && p.elo > filter.maxElo) return false;
      if (filter?.themes && filter.themes.length > 0) {
        const matches = filter.themes.some((t) => p.themes.includes(t));
        if (!matches) return false;
      }
      if (filter?.query) {
        const q = filter.query.toLowerCase();
        const haystack = `${p.title ?? ''} ${p.description ?? ''} ${p.id}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }

  get(id: string): Puzzle | null {
    return (
      this.bundled.find((p) => p.id === id)
      ?? this.custom.find((p) => p.id === id)
      ?? null
    );
  }

  saveCustom(data: PuzzleData): Puzzle {
    const enriched: PuzzleData = {
      ...data,
      source: PUZZLE_SOURCE.custom,
      createdAt: data.createdAt ?? new Date().toISOString(),
    };
    const puzzle = Puzzle.fromData(enriched);
    const idx = this.custom.findIndex((p) => p.id === puzzle.id);
    if (idx >= 0) this.custom[idx] = puzzle;
    else this.custom.push(puzzle);
    this.persist();
    return puzzle;
  }

  deleteCustom(id: string): void {
    this.custom = this.custom.filter((p) => p.id !== id);
    this.persist();
  }

  exportCustom(): PuzzleData[] {
    return this.custom.map((p) => p.toData());
  }

  importCustom(data: readonly PuzzleData[]): number {
    let added = 0;
    for (const raw of data) {
      try {
        const puzzle = PuzzleCodec.parse(raw, PUZZLE_SOURCE.custom);
        const idx = this.custom.findIndex((p) => p.id === puzzle.id);
        if (idx >= 0) this.custom[idx] = puzzle;
        else this.custom.push(puzzle);
        added++;
      } catch (e) {
        console.warn('Skipped invalid puzzle import', e);
      }
    }
    this.persist();
    return added;
  }

  private readCustom(): Puzzle[] {
    const raw = this.storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      return PuzzleCodec.parseList(parsed, PUZZLE_SOURCE.custom);
    } catch (e) {
      console.warn('Failed to parse custom puzzles, resetting', e);
      return [];
    }
  }

  private persist(): void {
    const data = this.custom.map((p) => p.toData());
    this.storage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}
