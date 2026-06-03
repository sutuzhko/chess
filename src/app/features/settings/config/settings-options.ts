/** Опции настроек. Причины disabled-флагов и связь с tokens.scss — docs/codebase/settings-options.md */
import type {
  AccentName,
  BoardName,
  DensityName,
  LangName,
  PieceSetName,
  ThemeName,
} from '@shared/config/settings-constants.js';

export const SETTINGS_TABS = [
  { id: 'appearance', i18nKey: 'appearance' },
  { id: 'gameplay',   i18nKey: 'gameplay'   },
  { id: 'ui',         i18nKey: 'ui'         },
  { id: 'data',       i18nKey: 'data'       },
  { id: 'lang',       i18nKey: 'language'   },
] as const;

export type SettingsTabId = typeof SETTINGS_TABS[number]['id'];

export const THEME_OPTIONS: { value: ThemeName; label: string }[] = [
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Тёмная' },
];

export const ACCENT_OPTIONS: { value: AccentName; label: string; color: string; fg: string }[] = [
  { value: 'silver', label: 'Серебро', color: '#8a91a0', fg: '#fff' },
  { value: 'gold',   label: 'Золото',  color: '#c9a44d', fg: '#fff' },
  { value: 'green',  label: 'Зелёный', color: '#42b883', fg: '#fff' },
  { value: 'blue',   label: 'Синий',   color: '#2f86c8', fg: '#fff' },
  { value: 'copper', label: 'Медь',    color: '#b06a3a', fg: '#fff' },
  { value: 'purple', label: 'Пурпур',  color: '#8b5cf6', fg: '#fff' },
];

export const BOARD_OPTIONS: { value: BoardName; label: string; light: string; dark: string }[] = [
  { value: 'wood',     label: 'Дерево',  light: '#f0d9b5', dark: '#b58863' },
  { value: 'green',    label: 'Зелёная', light: '#eeeed2', dark: '#769656' },
  { value: 'blue',     label: 'Синяя',   light: '#dee3e6', dark: '#8ca2ad' },
  { value: 'walnut',   label: 'Орех',    light: '#d2b48c', dark: '#6f4e37' },
  { value: 'mono',     label: 'Графит',  light: '#ededed', dark: '#707070' },
  { value: 'lavender', label: 'Лаванда', light: '#e6e0f0', dark: '#9b8bb7' },
  { value: 'purple',   label: 'Пурпур',  light: '#ddd3e8', dark: '#7f5fa3' },
  { value: 'ice',      label: 'Лёд',     light: '#e8f0f4', dark: '#7a98b0' },
];

export const PIECE_SET_OPTIONS: { value: PieceSetName; label: string; sample: string; disabled?: boolean }[] = [
  { value: 'classic', label: 'Классика', sample: '♞' },
  { value: 'modern', label: 'Модерн', sample: '♘', disabled: true },
  { value: 'minimal', label: 'Минимал', sample: 'N', disabled: true },
  { value: 'neon', label: 'Неон', sample: '♞', disabled: true },
];

export const DENSITY_OPTIONS: { value: DensityName; label: string; disabled?: boolean }[] = [
  { value: 'compact', label: 'Компактный', disabled: true },
  { value: 'normal',  label: 'Обычный' },
  { value: 'comfy',   label: 'Просторный', disabled: true },
];

export const LANG_OPTIONS: { value: LangName; label: string; flag: string; disabled?: boolean }[] = [
  { value: 'ru', label: 'Русский', flag: '🇷🇺' },
  { value: 'en', label: 'English', flag: '🇬🇧', disabled: true },
  { value: 'es', label: 'Español', flag: '🇪🇸', disabled: true },
];

export interface GameplayToggle {
  key: 'coordinates' | 'highlightLastMove' | 'hints' | 'animations' | 'sound';
  label: string;
  description: string;
  disabled?: boolean;
}

export const GAMEPLAY_TOGGLES: GameplayToggle[] = [
  { key: 'coordinates', label: 'Координаты', description: 'Буквы и цифры по краям доски' },
  { key: 'highlightLastMove', label: 'Подсветка хода', description: 'Выделять последний сделанный ход' },
  { key: 'hints', label: 'Подсказки', description: 'Показывать возможные ходы при выборе фигуры' },
  { key: 'animations', label: 'Анимации', description: 'Плавное движение фигур', disabled: true },
  { key: 'sound', label: 'Звук', description: 'Звуковые эффекты ходов' },
];

export interface UiVisibilityToggle {
  key: string;
  label: string;
  disabled?: boolean;
}

export const STANDARD_UI_TOGGLES: UiVisibilityToggle[] = [
  { key: 'playerCards', label: 'Карточки игроков' },
  { key: 'clocks', label: 'Часы', disabled: true },
  { key: 'captured', label: 'Съеденные фигуры' },
  { key: 'moveList', label: 'Список ходов' },
  { key: 'matchSetup', label: 'Настройки партии' },
  { key: 'evalBar', label: 'Шкала оценки' },
  { key: 'fen', label: 'FEN/PGN', disabled: true },
  { key: 'devOverlay', label: 'Dev-панель', disabled: true },
];

export const SHVEDKI_UI_TOGGLES: UiVisibilityToggle[] = [
  { key: 'playerCards', label: 'Карточки игроков' },
  { key: 'clocks', label: 'Часы', disabled: true },
  { key: 'partnerBoard', label: 'Доска партнёра' },
  { key: 'reserve', label: 'Резерв фигур' },
  { key: 'moveList', label: 'Список ходов' },
  { key: 'matchSetup', label: 'Настройки партии' },
  { key: 'fen', label: 'FEN', disabled: true },
];
