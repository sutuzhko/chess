import {
  OPENINGS_SORTS,
  type OpeningsSort,
} from '@app/features/openings/config/openings-constants.js';
import type { BookMove } from '@modules/game/application';

/** Кандидат-ход для explorer-UI: флаг теории + куда транспонирует + частота. */
export type ExplorerRow = BookMove & {
  readonly main: boolean;
  /** ECO дебюта, в который ход ведёт (если у позиции есть имя). */
  readonly eco?: string;
  /** i18n-ключ имени дебюта (переводится на стороне вызова). */
  readonly nameKey?: string;
  /** FEN позиции после хода — используется для совпадения с репертуаром. */
  readonly afterFen?: string;
  /** Доля партий в текущей позиции, сыгранных этим ходом (0..100). */
  readonly freqPct: number;
};

/** Суммарный исход по всем кандидатам в позиции. */
export interface PositionSummary {
  /** Доля побед белых (0..100). */
  readonly white: number;
  /** Доля ничьих (0..100). */
  readonly draw: number;
  /** Доля побед чёрных (0..100). */
  readonly black: number;
  /** Всего партий в агрегате. */
  readonly games: number;
  /** Средний рейтинг, взвешенный по партиям; null если неизвестен. */
  readonly avgRating: number | null;
}

/** Сворачивает W/D/L кандидатов в один позиционный исход, взвешивая по количеству партий. */
export function aggregateSummary(
  rows: readonly ExplorerRow[],
): PositionSummary | null {
  let games = 0;
  let whiteAcc = 0;
  let drawAcc = 0;
  let ratingAcc = 0;
  let ratedGames = 0;
  for (const row of rows) {
    const g = row.games ?? 0;
    if (g <= 0 || !row.wdl) continue;
    games += g;
    whiteAcc += row.wdl[0] * g;
    drawAcc += row.wdl[1] * g;
    if (row.rating) {
      ratingAcc += row.rating * g;
      ratedGames += g;
    }
  }
  if (games <= 0) return null;
  const white = Math.round(whiteAcc / games);
  const draw = Math.round(drawAcc / games);
  return {
    white,
    draw,
    black: 100 - white - draw,
    games,
    avgRating: ratedGames > 0 ? Math.round(ratingAcc / ratedGames) : null,
  };
}

function winShare(row: ExplorerRow, side: 'white' | 'black'): number {
  if (!row.wdl) return -1;
  return side === 'white' ? row.wdl[0] : row.wdl[2];
}

/** Сортирует кандидатов по популярности или по доле побед стороны хода. Не мутирует вход. */
export function sortRows(
  rows: readonly ExplorerRow[],
  sort: OpeningsSort,
  side: 'white' | 'black',
): ExplorerRow[] {
  const arr = [...rows];
  if (sort === OPENINGS_SORTS.winrate) {
    return arr.sort((a, b) => winShare(b, side) - winShare(a, side));
  }
  if (sort === OPENINGS_SORTS.rating) {
    return arr.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }
  return arr.sort((a, b) => (b.games ?? 0) - (a.games ?? 0));
}
