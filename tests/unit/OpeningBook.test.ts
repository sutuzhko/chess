import {
  OpeningBook,
  type OpeningDef,
  type PrecomputedBook,
} from '@/modules/game/application/opening-book';
import { BoardSnapshot, INITIAL_FEN } from '@/modules/game/domain/game';
import { describe, expect, it } from 'vitest';

const ITALIAN: OpeningDef = {
  eco: 'C50',
  name: 'Italian Game',
  moves: 'e4 e5 Nf3 Nc6 Bc4',
};

const RUY: OpeningDef = {
  name: 'Ruy Lopez',
  moves: 'e4 e5 Nf3 Nc6 Bb5',
};

const WITH_VARIATIONS: OpeningDef = {
  name: 'Queen Pawn',
  moves: 'd4 d5',
  variations: ['d4 Nf6'],
};

const FEN_AFTER_E4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';

describe('OpeningBook', () => {
  it('movesAt возвращает curated ход для стартовой позиции', () => {
    const book = new OpeningBook([ITALIAN]);
    const moves = book.movesAt(INITIAL_FEN);
    expect(moves.length).toBeGreaterThan(0);
    expect(moves[0]?.uci).toBe('e2e4');
    expect(moves[0]?.san).toBe('e4');
  });

  it('movesAt возвращает [] для позиции вне книги', () => {
    const book = new OpeningBook([ITALIAN]);
    expect(book.movesAt('8/8/8/4k3/8/8/4K3/8 w - - 0 1')).toEqual([]);
  });

  it('nameAt возвращает имя для терминальной позиции линии', () => {
    const book = new OpeningBook([ITALIAN]);
    const steps = book.resolveLine(ITALIAN.moves);
    const finalFen = steps[steps.length - 1]?.fen ?? '';
    expect(book.nameAt(finalFen)).toBe('Italian Game');
  });

  it('nameAt возвращает пустую строку для неизвестной позиции', () => {
    const book = new OpeningBook([ITALIAN]);
    expect(book.nameAt(INITIAL_FEN)).toBe('');
  });

  it('две разные линии расходятся в общей точке', () => {
    const book = new OpeningBook([ITALIAN, RUY]);
    // После 1.e4 e5 2.Nf3 Nc6 — обе линии расходятся (Bc4 vs Bb5).
    const after4 = book.resolveLine('e4 e5 Nf3 Nc6');
    const branchFen = after4[after4.length - 1]?.fen ?? '';
    const moves = book.movesAt(branchFen);
    const ucis = moves.map((m) => m.uci).sort();
    expect(ucis).toContain('f1c4');
    expect(ucis).toContain('f1b5');
  });

  it('variations добавляются как самостоятельные ветки', () => {
    const book = new OpeningBook([WITH_VARIATIONS]);
    const after1 = book.resolveLine('d4');
    const moves = book.movesAt(after1[0]?.fen ?? '');
    const ucis = moves.map((m) => m.uci);
    expect(ucis).toContain('d7d5');
    expect(ucis).toContain('g8f6');
  });

  it('resolveLine возвращает LineStep для каждого SAN', () => {
    const book = new OpeningBook([]);
    const steps = book.resolveLine('e4 e5 Nf3');
    expect(steps).toHaveLength(3);
    expect(steps[0]?.san).toBe('e4');
    expect(steps[0]?.uci).toBe('e2e4');
    expect(steps[0]?.fen).toBe(FEN_AFTER_E4);
  });

  it('resolveLine прерывается на невалидном SAN', () => {
    const book = new OpeningBook([]);
    const steps = book.resolveLine('e4 zz9 Nf3');
    expect(steps).toHaveLength(1);
  });

  it('игнорирует линии с нелегальным SAN, не падая', () => {
    const def: OpeningDef = { name: 'Bogus', moves: 'e4 zzzz' };
    expect(() => new OpeningBook([def])).not.toThrow();
  });

  it('fromPrecomputed восстанавливает книгу без воспроизведения SAN', () => {
    const data: PrecomputedBook = {
      names: { [BoardSnapshot.initial().positionKey()]: 'Custom Start' },
      responses: {
        [BoardSnapshot.initial().positionKey()]: { 'e2e4': 'e4' },
      },
    };
    const book = OpeningBook.fromPrecomputed(data);
    expect(book.nameAt(INITIAL_FEN)).toBe('Custom Start');
    expect(book.movesAt(INITIAL_FEN)[0]?.uci).toBe('e2e4');
  });
});
