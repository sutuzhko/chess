import { BoardSnapshot } from '@/modules/game/domain/game/BoardSnapshot';
import { CheckDeclared } from '@/modules/game/domain/game/events/CheckDeclared';
import { MatchEnded } from '@/modules/game/domain/game/events/MatchEnded';
import { MoveMade } from '@/modules/game/domain/game/events/MoveMade';
import { PawnPromoted } from '@/modules/game/domain/game/events/PawnPromoted';
import { UndoMoveMade } from '@/modules/game/domain/game/events/UndoMoveMade';
import {
  IllegalMoveError,
  Match,
  MatchOverError,
} from '@/modules/game/domain/game/Match';
import { Square } from '@/modules/game/domain/game/value-objects/Square';
import { describe, expect, it } from 'vitest';

const sq = Square.fromAlgebraic;

describe('Match', () => {
  it('эмитит MoveMade на легальный ход', () => {
    const m = Match.start('m1');
    const events = m.applyMove({ from: sq('e2'), to: sq('e4') });
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(MoveMade);
    expect(m.currentSnapshot.sideToMove).toBe('black');
  });

  it('бросает на нелегальный ход', () => {
    const m = Match.start('m1');
    expect(() => m.applyMove({ from: sq('e2'), to: sq('e5') })).toThrow(
      IllegalMoveError,
    );
  });

  it("разыгрывает fool's mate и эмитит MatchEnded", () => {
    const m = Match.start('m1');
    m.applyMove({ from: sq('f2'), to: sq('f3') });
    m.applyMove({ from: sq('e7'), to: sq('e5') });
    m.applyMove({ from: sq('g2'), to: sq('g4') });
    const final = m.applyMove({ from: sq('d8'), to: sq('h4') });
    expect(final.some((e) => e instanceof CheckDeclared)).toBe(true);
    expect(final.some((e) => e instanceof MatchEnded)).toBe(true);
    expect(m.status.kind).toBe('checkmate');
  });

  it('отвергает ходы после завершения партии', () => {
    const snap = BoardSnapshot.fromFen(
      'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3',
    );
    const m = Match.start('m1', snap);
    expect(() => m.applyMove({ from: sq('e1'), to: sq('f2') })).toThrow(
      MatchOverError,
    );
  });

  it('эмитит PawnPromoted на превращении', () => {
    const snap = BoardSnapshot.fromFen('8/P7/8/8/8/8/8/4k2K w - - 0 1');
    const m = Match.start('m1', snap);
    const events = m.applyMove({
      from: sq('a7'),
      to: sq('a8'),
      promotion: 'queen',
    });
    expect(events.some((e) => e instanceof PawnPromoted)).toBe(true);
  });

  it('undo восстанавливает предыдущий снимок и эмитит UndoMoveMade', () => {
    const m = Match.start('m1');
    const before = m.currentSnapshot.toFen();
    m.applyMove({ from: sq('e2'), to: sq('e4') });
    const events = m.undo();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(UndoMoveMade);
    expect(m.currentSnapshot.toFen()).toBe(before);
  });

  it('redo повторяет отменённый ход', () => {
    const m = Match.start('m1');
    m.applyMove({ from: sq('e2'), to: sq('e4') });
    const after = m.currentSnapshot.toFen();
    m.undo();
    m.redo();
    expect(m.currentSnapshot.toFen()).toBe(after);
  });

  it('resign фиксирует поражение проигравшего и эмитит MatchEnded', () => {
    const m = Match.start('m1');
    const events = m.resign('white');
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(MatchEnded);
    expect(m.status).toEqual({ kind: 'resignation', winner: 'black' });
  });

  it('forfeit фиксирует поражение по времени', () => {
    const m = Match.start('m1');
    const events = m.forfeit('black');
    expect(events).toHaveLength(1);
    expect(m.status).toEqual({ kind: 'time-forfeit', winner: 'white' });
  });

  it('resign после завершения партии ничего не делает', () => {
    const snap = BoardSnapshot.fromFen(
      'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3',
    );
    const m = Match.start('m1', snap);
    expect(m.resign('white')).toEqual([]);
  });
});
