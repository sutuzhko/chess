import {
  HOME_STORAGE_KEYS,
} from '@app/features/home/config/home-storage-keys.js';
import { HOME_CONSTANTS } from '@app/features/home/config/home.constants.js';
import { computed, type ComputedRef, ref } from 'vue';

const STATS_KEY = HOME_STORAGE_KEYS.stats;
const { defaultRating: DEFAULT_RATING, ratingDeltaPerSolve: RATING_DELTA,
  deltaWindowDays: DELTA_WINDOW_DAYS, midnightBufferSeconds: MIDNIGHT_BUFFER_S } = HOME_CONSTANTS;

interface StatsData {
  version: 1;
  solved: number;
  rating: number;
  streak: number;
  lastSolveDate: string | null;
  /** Дата начала текущего недельного окна (YYYY-MM-DD). */
  weekStartDate: string | null;
  /** Снимок `solved` на момент `weekStartDate`. */
  weekStartSolved: number;
  /** Снимок `rating` на момент `weekStartDate`. */
  weekStartRating: number;
}

const DEFAULT_STATS: StatsData = {
  version: 1,
  solved: 0,
  rating: DEFAULT_RATING,
  streak: 0,
  lastSolveDate: null,
  weekStartDate: null,
  weekStartSolved: 0,
  weekStartRating: DEFAULT_RATING,
};

function localDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${String(y)}-${m}-${day}`;
}

function shiftDateString(iso: string, deltaDays: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  dt.setDate(dt.getDate() + deltaDays);
  return localDateString(dt);
}

function daysBetween(fromIso: string, toIso: string): number {
  const [y1, m1, d1] = fromIso.split('-').map(Number);
  const [y2, m2, d2] = toIso.split('-').map(Number);
  const a = new Date(y1 ?? 1970, (m1 ?? 1) - 1, d1 ?? 1).getTime();
  const b = new Date(y2 ?? 1970, (m2 ?? 1) - 1, d2 ?? 1).getTime();
  return Math.round((b - a) / 86_400_000);
}

function readStats(): StatsData {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { ...DEFAULT_STATS };
    const data = JSON.parse(raw) as Partial<StatsData>;
    return {
      version: 1,
      solved: typeof data.solved === 'number' ? data.solved : 0,
      rating: typeof data.rating === 'number' ? data.rating : DEFAULT_RATING,
      streak: typeof data.streak === 'number' ? data.streak : 0,
      lastSolveDate: typeof data.lastSolveDate === 'string' ? data.lastSolveDate : null,
      weekStartDate: typeof data.weekStartDate === 'string' ? data.weekStartDate : null,
      weekStartSolved: typeof data.weekStartSolved === 'number' ? data.weekStartSolved : 0,
      weekStartRating: typeof data.weekStartRating === 'number' ? data.weekStartRating : DEFAULT_RATING,
    };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

function writeStats(s: StatsData): void {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch { /* quota */ }
}

const statsRef = ref<StatsData>(readStats());

function applyStreakDecay(): void {
  const s = statsRef.value;
  if (s.streak === 0) return;
  const today = localDateString();
  if (s.lastSolveDate === null) {
    statsRef.value = { ...s, streak: 0 };
    writeStats(statsRef.value);
    return;
  }
  const yesterday = shiftDateString(today, -1);
  if (s.lastSolveDate !== today && s.lastSolveDate !== yesterday) {
    statsRef.value = { ...s, streak: 0 };
    writeStats(statsRef.value);
  }
}

/** Если недельное окно ещё не задано или старше N дней — сбрасываем baseline на сегодняшние значения. */
function refreshWeeklyBaseline(): void {
  const s = statsRef.value;
  const today = localDateString();
  const needsReset = s.weekStartDate === null
    || daysBetween(s.weekStartDate, today) >= DELTA_WINDOW_DAYS;
  if (!needsReset) return;
  const next: StatsData = {
    ...s,
    weekStartDate: today,
    weekStartSolved: s.solved,
    weekStartRating: s.rating,
  };
  statsRef.value = next;
  writeStats(next);
}

let midnightArmed = false;
function armMidnightCheck(): void {
  if (midnightArmed) return;
  midnightArmed = true;
  const schedule = (): void => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, MIDNIGHT_BUFFER_S, 0);
    const ms = Math.max(1000, next.getTime() - now.getTime());
    window.setTimeout(() => {
      applyStreakDecay();
      refreshWeeklyBaseline();
      schedule();
    }, ms);
  };
  schedule();
}

window.addEventListener('storage', (e) => {
  if (e.key === STATS_KEY) statsRef.value = readStats();
});

export function recordPuzzleSolved(): void {
  const today = localDateString();
  const prev = statsRef.value;
  const next: StatsData = {
    ...prev,
    solved: prev.solved + 1,
    rating: prev.rating + RATING_DELTA,
  };
  if (prev.lastSolveDate !== today) {
    const yesterday = shiftDateString(today, -1);
    next.streak = prev.lastSolveDate === yesterday ? prev.streak + 1 : 1;
    next.lastSolveDate = today;
  }
  if (next.weekStartDate === null) {
    next.weekStartDate = today;
    next.weekStartSolved = prev.solved;
    next.weekStartRating = prev.rating;
  }
  statsRef.value = next;
  writeStats(next);
}

export interface UsePuzzleStats {
  solved: ComputedRef<number>;
  rating: ComputedRef<number>;
  streak: ComputedRef<number>;
  solvedDelta: ComputedRef<number>;
  ratingDelta: ComputedRef<number>;
}

export function usePuzzleStats(): UsePuzzleStats {
  applyStreakDecay();
  refreshWeeklyBaseline();
  armMidnightCheck();
  return {
    solved: computed(() => statsRef.value.solved),
    rating: computed(() => statsRef.value.rating),
    streak: computed(() => statsRef.value.streak),
    solvedDelta: computed(() => statsRef.value.solved - statsRef.value.weekStartSolved),
    ratingDelta: computed(() => statsRef.value.rating - statsRef.value.weekStartRating),
  };
}
