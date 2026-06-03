import {
  usePuzzleStats,
} from '@app/features/home/composables/usePuzzleStats.js';
import {
  HOME_STORAGE_KEYS,
} from '@app/features/home/config/home-storage-keys.js';
import { HOME_CONSTANTS } from '@app/features/home/config/home.constants.js';
import type {
  PuzzleSummary,
} from '@app/features/puzzles/composables/usePuzzleLibrary.js';
import {
  usePuzzleLibrary,
} from '@app/features/puzzles/composables/usePuzzleLibrary.js';
import {
  JsonMatchCodec,
  type SerializedMatch,
} from '@modules/game/infrastructure/persistence/JsonMatchCodec.js';
import type {
  ShvedkiGameResult,
} from '@modules/game/ui/canvas/shvedki/serialization.js';
import { computed, type ComputedRef } from 'vue';
import { useI18n } from 'vue-i18n';

const { matchPrefix: MATCH_KEY_PREFIX,
  matchConfigPrefix: MATCH_CONFIG_KEY_PREFIX,
  shvedkiPrefix: SHVEDKI_KEY_PREFIX } = HOME_STORAGE_KEYS;
const { recentLimit: RECENT_LIMIT, deltaWindowDays: DELTA_WINDOW_DAYS } = HOME_CONSTANTS;

export interface HomeStats {
  played: number;
  solved: number;
  rating: number;
  streak: number;
}

export interface HomeStatsDeltas {
  /** Кол-во партий, завершённых за последние `DELTA_WINDOW_DAYS` дней. */
  played: number;
  solved: number;
  rating: number;
}

export type RecentGameResult = 'win' | 'loss' | 'draw' | 'whiteWins' | 'blackWins';
export type RecentGameMode = 'standard' | 'shvedki' | 'opening_training';
export type OpponentKind = 'ai' | 'hotseat' | 'team';

export interface RecentGame {
  id: string;
  mode: RecentGameMode;
  savedAt: string | null;
  moves: number;
  result: RecentGameResult;
  opponent: { kind: OpponentKind; aiLevel?: number };
  /** Контроль времени `{initialSeconds, incrementSeconds}` либо null (неизвестно). */
  timeControl: { initialSeconds: number; incrementSeconds: number } | null;
}

interface SavedMatch {
  savedAt?: string;
  isFinished?: boolean;
  movesUci?: readonly string[];
}

interface SavedShvedki {
  phase?: { kind?: string; result?: ShvedkiGameResult };
  movesA?: readonly unknown[];
  movesB?: readonly unknown[];
}

interface SavedMatchConfig {
  mode?: RecentGameMode;
  opponent?: 'ai' | 'hotseat';
  side?: 'white' | 'black' | 'random';
  aiLevel?: number;
  initialSeconds?: number;
  incrementSeconds?: number;
}

function safeParse(raw: string | null): unknown {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function readMatchConfig(id: string): SavedMatchConfig | null {
  return safeParse(localStorage.getItem(MATCH_CONFIG_KEY_PREFIX + id)) as SavedMatchConfig | null;
}

function readShvedki(id: string): SavedShvedki | null {
  return safeParse(localStorage.getItem(SHVEDKI_KEY_PREFIX + id)) as SavedShvedki | null;
}

interface LastMatch { id: string; savedAt: string | null }

function winnerColor(raw: SavedMatch): 'white' | 'black' | null {
  try {
    const match = JsonMatchCodec.deserialize(raw as SerializedMatch);
    const s = match.status;
    if ('winner' in s) return s.winner;
    return null;
  } catch {
    return null;
  }
}

function deriveStandardResult(raw: SavedMatch | null, cfg: SavedMatchConfig | null): RecentGameResult {
  if (!raw) return 'draw';
  const w = winnerColor(raw);
  if (!w) return 'draw';
  if (cfg?.opponent === 'ai' && (cfg.side === 'white' || cfg.side === 'black')) {
    return w === cfg.side ? 'win' : 'loss';
  }
  return w === 'white' ? 'whiteWins' : 'blackWins';
}

function shvedkiResultFor(res: ShvedkiGameResult | undefined): RecentGameResult {
  if (res === 'team-1-wins') return 'win';
  if (res === 'team-2-wins') return 'loss';
  return 'draw';
}

interface ScannedMatchKey {
  id: string;
  rawMatch: SavedMatch | null;
  rawShvedki: SavedShvedki | null;
  cfg: SavedMatchConfig | null;
  time: number;
  savedAt: string | null;
  isFinished: boolean;
}

function scanMatchKeys(): ScannedMatchKey[] {
  const out: ScannedMatchKey[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(MATCH_KEY_PREFIX)) continue;
    if (key.startsWith(MATCH_CONFIG_KEY_PREFIX)) continue;
    const id = key.slice(MATCH_KEY_PREFIX.length);
    const rawMatch = safeParse(localStorage.getItem(key)) as SavedMatch | null;
    const rawShvedki = readShvedki(id);
    const cfg = readMatchConfig(id);
    const savedAt = rawMatch?.savedAt ?? null;
    const time = savedAt ? new Date(savedAt).getTime() : 0;
    const finishedStd = rawMatch?.isFinished === true;
    const finishedShv = rawShvedki?.phase?.kind === 'finished';
    const stdMoves = rawMatch?.movesUci?.length ?? 0;
    const shvMoves = (rawShvedki?.movesA?.length ?? 0) + (rawShvedki?.movesB?.length ?? 0);
    const hasMoves = stdMoves + shvMoves > 0;
    out.push({
      id, rawMatch, rawShvedki, cfg, time, savedAt,
      isFinished: (finishedStd || finishedShv) && hasMoves,
    });
  }
  return out;
}

function findLastUnfinishedMatch(scanned: ScannedMatchKey[]): LastMatch | null {
  let best: ScannedMatchKey | null = null;
  for (const m of scanned) {
    if (m.isFinished) continue;
    if (!best || m.time > best.time) best = m;
  }
  return best ? { id: best.id, savedAt: best.savedAt } : null;
}

function timeControlOf(cfg: SavedMatchConfig | null): RecentGame['timeControl'] {
  if (!cfg || typeof cfg.initialSeconds !== 'number' || typeof cfg.incrementSeconds !== 'number') {
    return null;
  }
  return { initialSeconds: cfg.initialSeconds, incrementSeconds: cfg.incrementSeconds };
}

function buildRecentGames(scanned: ScannedMatchKey[]): RecentGame[] {
  return scanned
    .filter((m) => m.isFinished)
    .sort((a, b) => b.time - a.time)
    .slice(0, RECENT_LIMIT)
    .map((m): RecentGame => {
      const isShvedki = m.cfg?.mode === 'shvedki' || m.rawShvedki !== null;
      const timeControl = timeControlOf(m.cfg);
      if (isShvedki) {
        const result = shvedkiResultFor(m.rawShvedki?.phase?.result);
        const moves = (m.rawShvedki?.movesA?.length ?? 0) + (m.rawShvedki?.movesB?.length ?? 0);
        return {
          id: m.id, mode: 'shvedki', savedAt: m.savedAt, moves, result,
          opponent: { kind: 'team' }, timeControl,
        };
      }
      const moves = m.rawMatch?.movesUci?.length ?? 0;
      const mode: 'standard' | 'opening_training' =
        m.cfg?.mode === 'opening_training' ? 'opening_training' : 'standard';
      const opponent: RecentGame['opponent'] = m.cfg?.opponent === 'hotseat'
        ? { kind: 'hotseat' }
        : typeof m.cfg?.aiLevel === 'number'
          ? { kind: 'ai', aiLevel: m.cfg.aiLevel }
          : { kind: 'ai' };
      return {
        id: m.id,
        mode,
        savedAt: m.savedAt,
        moves,
        result: deriveStandardResult(m.rawMatch ?? {}, m.cfg),
        opponent,
        timeControl,
      };
    });
}

function djb2(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${String(y)}-${m}-${day}`;
}

export interface UseHomeStats {
  hasLastGame: ComputedRef<boolean>;
  lastMatchId: ComputedRef<string | null>;
  resumeSub: ComputedRef<string>;
  stats: ComputedRef<HomeStats>;
  deltas: ComputedRef<HomeStatsDeltas>;
  recentGames: ComputedRef<RecentGame[]>;
  dailyPuzzle: ComputedRef<PuzzleSummary | null>;
}

export function useHomeStats(): UseHomeStats {
  const { t } = useI18n();
  const puzzleStats = usePuzzleStats();
  const library = usePuzzleLibrary();

  const scanned = computed<ScannedMatchKey[]>(() => scanMatchKeys());

  const lastMatch = computed<LastMatch | null>(() => findLastUnfinishedMatch(scanned.value));
  const hasLastGame = computed(() => lastMatch.value !== null);
  const lastMatchId = computed(() => lastMatch.value?.id ?? null);

  const resumeSub = computed(() => {
    const m = lastMatch.value;
    if (!m?.savedAt) return t('home.resume.autosave');
    const diff = Math.round((Date.now() - new Date(m.savedAt).getTime()) / 60000);
    if (diff < 1) return t('home.resume.justNow');
    if (diff < 60) return t('home.resume.minutesAgo', { n: diff });
    return t('home.resume.autosave');
  });

  const recentGames = computed<RecentGame[]>(() => buildRecentGames(scanned.value));

  const finishedMatches = computed(() => scanned.value.filter((m) => m.isFinished));

  const played = computed<number>(() => finishedMatches.value.length);

  const playedDelta = computed<number>(() => {
    const cutoff = Date.now() - DELTA_WINDOW_DAYS * 86_400_000;
    return finishedMatches.value.filter((m) => m.time >= cutoff).length;
  });

  const stats = computed<HomeStats>(() => ({
    played: played.value,
    solved: puzzleStats.solved.value,
    rating: puzzleStats.rating.value,
    streak: puzzleStats.streak.value,
  }));

  const deltas = computed<HomeStatsDeltas>(() => ({
    played: playedDelta.value,
    solved: puzzleStats.solvedDelta.value,
    rating: puzzleStats.ratingDelta.value,
  }));

  const dailyPuzzle = computed<PuzzleSummary | null>(() => {
    const list = library.bundledPuzzles.value;
    if (list.length === 0) return null;
    const idx = djb2(localDateKey()) % list.length;
    return list[idx] ?? null;
  });

  return { hasLastGame, lastMatchId, resumeSub, stats, deltas, recentGames, dailyPuzzle };
}
