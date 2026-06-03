import type { BookMove, OpeningSource } from '@modules/game/application';
import { toTheoryMoves } from '@modules/game/application';
import { openingExplorerMaster } from 'equine';

// equine по умолчанию ходит на https://lichess.org; opening explorer живёт на
// отдельном хосте, поэтому переопределяем baseUrl per request.
const EXPLORER_BASE_URL = 'https://explorer.lichess.org';
// Берём широкую выборку, чтобы theory-filter мог обрезать редкий хвост.
const DEFAULT_MOVE_COUNT = 30;
const DEFAULT_TIMEOUT_MS = 1500;

/** Ошибка, помечающая 401 от Lichess — токен мёртв, надо его сбросить. */
export class LichessUnauthorizedError extends Error {
  constructor() {
    super('Lichess explorer returned 401 — token invalid or expired');
    this.name = 'LichessUnauthorizedError';
  }
}

/** Источник, отдающий токен per-request. Возвращает `null`, если токена нет. */
export type LichessTokenProvider = () => string | null;

/**
 * Live-источник дебютов через Lichess masters explorer.
 *
 * Lichess закрыл explorer для анонимных запросов: без Bearer-токена endpoint
 * отвечает 401. Поэтому источник принимает `tokenProvider`, который
 * композиционный корень связывает с `useLichessAuthStore`. Если токена нет —
 * сразу пробрасываем `LichessUnauthorizedError`, чтобы вызывающий код мог
 * корректно fallback'нуться на локальную книгу без сетевого хода.
 *
 * Кеш живёт по ключу "первые 4 поля FEN" — достаточно для разделения позиций
 * с разной очерёдностью хода / прав рокировки.
 */
export class LichessOpeningSource implements OpeningSource {
  private readonly cache = new Map<string, readonly BookMove[]>();

  constructor(
    private readonly tokenProvider: LichessTokenProvider,
    private readonly timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ) {}

  async movesAt(fen: string): Promise<readonly BookMove[]> {
    const key = fen.split(' ').slice(0, 4).join(' ');
    const cached = this.cache.get(key);
    if (cached) return cached;

    const token = this.tokenProvider();
    if (!token) throw new LichessUnauthorizedError();

    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);

    try {
      const res = await openingExplorerMaster({
        baseUrl: EXPLORER_BASE_URL,
        query: { fen, moves: DEFAULT_MOVE_COUNT, topGames: 0 },
        signal: controller.signal,
        headers: { Authorization: `Bearer ${token}` },
      });

      // equine возвращает { data, response, error } — 401 уходит в response.status,
      // а data остаётся undefined. Проверяем явно.
      if (res.response.status === 401) throw new LichessUnauthorizedError();

      const result = toTheoryMoves(res.data?.moves ?? []);
      this.cache.set(key, result);
      return result;
    } finally {
      clearTimeout(timer);
    }
  }
}
