import { getEloRange } from '@app/features/puzzles/config/puzzle-elo-ranges.js';
import {
  EMPTY_FILTERS,
  type PuzzleFilterState,
} from '@app/features/puzzles/types/puzzle-ui.types.js';
import type { PuzzleListFilter } from '@modules/game/application';
import {
  DeleteCustomPuzzleUseCase,
  ListPuzzlesUseCase,
  SaveCustomPuzzleUseCase,
} from '@modules/game/application';
import type {
  Puzzle,
  PuzzleData,
  PuzzleObjective,
} from '@modules/game/domain/puzzles';
import {
  LocalStoragePuzzleRepository,
} from '@modules/game/infrastructure/puzzles/LocalStoragePuzzleRepository.js';
import { computed, type ComputedRef, ref, type Ref } from 'vue';

export interface PuzzleSummary {
  id: string;
  fen: string;
  sideToMove: 'white' | 'black';
  themes: readonly string[];
  elo: number;
  source: 'bundled' | 'custom';
  title: string;
  description: string;
  objective: PuzzleObjective | null;
}

function summarize(p: Puzzle): PuzzleSummary {
  return {
    id: p.id,
    fen: p.fen,
    sideToMove: p.sideToMove,
    themes: p.themes,
    elo: p.elo,
    source: p.source,
    title: p.title ?? p.id,
    description: p.description ?? '',
    objective: p.objective ?? null,
  };
}

export interface UsePuzzleLibrary {
  filters: Ref<PuzzleFilterState>;
  source: Ref<'bundled' | 'custom' | 'all'>;
  bundledPuzzles: ComputedRef<PuzzleSummary[]>;
  customPuzzles: ComputedRef<PuzzleSummary[]>;
  filteredPuzzles: ComputedRef<PuzzleSummary[]>;
  resetFilters: () => void;
  saveCustom: (data: PuzzleData) => PuzzleSummary;
  deleteCustom: (id: string) => void;
  getCustom: (id: string) => PuzzleData | null;
  refresh: () => void;
}

export function usePuzzleLibrary(): UsePuzzleLibrary {
  const repo = new LocalStoragePuzzleRepository(window.localStorage);
  const list = new ListPuzzlesUseCase(repo);
  const save = new SaveCustomPuzzleUseCase(repo);
  const remove = new DeleteCustomPuzzleUseCase(repo);

  const filters = ref<PuzzleFilterState>({ ...EMPTY_FILTERS });
  const source = ref<'bundled' | 'custom' | 'all'>('all');
  const refreshTick = ref(0);

  function buildFilter(scope: 'bundled' | 'custom' | 'all'): PuzzleListFilter {
    const range = getEloRange(filters.value.elo);
    const query = filters.value.query.trim();
    return {
      themes: filters.value.themes,
      minElo: range.min,
      maxElo: range.max,
      source: scope,
      ...(query ? { query } : {}),
    };
  }

  const bundledPuzzles = computed<PuzzleSummary[]>(() => {
    void refreshTick.value;
    return list.execute({ source: 'bundled' }).map(summarize);
  });

  const customPuzzles = computed<PuzzleSummary[]>(() => {
    void refreshTick.value;
    return list.execute({ source: 'custom' }).map(summarize);
  });

  const filteredPuzzles = computed<PuzzleSummary[]>(() => {
    void refreshTick.value;
    return list.execute(buildFilter(source.value)).map(summarize);
  });

  return {
    filters,
    source,
    bundledPuzzles,
    customPuzzles,
    filteredPuzzles,
    resetFilters(): void {
      filters.value = { ...EMPTY_FILTERS };
    },
    saveCustom(data: PuzzleData): PuzzleSummary {
      const saved = save.execute(data);
      refreshTick.value++;
      return summarize(saved);
    },
    deleteCustom(id: string): void {
      remove.execute(id);
      refreshTick.value++;
    },
    getCustom(id: string): PuzzleData | null {
      void refreshTick.value;
      const found = repo.get(id);
      if (found?.source !== 'custom') return null;
      return found.toData();
    },
    refresh(): void { refreshTick.value++; },
  };
}
