import type {
  AccentName,
  BoardName,
  DensityName,
  LangName,
  PieceSetName,
  ThemeName,
} from '@shared/config/settings-constants.js';
import {
  ACCENT,
  BOARD,
  DENSITY,
  LANG,
  PIECE_SET,
  THEME,
} from '@shared/config/settings-constants.js';
import { debounce } from '@shared/lib/debounce.js';
import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export type { AccentName, BoardName, DensityName, LangName, PieceSetName, ThemeName };

/** Сторона, за которую играет ИИ. `off` — играют двое за доской. */
export type AiSide = 'off' | 'white' | 'black';

export interface GameplaySettings {
  coordinates: boolean;
  highlightLastMove: boolean;
  hints: boolean;
  animations: boolean;
  sound: boolean;
}

export interface UIVisibility {
  playerCards: boolean;
  clocks: boolean;
  captured: boolean;
  moveList: boolean;
  matchSetup: boolean;
  evalBar: boolean;
  fen: boolean;
  coordinates: boolean;
  devOverlay: boolean;
}

export interface ShvedkiUIVisibility {
  playerCards: boolean;
  clocks: boolean;
  partnerBoard: boolean;
  reserve: boolean;
  moveList: boolean;
  matchSetup: boolean;
  fen: boolean;
}

interface SettingsSnapshot {
  theme: ThemeName;
  accent: AccentName;
  board: BoardName;
  pieceSet: PieceSetName;
  density: DensityName;
  lang: LangName;
  gameplay: GameplaySettings;
  standardUI: UIVisibility;
  shvedkiUI: ShvedkiUIVisibility;
  aiSide: AiSide;
  aiLevel: number;
  /**
   * Использовать Lichess Opening Explorer как дополнительный источник дебютов.
   * Сам по себе свитч не делает запросов — нужен ещё валидный токен из
   * `useLichessAuthStore`. Если что-то из двух выключено — отдаём локальную
   * прекомпьют-книгу.
   */
  useLichessExplorer: boolean;
}

const STORAGE_KEY = 'app.settings';
const PERSIST_DEBOUNCE_MS = 100;

const DEFAULT_STANDARD_UI: UIVisibility = {
  playerCards: true, clocks: true, captured: true, moveList: true,
  matchSetup: true, evalBar: true, fen: true, coordinates: true, devOverlay: false,
};

const DEFAULT_SHVEDKI_UI: ShvedkiUIVisibility = {
  playerCards: true, clocks: true, partnerBoard: true,
  reserve: true, moveList: true, matchSetup: true, fen: false,
};

const DEFAULT_GAMEPLAY: GameplaySettings = {
  coordinates: true,
  highlightLastMove: true,
  hints: true,
  animations: true,
  sound: false,
};

const VALID_THEMES = new Set<string>(Object.values(THEME));
const VALID_DENSITIES = new Set<string>(Object.values(DENSITY));

function loadSnapshot(): Partial<SettingsSnapshot> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const snap = JSON.parse(raw) as Partial<SettingsSnapshot>;
    // Отбрасываем legacy-значения тем и плотности, оставшиеся от старых сборок (sepia/high-contrast/cozy/comfortable).
    if (snap.theme && !VALID_THEMES.has(snap.theme)) delete snap.theme;
    if (snap.density && !VALID_DENSITIES.has(snap.density)) delete snap.density;
    return snap;
  } catch {
    return {};
  }
}

function persistSnapshot(snap: SettingsSnapshot): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
  } catch { /* quota / disabled storage — silent */ }
}

export const useSettingsStore = defineStore('settings', () => {
  const initial = loadSnapshot();

  const theme = ref<ThemeName>(initial.theme ?? THEME.LIGHT);
  const accent = ref<AccentName>(initial.accent ?? ACCENT.GREEN);
  const board = ref<BoardName>(initial.board ?? BOARD.WOOD);
  const pieceSet = ref<PieceSetName>(initial.pieceSet ?? PIECE_SET.CLASSIC);
  const density = ref<DensityName>(initial.density ?? DENSITY.NORMAL);
  const lang = ref<LangName>(initial.lang ?? LANG.RU);
  const gameplay = ref<GameplaySettings>({ ...DEFAULT_GAMEPLAY, ...(initial.gameplay ?? {}) });

  const standardUI = ref<UIVisibility>({ ...DEFAULT_STANDARD_UI, ...(initial.standardUI ?? {}) });
  const shvedkiUI = ref<ShvedkiUIVisibility>({ ...DEFAULT_SHVEDKI_UI, ...(initial.shvedkiUI ?? {}) });

  const aiSide = ref<AiSide>(initial.aiSide ?? 'black');
  const aiLevel = ref<number>(initial.aiLevel ?? 4);
  const useLichessExplorer = ref<boolean>(initial.useLichessExplorer ?? false);

  function applyTheme(v: ThemeName): void { document.documentElement.dataset.theme = v; }
  function applyAccent(v: AccentName): void { document.documentElement.dataset.accent = v; }
  function applyBoard(v: BoardName): void { document.documentElement.dataset.board = v; }
  function applyDensity(v: DensityName): void { document.documentElement.dataset.density = v; }
  function applyPieceSet(v: PieceSetName): void { document.documentElement.dataset.pieceSet = v; }

  applyTheme(theme.value);
  applyAccent(accent.value);
  applyBoard(board.value);
  applyDensity(density.value);
  applyPieceSet(pieceSet.value);

  watch(theme, applyTheme);
  watch(accent, applyAccent);
  watch(board, applyBoard);
  watch(density, applyDensity);
  watch(pieceSet, applyPieceSet);

  const snapshot = (): SettingsSnapshot => ({
    theme: theme.value, accent: accent.value, board: board.value,
    pieceSet: pieceSet.value, density: density.value, lang: lang.value,
    gameplay: { ...gameplay.value },
    standardUI: { ...standardUI.value },
    shvedkiUI: { ...shvedkiUI.value },
    aiSide: aiSide.value, aiLevel: aiLevel.value,
    useLichessExplorer: useLichessExplorer.value,
  });

  const persist = debounce(() => { persistSnapshot(snapshot()); }, PERSIST_DEBOUNCE_MS);

  watch(
    [theme, accent, board, pieceSet, density, lang, gameplay, standardUI, shvedkiUI, aiSide, aiLevel, useLichessExplorer],
    persist,
    { deep: true },
  );

  return {
    theme, accent, board, pieceSet, density, lang,
    gameplay,
    standardUI, shvedkiUI,
    aiSide, aiLevel,
    useLichessExplorer,
  };
});
