/**
 * Композиционный wrapper над OpeningSource, который per-request решает:
 *  - если `settings.useLichessExplorer === true` И валиден токен → Lichess,
 *    с фолбэком на локальную книгу при любой ошибке (сеть/таймаут/пустой
 * ответ);
 *  - иначе → сразу локальная книга.
 *
 * Зачем нужен этот слой: engine (worker) и shvedki-ai usecase получают
 * единственный неизменяемый `OpeningSource` при инициализации. Чтобы свитч в
 * Settings влиял на запросы без перезагрузки приложения, источник прячет
 * выбор за интерфейсом — внутри он читает Pinia-сторы каждый вызов.
 *
 * Также здесь живёт side-effect: если Lichess вернул 401 — стор авторизации
 * получает `invalidate()`, и UI сразу показывает "сессия истекла".
 */

import type { useLichessAuthStore } from '@app/stores/lichess-auth.js';
import type { useSettingsStore } from '@app/stores/settings.js';
import type { BookMove, OpeningSource } from '@modules/game/application';
import {
  LichessOpeningSource,
  LichessUnauthorizedError,
} from '@modules/game/infrastructure/opening/LichessOpeningSource.js';
import type {
  LocalOpeningSource,
} from '@modules/game/infrastructure/opening/LocalOpeningSource.js';

type SettingsStore = ReturnType<typeof useSettingsStore>;
type LichessAuthStore = ReturnType<typeof useLichessAuthStore>;

export interface DynamicOpeningSourceDeps {
  readonly settings: SettingsStore;
  readonly lichessAuth: LichessAuthStore;
  readonly local: LocalOpeningSource;
}

export class DynamicOpeningSource implements OpeningSource {
  private readonly lichess: LichessOpeningSource;

  constructor(private readonly deps: DynamicOpeningSourceDeps) {
    this.lichess = new LichessOpeningSource(() => this.deps.lichessAuth.token);
  }

  async movesAt(fen: string): Promise<readonly BookMove[]> {
    const useLichess
      = this.deps.settings.useLichessExplorer
      && this.deps.lichessAuth.isAuthorized;

    if (!useLichess) {
      return this.deps.local.movesAt(fen);
    }

    try {
      const moves = await this.lichess.movesAt(fen);
      if (moves.length > 0) return moves;
      // Пустой ответ от Lichess — попробуем локальную книгу, может найдётся.
      return await this.deps.local.movesAt(fen);
    } catch (err) {
      if (err instanceof LichessUnauthorizedError) {
        // Токен мёртв — сбрасываем, чтобы UI показал "войти снова".
        this.deps.lichessAuth.invalidate();
      }
      // Любая ошибка — тихий fallback на локальную книгу.
      return await this.deps.local.movesAt(fen);
    }
  }
}
