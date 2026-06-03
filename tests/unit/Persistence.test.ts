import { Match, Square } from '@/modules/game/domain/game';
import {
  JsonMatchCodec,
} from '@/modules/game/infrastructure/persistence/JsonMatchCodec';
import { PgnCodec } from '@/modules/game/infrastructure/persistence/PgnCodec';
import { describe, expect, it } from 'vitest';

const sq = Square.fromAlgebraic;

const playFoolsMate = (m: Match): void => {
  m.applyMove({ from: sq('f2'), to: sq('f3') });
  m.applyMove({ from: sq('e7'), to: sq('e5') });
  m.applyMove({ from: sq('g2'), to: sq('g4') });
  m.applyMove({ from: sq('d8'), to: sq('h4') });
};

describe('JsonMatchCodec', () => {
  it('round-trip сыгранной партии', () => {
    const m = Match.start('m1');
    playFoolsMate(m);
    const serialized = JsonMatchCodec.serialize(m);
    const restored = JsonMatchCodec.deserialize(serialized);
    expect(restored.currentSnapshot.toFen()).toBe(m.currentSnapshot.toFen());
    expect(restored.status.kind).toBe('checkmate');
  });

  it('сохраняет позицию курсора после undo', () => {
    const m = Match.start('m1');
    m.applyMove({ from: sq('e2'), to: sq('e4') });
    m.applyMove({ from: sq('e7'), to: sq('e5') });
    m.undo();
    const restored = JsonMatchCodec.deserialize(JsonMatchCodec.serialize(m));
    expect(restored.timeline.currentIndex).toBe(1);
  });
});

describe('PgnCodec', () => {
  it("экспортирует fool's mate с суффиксом мата", () => {
    const m = Match.start('m1');
    playFoolsMate(m);
    const pgn = PgnCodec.export(m, { Event: 'Test' });
    expect(pgn).toContain('1. f3 e5');
    expect(pgn).toContain('Qh4#');
    expect(pgn).toContain('0-1');
  });

  it('round-trip export → import', () => {
    const m = Match.start('m1');
    playFoolsMate(m);
    const pgn = PgnCodec.export(m);
    const restored = PgnCodec.import(pgn, 'm2');
    expect(restored.currentSnapshot.toFen()).toBe(m.currentSnapshot.toFen());
  });

  it('импортирует PGN с custom FEN', () => {
    const fen = '8/P7/8/8/8/8/8/4k2K w - - 0 1';
    const m = Match.start('m1', undefined);
    void m;
    const synthetic = `[Event "Custom"]\n[SetUp "1"]\n[FEN "${fen}"]\n[Result "*"]\n\n1. a8=Q *\n`;
    const restored = PgnCodec.import(synthetic, 'm2');
    expect(restored.currentSnapshot.pieceAt(sq('a8'))?.symbol).toBe('Q');
  });
});
