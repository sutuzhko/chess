import type {
  BookMove,
  OpeningBook,
  OpeningSource,
} from '@modules/game/application';

/** Оффлайн-источник дебютов поверх curated {@link OpeningBook}. */
export class LocalOpeningSource implements OpeningSource {
  constructor(private readonly book: OpeningBook) {}

  movesAt(fen: string): Promise<readonly BookMove[]> {
    return Promise.resolve(this.book.movesAt(fen));
  }
}
