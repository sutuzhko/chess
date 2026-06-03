import type { BookMove } from './opening-book.js';

export type Rng = () => number;

export type SideToMove = 'white' | 'black';

// Усиление перед взвешенным выбором. W/D/L дебютов кучкуется у 50%; возведение в степень
// разносит веса достаточно, чтобы AI предпочитал сильную теорию, оставляя вариативность.
const WEIGHT_EXPONENT = 6;

/** Нейтральная оценка ожидаемого исхода для ходов без W/D/L. */
const NEUTRAL_SCORE = 0.5;

function expectedScore(
  wdl: readonly [number, number, number],
  side: SideToMove,
): number {
  const [white, draw, black] = wdl;
  const total = white + draw + black;
  if (total <= 0) return NEUTRAL_SCORE;
  const win = side === 'white' ? white : black;
  return (win + draw / 2) / total;
}

/** Достаёт сторону хода из FEN. */
export function sideToMoveFromFen(fen: string): SideToMove {
  return fen.split(' ')[1] === 'b' ? 'black' : 'white';
}

/**
 * Взвешенный выбор хода из книги по ожидаемому исходу для стороны хода.
 * Сильная теория играется чаще, слабые ходы остаются возможны (не детерминизм).
 * `rng` подменяется в тестах.
 */
export function pickWeighted(
  moves: readonly BookMove[],
  side: SideToMove,
  rng: Rng = Math.random,
): string | null {
  if (moves.length === 0) return null;

  const weights = moves.map((m) =>
    Math.pow(m.wdl ? expectedScore(m.wdl, side) : NEUTRAL_SCORE, WEIGHT_EXPONENT),
  );
  const total = weights.reduce((sum, w) => sum + w, 0);

  if (total <= 0) {
    return moves[Math.floor(rng() * moves.length)]?.uci ?? null;
  }

  let threshold = rng() * total;
  for (let i = 0; i < moves.length; i++) {
    threshold -= weights[i] ?? 0;
    if (threshold < 0) return moves[i]?.uci ?? null;
  }
  return moves[moves.length - 1]?.uci ?? null;
}
