export const OPENINGS_START_FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/** ECO для начальной позиции (никто ещё не сыграл). */
export const OPENINGS_START_ECO = 'A00';

/** i18n-префикс ключей с именами дебютов. */
export const OPENING_NAME_PREFIX = 'openingNames.';

/** Ключ localStorage для сохранённого репертуара. */
export const OPENINGS_REPERTOIRE_KEY = 'chess.openings.repertoire';

/** Размер страницы каталога дебютов. */
export const OPENINGS_CATALOG_PAGE_SIZE = 20;

/**
 * Сколько строк каталога рендерится в модалке за раз. Полный каталог ~3.7к строк;
 * рендерить все — лагает, поэтому ограничиваем и предлагаем сузить поиск или ECO-группу.
 */
export const OPENINGS_CATALOG_MAX_VISIBLE = 200;

/** Способ сортировки списка кандидатов. */
export const OPENINGS_SORTS = {
  popular: 'popular',
  winrate: 'winrate',
  rating: 'rating',
} as const;
export type OpeningsSort = (typeof OPENINGS_SORTS)[keyof typeof OPENINGS_SORTS];

export interface OpeningsSortOption {
  readonly value: OpeningsSort;
  readonly labelKey: string;
}

export const OPENINGS_SORT_OPTIONS: readonly OpeningsSortOption[] = [
  { value: OPENINGS_SORTS.popular, labelKey: 'openings.sortPopular' },
  { value: OPENINGS_SORTS.winrate, labelKey: 'openings.sortWinrate' },
  { value: OPENINGS_SORTS.rating, labelKey: 'openings.sortRating' },
];

/** Шаг слайдера «минимум партий». */
export const OPENINGS_MIN_GAMES_STEP = 1000;
export const OPENINGS_MIN_GAMES_DEFAULT = 0;
/** Жёсткая верхняя граница слайдера «минимум партий». */
export const OPENINGS_MIN_GAMES_MAX = 100_000;

/** Верхнеуровневые ECO-группы для bucket-ов каталога. */
export const OPENINGS_ECO_GROUPS = ['A', 'B', 'C', 'D', 'E'] as const;
export type OpeningsEcoGroup = (typeof OPENINGS_ECO_GROUPS)[number];

/** Sentinel-значение для фильтра «все группы». */
export const OPENINGS_ECO_GROUP_ALL = 'all';
export type OpeningsCatalogFilter =
  | OpeningsEcoGroup
  | typeof OPENINGS_ECO_GROUP_ALL;
