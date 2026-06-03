import { BoardSnapshot } from '@/modules/game/domain/game/BoardSnapshot';
import { MoveGenerator } from '@/modules/game/domain/game/MoveGenerator';
import { Square } from '@/modules/game/domain/game/value-objects/Square';
import { describe, expect, it } from 'vitest';

const sq = Square.fromAlgebraic;

const perft = (snap: BoardSnapshot, depth: number): number => {
  if (depth === 0) return 1;
  const moves = MoveGenerator.legalMoves(snap);
  if (depth === 1) return moves.length;
  let total = 0;
  for (const m of moves) total += perft(snap.apply(m), depth - 1);
  return total;
};

describe('MoveGenerator', () => {
  it('в начальной позиции 20 легальных ходов', () => {
    const snap = BoardSnapshot.initial();
    expect(MoveGenerator.legalMoves(snap).length).toBe(20);
  });

  it('связанная фигура не может сойти с линии связки', () => {
    const snap = BoardSnapshot.fromFen('k3r3/8/8/8/8/8/4N3/4K3 w - - 0 1');
    const knightMoves = MoveGenerator.legalMoves(snap).filter((m) =>
      m.from.equals(sq('e2')),
    );
    expect(knightMoves.length).toBe(0);
  });

  it('генерирует en-passant', () => {
    const snap = BoardSnapshot.fromFen(
      'rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3',
    );
    const ep = MoveGenerator.legalMoves(snap).filter((m) => m.isEnPassant);
    expect(ep.length).toBe(1);
    expect(ep[0]!.to.algebraic).toBe('d6');
  });

  it('генерирует рокировку, когда путь свободен и не атакован', () => {
    const snap = BoardSnapshot.fromFen(
      'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',
    );
    const castles = MoveGenerator.legalMoves(snap).filter((m) => m.isCastling);
    expect(castles.length).toBe(2);
  });

  it('блокирует рокировку через атакованное поле', () => {
    const snap = BoardSnapshot.fromFen('4k3/8/8/8/8/8/5r2/R3K2R w KQ - 0 1');
    const castles = MoveGenerator.legalMoves(snap).filter((m) => m.isCastling);
    expect(castles.map((m) => m.special)).toEqual(['castle-queen']);
  });

  it('блокирует рокировку под шахом', () => {
    const snap = BoardSnapshot.fromFen('4k3/8/8/8/8/8/4r3/R3K2R w KQ - 0 1');
    const castles = MoveGenerator.legalMoves(snap).filter((m) => m.isCastling);
    expect(castles).toHaveLength(0);
  });

  it('генерирует 4 хода превращения при выходе на последнюю горизонталь', () => {
    const snap = BoardSnapshot.fromFen('8/P7/8/8/8/8/8/4k2K w - - 0 1');
    const promos = MoveGenerator.legalMoves(snap).filter((m) => m.isPromotion);
    expect(promos.length).toBe(4);
    expect(new Set(promos.map((m) => m.promotion))).toEqual(
      new Set(['queen', 'rook', 'bishop', 'knight']),
    );
  });

  it('perft от начальной: depth 1=20, depth 2=400, depth 3=8902', () => {
    const snap = BoardSnapshot.initial();
    expect(perft(snap, 1)).toBe(20);
    expect(perft(snap, 2)).toBe(400);
    expect(perft(snap, 3)).toBe(8902);
  });

  it('perft Kiwipete depth 2 = 2039', () => {
    const snap = BoardSnapshot.fromFen(
      'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1',
    );
    expect(perft(snap, 1)).toBe(48);
    expect(perft(snap, 2)).toBe(2039);
  });
});
