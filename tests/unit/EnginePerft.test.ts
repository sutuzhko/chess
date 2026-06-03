import { EngineMoveGen, EnginePosition, Zobrist } from '@/engine';
import { describe, expect, it } from 'vitest';

const perft = (p: EnginePosition, depth: number): number => {
  if (depth === 0) return 1;
  const moves: ReturnType<typeof Array.prototype.slice> = [];
  EngineMoveGen.generateLegal(p, moves as never);
  if (depth === 1) return moves.length;
  let total = 0;
  for (const m of moves as Parameters<typeof p.make>[0][]) {
    p.make(m);
    total += perft(p, depth - 1);
    p.unmake();
  }
  return total;
};

describe('Engine perft', () => {
  it('счётчики начальной позиции совпадают до depth 3', () => {
    const p = EnginePosition.fromFen(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    );
    expect(perft(p, 1)).toBe(20);
    expect(perft(p, 2)).toBe(400);
    expect(perft(p, 3)).toBe(8902);
  });

  it('Kiwipete depth 2 совпадает', () => {
    const p = EnginePosition.fromFen(
      'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1',
    );
    expect(perft(p, 1)).toBe(48);
    expect(perft(p, 2)).toBe(2039);
  });

  it('zobrist hash консистентен после make/unmake', () => {
    const p = EnginePosition.fromFen(
      'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1',
    );
    const moves: Parameters<typeof p.make>[0][] = [];
    EngineMoveGen.generateLegal(p, moves);
    for (const m of moves.slice(0, 8)) {
      const before = p.hash;
      p.make(m);
      expect(p.hash).toBe(Zobrist.computeHash(p));
      p.unmake();
      expect(p.hash).toBe(before);
    }
  });
});
