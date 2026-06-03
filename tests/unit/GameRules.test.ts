import { BoardSnapshot } from '@/modules/game/domain/game/BoardSnapshot';
import { GameRules } from '@/modules/game/domain/game/GameRules';
import { describe, expect, it } from 'vitest';

describe('GameRules', () => {
  it('распознаёт шах', () => {
    const snap = BoardSnapshot.fromFen('4k3/8/8/8/8/8/4r3/4K3 w - - 0 1');
    expect(GameRules.isInCheck(snap, 'white')).toBe(true);
  });

  it("распознаёт fool's mate", () => {
    const snap = BoardSnapshot.fromFen(
      'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3',
    );
    const status = GameRules.status(snap);
    expect(status.kind).toBe('checkmate');
    if (status.kind === 'checkmate') expect(status.winner).toBe('black');
  });

  it('распознаёт пат', () => {
    const snap = BoardSnapshot.fromFen('7k/5K2/6Q1/8/8/8/8/8 b - - 0 1');
    expect(GameRules.status(snap).kind).toBe('stalemate');
  });

  it('распознаёт недостаточный материал (K vs K)', () => {
    const snap = BoardSnapshot.fromFen('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
    expect(GameRules.status(snap).kind).toBe('draw-insufficient-material');
  });

  it('K+N vs K — недостаточный материал', () => {
    const snap = BoardSnapshot.fromFen('4k3/8/8/8/8/8/8/3NK3 w - - 0 1');
    expect(GameRules.status(snap).kind).toBe('draw-insufficient-material');
  });

  it('K+R vs K — достаточный материал', () => {
    const snap = BoardSnapshot.fromFen('4k3/8/8/8/8/8/8/3RK3 w - - 0 1');
    expect(GameRules.status(snap).kind).toBe('in-progress');
  });

  it('сообщает о ничьей по 50-ходовому правилу', () => {
    const snap = BoardSnapshot.fromFen('4k3/8/4K3/4R3/8/8/8/8 b - - 100 60');
    expect(GameRules.status(snap).kind).toBe('draw-50-move');
  });
});
