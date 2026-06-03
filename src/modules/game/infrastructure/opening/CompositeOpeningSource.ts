import type { BookMove, OpeningSource } from '@modules/game/application';

/** Primary с фолбэком на secondary. Подробности — docs/codebase/openings.md */
export class CompositeOpeningSource implements OpeningSource {
  constructor(
    private readonly primary: OpeningSource,
    private readonly fallback: OpeningSource,
  ) {}

  async movesAt(fen: string): Promise<readonly BookMove[]> {
    try {
      const moves = await this.primary.movesAt(fen);
      if (moves.length > 0) return moves;
    } catch {
      // Сеть/таймаут/abort — проваливаемся на оффлайн-источник.
    }
    return this.fallback.movesAt(fen);
  }
}
