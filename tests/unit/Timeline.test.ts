import {
  BoardSnapshot,
  Move,
  Square,
  Timeline,
} from '@/modules/game/domain/game';
import { describe, expect, it } from 'vitest';

const sq = Square.fromAlgebraic;

describe('Timeline', () => {
  it('стартует с index=0 и без undo', () => {
    const t = Timeline.from(BoardSnapshot.initial());
    expect(t.currentIndex).toBe(0);
    expect(t.canUndo).toBe(false);
    expect(t.canRedo).toBe(false);
  });

  it('push двигает курсор вперёд', () => {
    const t = Timeline.from(BoardSnapshot.initial());
    const next = t.current.apply(new Move(sq('e2'), sq('e4'), 'double-push'));
    t.push(next, []);
    expect(t.currentIndex).toBe(1);
    expect(t.canUndo).toBe(true);
    expect(t.canRedo).toBe(false);
  });

  it('undo/redo двигают курсор без потери записей', () => {
    const t = Timeline.from(BoardSnapshot.initial());
    const next = t.current.apply(new Move(sq('e2'), sq('e4'), 'double-push'));
    t.push(next, []);
    expect(t.undo()).toBe(true);
    expect(t.currentIndex).toBe(0);
    expect(t.canRedo).toBe(true);
    expect(t.redo()).toBe(true);
    expect(t.currentIndex).toBe(1);
  });

  it('push после undo обрезает будущее', () => {
    const t = Timeline.from(BoardSnapshot.initial());
    const e4 = t.current.apply(new Move(sq('e2'), sq('e4'), 'double-push'));
    t.push(e4, []);
    t.undo();
    const d4 = t.current.apply(new Move(sq('d2'), sq('d4'), 'double-push'));
    t.push(d4, []);
    expect(t.length).toBe(2);
    expect(t.canRedo).toBe(false);
    expect(t.current.toFen()).toBe(d4.toFen());
  });

  it('jumpTo перематывает без обрезания', () => {
    const t = Timeline.from(BoardSnapshot.initial());
    const e4 = t.current.apply(new Move(sq('e2'), sq('e4'), 'double-push'));
    t.push(e4, []);
    t.jumpTo(0);
    expect(t.currentIndex).toBe(0);
    expect(t.length).toBe(2);
    expect(t.canRedo).toBe(true);
  });

  it('jumpTo вне диапазона бросает', () => {
    const t = Timeline.from(BoardSnapshot.initial());
    expect(() => { t.jumpTo(5); }).toThrow(RangeError);
  });
});
