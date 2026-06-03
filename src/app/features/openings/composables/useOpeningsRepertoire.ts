import {
  OPENINGS_REPERTOIRE_KEY,
} from '@app/features/openings/config/openings-constants.js';
import { computed, type ComputedRef, ref } from 'vue';

/** Позиция в пользовательском репертуаре, идентифицируется FEN. */
export interface RepertoireEntry {
  /** FEN — идентичность записи. */
  readonly fen: string;
  /** i18n-ключ имени дебюта или null. */
  readonly name: string | null;
  /** ECO в позиции, либо ''. */
  readonly eco: string;
  /** SAN-линия от старта, восстановимая через opening book. */
  readonly moves: string;
  /** ISO-метка добавления. */
  readonly addedAt: string;
}

export interface UseOpeningsRepertoire {
  readonly entries: ComputedRef<readonly RepertoireEntry[]>;
  readonly has: (fen: string) => boolean;
  /** Добавляет запись, если её FEN отсутствует; иначе удаляет. */
  readonly toggle: (entry: Omit<RepertoireEntry, 'addedAt'>) => void;
  readonly remove: (fen: string) => void;
}

function load(): RepertoireEntry[] {
  try {
    const raw = localStorage.getItem(OPENINGS_REPERTOIRE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as unknown;
    return Array.isArray(data) ? (data as RepertoireEntry[]) : [];
  } catch {
    return [];
  }
}

function persist(list: readonly RepertoireEntry[]): void {
  try {
    localStorage.setItem(OPENINGS_REPERTOIRE_KEY, JSON.stringify(list));
  } catch {
    /* storage переполнен или недоступен — игнорируем */
  }
}

export function useOpeningsRepertoire(): UseOpeningsRepertoire {
  const list = ref<RepertoireEntry[]>(load());

  const entries = computed<readonly RepertoireEntry[]>(() => list.value);

  function has(fen: string): boolean {
    return list.value.some((e) => e.fen === fen);
  }

  function remove(fen: string): void {
    list.value = list.value.filter((e) => e.fen !== fen);
    persist(list.value);
  }

  function toggle(entry: Omit<RepertoireEntry, 'addedAt'>): void {
    if (has(entry.fen)) {
      remove(entry.fen);
      return;
    }
    list.value = [{ ...entry, addedAt: new Date().toISOString() }, ...list.value];
    persist(list.value);
  }

  return { entries, has, toggle, remove };
}
