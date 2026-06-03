import { Square } from '@/modules/game/domain/game/value-objects/Square';
import { describe, expect, it } from 'vitest';

describe('Square', () => {
  it('round-trip алгебраической нотации', () => {
    for (const s of ['a1', 'h8', 'e4', 'd5']) {
      expect(Square.fromAlgebraic(s).algebraic).toBe(s);
    }
  });

  it('кэширует инстансы по file/rank', () => {
    expect(Square.of(4, 3)).toBe(Square.of(4, 3));
    expect(Square.fromAlgebraic('e4')).toBe(Square.fromIndex(28));
  });

  it('отвергает координаты вне диапазона', () => {
    expect(() => Square.of(-1, 0)).toThrow(RangeError);
    expect(() => Square.of(0, 8)).toThrow(RangeError);
    expect(() => Square.fromIndex(64)).toThrow(RangeError);
  });

  it('offset вне доски возвращает null', () => {
    expect(Square.fromAlgebraic('a1').offset(-1, 0)).toBeNull();
    expect(Square.fromAlgebraic('h8').offset(0, 1)).toBeNull();
  });

  it('offset возвращает правильное поле', () => {
    const e4 = Square.fromAlgebraic('e4');
    expect(e4.offset(1, 1)?.algebraic).toBe('f5');
    expect(e4.offset(-2, -3)?.algebraic).toBe('c1');
  });

  it('index = rank*8 + file', () => {
    expect(Square.fromAlgebraic('a1').index).toBe(0);
    expect(Square.fromAlgebraic('h1').index).toBe(7);
    expect(Square.fromAlgebraic('a8').index).toBe(56);
    expect(Square.fromAlgebraic('h8').index).toBe(63);
  });
});
