import { Piece } from '@/modules/game/domain/game/value-objects/Piece';
import { describe, expect, it } from 'vitest';

describe('Piece', () => {
  it('round-trip символа', () => {
    for (const s of ['P', 'n', 'B', 'r', 'Q', 'k']) {
      expect(Piece.fromSymbol(s).symbol).toBe(s);
    }
  });

  it('кэширует идентичность по (цвет, тип)', () => {
    expect(Piece.of('white', 'queen')).toBe(Piece.of('white', 'queen'));
    expect(Piece.of('white', 'queen')).not.toBe(Piece.of('black', 'queen'));
  });

  it('отвергает невалидные символы', () => {
    expect(() => Piece.fromSymbol('X')).toThrow();
    expect(() => Piece.fromSymbol('pp')).toThrow();
  });
});
