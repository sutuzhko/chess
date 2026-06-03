import type {
  BookMove,
  OpeningSource,
  RawMasterMove,
} from '@/modules/game/application';
import { pickWeighted, toTheoryMoves } from '@/modules/game/application';
import {
  CompositeOpeningSource,
} from '@/modules/game/infrastructure/opening/CompositeOpeningSource';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { masterMock } = vi.hoisted(() => ({ masterMock: vi.fn() }));
vi.mock('equine', () => ({ openingExplorerMaster: masterMock }));

describe('pickWeighted', () => {
  it('возвращает null когда ходов нет', () => {
    expect(pickWeighted([], 'white')).toBeNull();
  });

  it('возвращает единственный ход независимо от rng', () => {
    const moves: BookMove[] = [{ uci: 'e2e4', san: 'e4', wdl: [40, 30, 30] }];
    expect(pickWeighted(moves, 'white', () => 0.99)).toBe('e2e4');
  });

  it('предпочитает ход с лучшим ожидаемым счётом для белых', () => {
    const moves: BookMove[] = [
      { uci: 'good', san: 'A', wdl: [60, 20, 20] },
      { uci: 'weak', san: 'B', wdl: [40, 20, 40] },
    ];
    let good = 0;
    for (let i = 0; i < 3000; i++) {
      if (pickWeighted(moves, 'white') === 'good') good++;
    }
    expect(good / 3000).toBeGreaterThan(0.7);
  });

  it('инвертирует предпочтение для второй стороны', () => {
    const moves: BookMove[] = [
      { uci: 'whiteFav', san: 'A', wdl: [60, 20, 20] },
      { uci: 'blackFav', san: 'B', wdl: [20, 20, 60] },
    ];
    let blackFav = 0;
    for (let i = 0; i < 3000; i++) {
      if (pickWeighted(moves, 'black') === 'blackFav') blackFav++;
    }
    expect(blackFav / 3000).toBeGreaterThan(0.7);
  });

  it('возвращает ход даже без W/D/L', () => {
    const moves: BookMove[] = [
      { uci: 'a', san: 'A' },
      { uci: 'b', san: 'B' },
    ];
    expect(['a', 'b']).toContain(pickWeighted(moves, 'white', () => 0.5));
  });
});

describe('toTheoryMoves', () => {
  it('возвращает пусто при пустом входе или нуле партий', () => {
    expect(toTheoryMoves([])).toEqual([]);
    expect(toTheoryMoves([{ uci: 'a', san: 'A', white: 0, draws: 0, black: 0 }])).toEqual([]);
  });

  it('отсекает низкосэмпловый хвост и сортирует по популярности', () => {
    const raw: RawMasterMove[] = [
      { uci: 'a', san: 'A', white: 10, draws: 10, black: 10 }, // 30 партий
      { uci: 'b', san: 'B', white: 100, draws: 100, black: 100 }, // 300 партий
      { uci: 'c', san: 'C', white: 1, draws: 0, black: 0 }, // 1 партия — ниже minGames
    ];
    const out = toTheoryMoves(raw);
    expect(out.map((m) => m.uci)).toEqual(['b', 'a']);
    expect(out[0]?.games).toBe(300);
  });

  it('отсекает ходы ниже минимальной доли даже при minGames', () => {
    const raw: RawMasterMove[] = [
      { uci: 'big', san: 'X', white: 10000, draws: 10000, black: 10000 }, // 30000
      { uci: 'small', san: 'Y', white: 6, draws: 0, black: 0 }, // 6 партий, доля ≈ 0.0002
    ];
    expect(toTheoryMoves(raw).map((m) => m.uci)).toEqual(['big']);
  });

  it('переносит W/D/L и число партий насквозь', () => {
    const out = toTheoryMoves([{ uci: 'e2e4', san: 'e4', white: 50, draws: 30, black: 20 }]);
    expect(out).toEqual([{ uci: 'e2e4', san: 'e4', wdl: [50, 30, 20], games: 100 }]);
  });

  it('обрезает результат до topN', () => {
    const raw: RawMasterMove[] = Array.from({ length: 24 }, (_, i) => ({
      uci: `m${String(i)}`,
      san: `M${String(i)}`,
      white: 100 - i,
      draws: 0,
      black: 0,
    }));
    expect(toTheoryMoves(raw)).toHaveLength(16);
  });
});

class StubSource implements OpeningSource {
  constructor(private readonly result: readonly BookMove[] | Error) {}
  movesAt(): Promise<readonly BookMove[]> {
    if (this.result instanceof Error) return Promise.reject(this.result);
    return Promise.resolve(this.result);
  }
}

const FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

describe('CompositeOpeningSource', () => {
  it('использует primary, если он вернул ходы', async () => {
    const primary = new StubSource([{ uci: 'e2e4', san: 'e4' }]);
    const fallback = new StubSource([{ uci: 'd2d4', san: 'd4' }]);
    const composite = new CompositeOpeningSource(primary, fallback);
    expect(await composite.movesAt(FEN)).toEqual([{ uci: 'e2e4', san: 'e4' }]);
  });

  it('fallback при ошибке primary', async () => {
    const primary = new StubSource(new Error('network'));
    const fallback = new StubSource([{ uci: 'd2d4', san: 'd4' }]);
    const composite = new CompositeOpeningSource(primary, fallback);
    expect(await composite.movesAt(FEN)).toEqual([{ uci: 'd2d4', san: 'd4' }]);
  });

  it('fallback при пустом ответе primary', async () => {
    const primary = new StubSource([]);
    const fallback = new StubSource([{ uci: 'd2d4', san: 'd4' }]);
    const composite = new CompositeOpeningSource(primary, fallback);
    expect(await composite.movesAt(FEN)).toEqual([{ uci: 'd2d4', san: 'd4' }]);
  });
});

describe('LichessOpeningSource', () => {
  beforeEach(() => {
    masterMock.mockReset();
  });

  it('маппит counts в W/D/L, отсекает пустой хвост, кэширует', async () => {
    masterMock.mockResolvedValue({
      response: { status: 200 },
      data: {
        moves: [
          { uci: 'e2e4', san: 'e4', white: 50, draws: 30, black: 20 },
          // За ходом ноль партий — это шум, должен отсеяться.
          { uci: 'd2d4', san: 'd4', white: 0, draws: 0, black: 0 },
        ],
      },
    });
    const { LichessOpeningSource } = await import(
      '../../src/modules/game/infrastructure/opening/LichessOpeningSource.js'
    );
    const source = new LichessOpeningSource(() => 'test-token');

    const moves = await source.movesAt(FEN);
    expect(moves).toEqual([
      { uci: 'e2e4', san: 'e4', wdl: [50, 30, 20], games: 100 },
    ]);

    // Повторный запрос для той же позиции обслуживается из кэша.
    await source.movesAt(FEN);
    expect(masterMock).toHaveBeenCalledTimes(1);

    const options = masterMock.mock.calls[0]?.[0] as {
      baseUrl: string;
      query: { fen: string };
      headers: { Authorization: string };
    };
    expect(options.baseUrl).toBe('https://explorer.lichess.org');
    expect(options.query.fen).toBe(FEN);
    expect(options.headers.Authorization).toBe('Bearer test-token');
  });

  it('без токена бросает LichessUnauthorizedError, в Lichess не ходит', async () => {
    const { LichessOpeningSource, LichessUnauthorizedError } = await import(
      '../../src/modules/game/infrastructure/opening/LichessOpeningSource.js'
    );
    const source = new LichessOpeningSource(() => null);

    await expect(source.movesAt(FEN)).rejects.toBeInstanceOf(LichessUnauthorizedError);
    expect(masterMock).not.toHaveBeenCalled();
  });

  it('401 от Lichess превращается в LichessUnauthorizedError', async () => {
    masterMock.mockResolvedValue({
      response: { status: 401 },
      data: undefined,
    });
    const { LichessOpeningSource, LichessUnauthorizedError } = await import(
      '../../src/modules/game/infrastructure/opening/LichessOpeningSource.js'
    );
    const source = new LichessOpeningSource(() => 'stale-token');

    await expect(source.movesAt(FEN)).rejects.toBeInstanceOf(LichessUnauthorizedError);
  });
});
