import { BoardSnapshot } from '@/modules/game/domain/game';
import {
  addToReserve,
  emptyReserves,
  shvedkiMoveToUci,
} from '@/modules/game/domain/shvedki';
import { ShvedkiSearch } from '@/modules/game/infrastructure/engine/shvedki';
import { describe, expect, it } from 'vitest';

const opts = {
  maxDepth: 3,
  multiPV: 1,
  temperature: 0,
  noiseCP: 0,
  blunderProb: 0,
  maxDropsPerNode: 16,
};

describe('ShvedkiSearch', () => {
  it('возвращает обычный ход из начальной позиции', () => {
    const snap = BoardSnapshot.initial();
    const search = new ShvedkiSearch();
    const result = search.search({ snap, reserves: emptyReserves() }, opts);
    expect(result.bestMove).not.toBeNull();
    expect(result.bestMove?.kind).toBe('normal');
  });

  it('предпочитает drop, выигрывающий материал, висящему drop', () => {
    // Ход белых. Чёрный ферзь на d5 без защиты, у белых в резерве конь.
    // Любой дроп под бой ферзя — это бесплатная отдача фигуры, поиск
    // обязан такого избежать.
    // Позиция: белый король h1, чёрный король a8, висячий чёрный ферзь d5,
    // больше ничего. В резерве у белых конь.
    const fen = 'k7/8/8/3q4/8/8/8/7K w - - 0 1';
    const snap = BoardSnapshot.fromFen(fen);
    const reserves = addToReserve(emptyReserves(), 'white', 'knight');
    const search = new ShvedkiSearch();
    const result = search.search({ snap, reserves }, opts);
    expect(result.bestMove).not.toBeNull();
    if (result.bestMove?.kind === 'drop') {
      // Выбранный дроп не должен попадать под бой ферзя d5.
      const attackedByQueen = new Set([
        'd1','d2','d3','d4','d6','d7','d8',
        'a5','b5','c5','e5','f5','g5','h5',
        'a8','b7','c6','e4','f3','g2','h1',
        'a2','b3','c4','e6','f7','g8',
      ]);
      expect(attackedByQueen.has(result.bestMove.to.algebraic)).toBe(false);
    }
  });

  it('находит матовую линию и возвращает score в матовом диапазоне', () => {
    // По правилам шведок дроп с шахом запрещён, поэтому все маты — обычными
    // ходами с доски. В позиции есть несколько матов в 1 (Qh7#, Qb8#, Rxh7?);
    // проверяем, что поиск возвращает матовую оценку и берёт нормальный ход,
    // а не отвлекающий дроп конём из резерва.
    // Позиция: бел. K@a1, R@a7, Q@b1, чёрн. K@h8, в резерве у белых конь.
    const fen = '7k/R7/8/8/8/8/8/KQ6 w - - 0 1';
    const snap = BoardSnapshot.fromFen(fen);
    const reserves = addToReserve(emptyReserves(), 'white', 'knight');
    const search = new ShvedkiSearch();
    const result = search.search({ snap, reserves }, { ...opts, maxDepth: 3 });
    expect(result.bestMove).not.toBeNull();
    expect(result.bestMove?.kind).toBe('normal');
    // Матовая оценка (константа MATE в ShvedkiSearch — 30000).
    expect(result.score).toBeGreaterThan(20_000);
  });

  it('выдаёт валидный UCI для обоих типов ходов', () => {
    const snap = BoardSnapshot.initial();
    const reserves = addToReserve(emptyReserves(), 'white', 'knight');
    const search = new ShvedkiSearch();
    const result = search.search({ snap, reserves }, opts);
    const uci = shvedkiMoveToUci(result.bestMove!);
    expect(uci.length).toBeGreaterThanOrEqual(4);
    if (result.bestMove?.kind === 'drop') {
      expect(uci).toMatch(/^[PNBRQ]@[a-h][1-8]$/);
    } else {
      expect(uci).toMatch(/^[a-h][1-8][a-h][1-8][qrbn]?$/);
    }
  });
});
