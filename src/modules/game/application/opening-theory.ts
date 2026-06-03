import type { BookMove } from './opening-book.js';

/** Сырой ход explorer-я с раздельными счётчиками белые/ничьи/чёрные. */
export interface RawMasterMove {
  readonly uci: string;
  readonly san: string;
  readonly white: number;
  readonly draws: number;
  readonly black: number;
  readonly averageRating?: number;
}

export interface TheoryFilterOptions {
  /** Минимальное число партий: ходы реже отбрасываются. */
  readonly minGames: number;
  /** Минимальная доля от всех партий в позиции (0..1). */
  readonly minShare: number;
  /** Максимум сохраняемых ходов. */
  readonly topN: number;
}

// Master-партии содержат длинный хвост редких ходов (сыграны 1–2 раза), где W/D/L вырождается
// в 0/100% от одного примера. В теоретическом виде это шум — отрезаем дефолтами до канонических линий.
export const DEFAULT_THEORY_FILTER: TheoryFilterOptions = {
  minGames: 5,
  minShare: 0.001,
  topN: 16,
};

function toWdl(
  white: number,
  draws: number,
  black: number,
): readonly [number, number, number] | undefined {
  const total = white + draws + black;
  if (total <= 0) return undefined;
  const w = Math.round((white / total) * 100);
  const d = Math.round((draws / total) * 100);
  // Третье значение выводим вычитанием, чтобы сумма всегда строго равнялась 100.
  return [w, d, 100 - w - d];
}

// Lichess отдаёт castling-UCI в стиле Chess960 (king-to-rook): e1h1 / e1a1 / e8h8 / e8a8.
// Наш домен ждёт обычный king-to-target (e1g1 и т.п.), иначе применить ход нельзя.
function normalizeCastlingUci(uci: string, san: string): string {
  if (san === 'O-O') {
    if (uci === 'e1h1') return 'e1g1';
    if (uci === 'e8h8') return 'e8g8';
  } else if (san === 'O-O-O') {
    if (uci === 'e1a1') return 'e1c1';
    if (uci === 'e8a8') return 'e8c8';
  }
  return uci;
}

/**
 * Сводит сырые master-ходы к теоретическим продолжениям: отрезает хвост низких
 * выборок, сортирует по популярности, ограничивает
 * {@link TheoryFilterOptions.topN} и переводит в {@link BookMove}.
 */
export function toTheoryMoves(
  raw: readonly RawMasterMove[],
  opts: TheoryFilterOptions = DEFAULT_THEORY_FILTER,
): BookMove[] {
  const withCounts = raw.map((m) => ({ move: m, games: m.white + m.draws + m.black }));
  const total = withCounts.reduce((sum, { games }) => sum + games, 0);
  if (total <= 0) return [];

  return withCounts
    .filter(({ games }) => games >= opts.minGames && games / total >= opts.minShare)
    .sort((a, b) => b.games - a.games)
    .slice(0, opts.topN)
    .map(({ move, games }) => {
      const wdl = toWdl(move.white, move.draws, move.black);
      const rating = move.averageRating;
      return {
        uci: normalizeCastlingUci(move.uci, move.san),
        san: move.san,
        games,
        ...(wdl ? { wdl } : {}),
        ...(rating ? { rating } : {}),
      };
    });
}
