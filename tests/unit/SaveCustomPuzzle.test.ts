import {
  DeleteCustomPuzzleUseCase,
  SaveCustomPuzzleUseCase,
} from '@/modules/game/application/use-cases/SaveCustomPuzzle';
import { PUZZLE_SOURCE, type PuzzleData } from '@/modules/game/domain/puzzles';
import {
  LocalStoragePuzzleRepository,
} from '@/modules/game/infrastructure/puzzles/LocalStoragePuzzleRepository';
import { describe, expect, it } from 'vitest';

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length(): number { return this.map.size; }
  clear(): void { this.map.clear(); }
  getItem(k: string): string | null { return this.map.get(k) ?? null; }
  key(i: number): string | null { return Array.from(this.map.keys())[i] ?? null; }
  removeItem(k: string): void { this.map.delete(k); }
  setItem(k: string, v: string): void { this.map.set(k, v); }
}

const CUSTOM_DATA: PuzzleData = {
  id: 'cust-x',
  fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1',
  sideToMove: 'white',
  solutions: [['d1d8']],
  themes: ['mate-in-1'],
  elo: 800,
  source: PUZZLE_SOURCE.custom,
};

const makeRepo = (): LocalStoragePuzzleRepository =>
  new LocalStoragePuzzleRepository(new MemoryStorage());

describe('SaveCustomPuzzleUseCase', () => {
  it('сохраняет custom puzzle через репозиторий', () => {
    const repo = makeRepo();
    const uc = new SaveCustomPuzzleUseCase(repo);
    const saved = uc.execute(CUSTOM_DATA);
    expect(saved.id).toBe('cust-x');
    expect(repo.get('cust-x')).not.toBeNull();
  });

  it('повторное сохранение перезаписывает запись', () => {
    const repo = makeRepo();
    const uc = new SaveCustomPuzzleUseCase(repo);
    uc.execute(CUSTOM_DATA);
    uc.execute({ ...CUSTOM_DATA, elo: 1500 });
    expect(repo.get('cust-x')?.elo).toBe(1500);
  });
});

describe('DeleteCustomPuzzleUseCase', () => {
  it('удаляет существующую запись', () => {
    const repo = makeRepo();
    new SaveCustomPuzzleUseCase(repo).execute(CUSTOM_DATA);
    new DeleteCustomPuzzleUseCase(repo).execute('cust-x');
    expect(repo.get('cust-x')).toBeNull();
  });

  it('удаление отсутствующей записи не бросает', () => {
    const repo = makeRepo();
    expect(() => { new DeleteCustomPuzzleUseCase(repo).execute('nope'); }).not.toThrow();
  });
});
