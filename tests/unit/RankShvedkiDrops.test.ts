import {
  BuildFenAfterShvedkiDropUseCase,
  RankShvedkiDropsUseCase,
} from '@/modules/game/application/use-cases/RankShvedkiDrops';
import { BoardSnapshot, Square } from '@/modules/game/domain/game';
import { addToReserve, emptyReserves } from '@/modules/game/domain/shvedki';
import { describe, expect, it } from 'vitest';

const sq = Square.fromAlgebraic;

describe('RankShvedkiDropsUseCase', () => {
  it('возвращает [] если резерв пуст', () => {
    const uc = new RankShvedkiDropsUseCase();
    const out = uc.execute(BoardSnapshot.initial(), emptyReserves(), 'white');
    expect(out).toEqual([]);
  });

  it('генерирует drop-кандидатов на все пустые поля', () => {
    const uc = new RankShvedkiDropsUseCase();
    const reserves = addToReserve(emptyReserves(), 'white', 'knight');
    const out = uc.execute(BoardSnapshot.initial(), reserves, 'white');
    // 32 пустых поля
    expect(out.length).toBe(32);
    expect(out.every((d) => d.piece === 'knight')).toBe(true);
  });

  it('пешку не дропает на 1-ю и 8-ю горизонталь', () => {
    const uc = new RankShvedkiDropsUseCase();
    const fen = '8/8/8/4k3/8/8/8/4K3 w - - 0 1';
    const snap = BoardSnapshot.fromFen(fen);
    const reserves = addToReserve(emptyReserves(), 'white', 'pawn');
    const out = uc.execute(snap, reserves, 'white');
    expect(out.every((d) => d.to.rank !== 0 && d.to.rank !== 7)).toBe(true);
  });

  it('сортирует по убыванию rank', () => {
    const uc = new RankShvedkiDropsUseCase();
    const fen = '8/8/8/4k3/8/8/8/4K3 w - - 0 1';
    const reserves = addToReserve(emptyReserves(), 'white', 'queen');
    const out = uc.execute(BoardSnapshot.fromFen(fen), reserves, 'white');
    for (let i = 1; i < out.length; i++) {
      const prev = out[i - 1];
      const curr = out[i];
      if (prev && curr) expect(prev.rank).toBeGreaterThanOrEqual(curr.rank);
    }
  });

  it('для чёрных продвижение измеряется от 7-й горизонтали вниз', () => {
    const uc = new RankShvedkiDropsUseCase();
    const fen = '8/8/8/4k3/8/8/8/4K3 b - - 0 1';
    const reservesB = addToReserve(emptyReserves(), 'black', 'knight');
    const outB = uc.execute(BoardSnapshot.fromFen(fen), reservesB, 'black');
    // лучший дроп должен быть ближе к 1-й горизонтали (advance = 7 - rank)
    expect(outB[0]?.to.rank ?? 99).toBeLessThan(4);
  });
});

describe('BuildFenAfterShvedkiDropUseCase', () => {
  it('применяет drop и возвращает FEN с фигурой на нужном поле', () => {
    const uc = new BuildFenAfterShvedkiDropUseCase();
    const snap = BoardSnapshot.fromFen('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
    const fen = uc.execute(snap, sq('d4'), 'knight');
    const restored = BoardSnapshot.fromFen(fen);
    expect(restored.pieceAt(sq('d4'))?.symbol).toBe('N');
  });
});
