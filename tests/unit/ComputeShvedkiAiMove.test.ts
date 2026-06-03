import type { BookMove, OpeningSource } from '@/modules/game/application';
import {
  ComputeShvedkiAiMoveUseCase,
} from '@/modules/game/application/use-cases/ComputeShvedkiAiMove';
import { BoardSnapshot, Move, Square } from '@/modules/game/domain/game';
import { addToReserve, emptyReserves } from '@/modules/game/domain/shvedki';
import type {
  ShvedkiBestMoveRequest,
  ShvedkiBestMoveResult,
  ShvedkiEngineAdapter,
} from '@/modules/game/infrastructure/engine/shvedki';
import { describe, expect, it, vi } from 'vitest';

const sq = Square.fromAlgebraic;

const PROFILE = {
  depth: 3,
  multiPV: 1,
  temperature: 0,
  noiseCP: 0,
  blunderProb: 0,
} as const;

const makeEngine = (result: ShvedkiBestMoveResult | null) => {
  const bestMove = vi.fn(async (_req: ShvedkiBestMoveRequest) => result);
  return { engine: { bestMove } as unknown as ShvedkiEngineAdapter, bestMove };
};

const makeBook = (moves: readonly BookMove[]): OpeningSource => ({
  movesAt: async () => moves,
});

const ENGINE_RESULT: ShvedkiBestMoveResult = {
  move: { kind: 'normal', move: new Move(sq('e2'), sq('e4'), 'double-push') },
  score: 0,
};

describe('ComputeShvedkiAiMoveUseCase', () => {
  it('возвращает книжный ход когда резервы пусты и книга нашла продолжение', async () => {
    const { engine, bestMove } = makeEngine(ENGINE_RESULT);
    const book = makeBook([{ uci: 'e2e4', san: 'e4', wdl: [50, 30, 20] }]);
    const uc = new ComputeShvedkiAiMoveUseCase(engine, book);
    const result = await uc.execute({
      snap: BoardSnapshot.initial(),
      reserves: emptyReserves(),
      aiColor: 'white',
      profile: PROFILE,
    });
    expect(result).not.toBeNull();
    expect(result?.move.kind).toBe('normal');
    expect(bestMove).not.toHaveBeenCalled();
  });

  it('падает в движок если резервы непусты, даже при наличии книги', async () => {
    const { engine, bestMove } = makeEngine(ENGINE_RESULT);
    const book = makeBook([{ uci: 'e2e4', san: 'e4', wdl: [50, 30, 20] }]);
    const uc = new ComputeShvedkiAiMoveUseCase(engine, book);
    await uc.execute({
      snap: BoardSnapshot.initial(),
      reserves: addToReserve(emptyReserves(), 'white', 'queen'),
      aiColor: 'white',
      profile: PROFILE,
    });
    expect(bestMove).toHaveBeenCalledTimes(1);
  });

  it('падает в движок, если книга вернула пустой список', async () => {
    const { engine, bestMove } = makeEngine(ENGINE_RESULT);
    const book = makeBook([]);
    const uc = new ComputeShvedkiAiMoveUseCase(engine, book);
    await uc.execute({
      snap: BoardSnapshot.initial(),
      reserves: emptyReserves(),
      aiColor: 'white',
      profile: PROFILE,
    });
    expect(bestMove).toHaveBeenCalled();
  });

  it('падает в движок, если книга бросает', async () => {
    const { engine, bestMove } = makeEngine(ENGINE_RESULT);
    const book: OpeningSource = { movesAt: async () => { throw new Error('net'); } };
    const uc = new ComputeShvedkiAiMoveUseCase(engine, book);
    await uc.execute({
      snap: BoardSnapshot.initial(),
      reserves: emptyReserves(),
      aiColor: 'white',
      profile: PROFILE,
    });
    expect(bestMove).toHaveBeenCalled();
  });

  it('падает в движок, если книга не передана', async () => {
    const { engine, bestMove } = makeEngine(ENGINE_RESULT);
    const uc = new ComputeShvedkiAiMoveUseCase(engine, null);
    await uc.execute({
      snap: BoardSnapshot.initial(),
      reserves: emptyReserves(),
      aiColor: 'white',
      profile: PROFILE,
    });
    expect(bestMove).toHaveBeenCalled();
  });

  it('возвращает null если и книга, и движок не нашли ход', async () => {
    const { engine } = makeEngine(null);
    const uc = new ComputeShvedkiAiMoveUseCase(engine, null);
    const result = await uc.execute({
      snap: BoardSnapshot.initial(),
      reserves: emptyReserves(),
      aiColor: 'white',
      profile: PROFILE,
    });
    expect(result).toBeNull();
  });

  it('падает в движок, если книжный UCI нелегален', async () => {
    const { engine, bestMove } = makeEngine(ENGINE_RESULT);
    const book = makeBook([{ uci: 'a1h8', san: 'illegal' }]);
    const uc = new ComputeShvedkiAiMoveUseCase(engine, book);
    await uc.execute({
      snap: BoardSnapshot.initial(),
      reserves: emptyReserves(),
      aiColor: 'white',
      profile: PROFILE,
    });
    expect(bestMove).toHaveBeenCalled();
  });
});
