import { Move } from '@/modules/game/domain/game/value-objects/Move';
import { Square } from '@/modules/game/domain/game/value-objects/Square';
import { describe, expect, it } from 'vitest';

const sq = Square.fromAlgebraic;

describe('Move', () => {
  it('isCapture истинно при наличии captured', () => {
    const m = new Move(sq('e4'), sq('d5'), null, null, 'pawn');
    expect(m.isCapture).toBe(true);
  });

  it('isPromotion истинно при наличии promotion', () => {
    const m = new Move(sq('a7'), sq('a8'), null, 'queen');
    expect(m.isPromotion).toBe(true);
  });

  it('isCastling истинно для castle-king и castle-queen', () => {
    expect(new Move(sq('e1'), sq('g1'), 'castle-king').isCastling).toBe(true);
    expect(new Move(sq('e1'), sq('c1'), 'castle-queen').isCastling).toBe(true);
    expect(new Move(sq('e1'), sq('e2')).isCastling).toBe(false);
  });

  it('isEnPassant и isDoublePush распознаются по special', () => {
    expect(new Move(sq('e5'), sq('d6'), 'en-passant').isEnPassant).toBe(true);
    expect(new Move(sq('e2'), sq('e4'), 'double-push').isDoublePush).toBe(true);
    expect(new Move(sq('e2'), sq('e4')).isDoublePush).toBe(false);
  });

  it('matches сверяет from/to/promotion', () => {
    const m = new Move(sq('a7'), sq('a8'), null, 'queen');
    expect(m.matches(sq('a7'), sq('a8'), 'queen')).toBe(true);
    expect(m.matches(sq('a7'), sq('a8'), 'knight')).toBe(false);
    expect(m.matches(sq('a7'), sq('b8'), 'queen')).toBe(false);
  });

  it('matches приводит undefined promotion к null', () => {
    const m = new Move(sq('e2'), sq('e4'));
    expect(m.matches(sq('e2'), sq('e4'))).toBe(true);
  });

  it('equals сравнивает все поля', () => {
    const a = new Move(sq('e2'), sq('e4'), 'double-push');
    const b = new Move(sq('e2'), sq('e4'), 'double-push');
    const c = new Move(sq('e2'), sq('e4'));
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });

  it('toUci для обычного хода: from + to', () => {
    expect(new Move(sq('e2'), sq('e4')).toUci()).toBe('e2e4');
  });

  it('toUci добавляет суффикс превращения', () => {
    expect(new Move(sq('a7'), sq('a8'), null, 'queen').toUci()).toBe('a7a8q');
    expect(new Move(sq('a7'), sq('a8'), null, 'rook').toUci()).toBe('a7a8r');
    expect(new Move(sq('a7'), sq('a8'), null, 'bishop').toUci()).toBe('a7a8b');
    expect(new Move(sq('a7'), sq('a8'), null, 'knight').toUci()).toBe('a7a8n');
  });

  it('toString делегирует toUci', () => {
    const m = new Move(sq('e2'), sq('e4'));
    expect(m.toString()).toBe(m.toUci());
  });
});
