import type { BookMove } from '@modules/game/application/opening-book.js';

/**
 * Port for opening data. Implementations may be a live online database
 * (Lichess explorer), a curated local book, or a composite with fallback.
 * Returns the theoretical continuations from a position, each carrying
 * optional W/D/L statistics.
 */
export interface OpeningSource {
  movesAt(fen: string): Promise<readonly BookMove[]>;
}
