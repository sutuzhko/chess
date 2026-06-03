import {
  BoardSnapshot,
  MoveGenerator,
  Square,
} from '@/modules/game/domain/game';
import {
  addToReserve,
  emptyReserves,
  ShvedkiMoveGenerator,
} from '@/modules/game/domain/shvedki';
import { describe, expect, it } from 'vitest';

const sq = Square.fromAlgebraic;

describe('ShvedkiMoveGenerator', () => {
  it('совпадает с MoveGenerator на начальной позиции с пустыми резервами', () => {
    const snap = BoardSnapshot.initial();
    const reserves = emptyReserves();
    const all = ShvedkiMoveGenerator.legalMoves(snap, reserves);
    expect(all).toHaveLength(MoveGenerator.legalMoves(snap).length);
    expect(all.every((m) => m.kind === 'normal')).toBe(true);
  });

  it('генерирует drop на пустые поля минус drop+check (правило проекта)', () => {
    const snap = BoardSnapshot.initial();
    const reserves = addToReserve(emptyReserves(), 'white', 'knight');
    const moves = ShvedkiMoveGenerator.legalMoves(snap, reserves);
    const drops = moves.filter((m) => m.kind === 'drop');
    // 32 пустых поля минус 2 (N@d6 и N@f6 шахуют чёрного короля на e8) = 30.
    expect(drops).toHaveLength(30);
    // Убеждаемся, что оба «дроп с шахом» отфильтрованы.
    expect(drops.some((m) => m.kind === 'drop' && m.to.algebraic === 'd6')).toBe(false);
    expect(drops.some((m) => m.kind === 'drop' && m.to.algebraic === 'f6')).toBe(false);
  });

  it('запрещает drop пешки на 1-й или 8-й горизонтали', () => {
    const fen = '8/8/8/4k3/8/8/8/4K3 w - - 0 1';
    const snap = BoardSnapshot.fromFen(fen);
    const reserves = addToReserve(emptyReserves(), 'white', 'pawn');
    const drops = ShvedkiMoveGenerator.legalMoves(snap, reserves).filter(
      (m) => m.kind === 'drop',
    );
    expect(drops.every((m) => m.kind === 'drop' && m.to.rank !== 0 && m.to.rank !== 7))
      .toBe(true);
  });

  it('не генерирует drop, дающие шах (правило проекта)', () => {
    const fen = '4k3/8/8/8/8/8/8/3K4 w - - 0 1';
    const snap = BoardSnapshot.fromFen(fen);
    const reserves = addToReserve(emptyReserves(), 'white', 'queen');
    const drops = ShvedkiMoveGenerator.legalMoves(snap, reserves).filter(
      (m) => m.kind === 'drop',
    );
    // Q@e7 атакует чёрного короля по вертикали e. По правилу проекта
    // дроп с шахом запрещён, поэтому e7 не должно появиться среди ходов.
    expect(drops.some((m) => m.kind === 'drop' && m.to.equals(sq('e7')))).toBe(false);
  });

  it('applyMove для drop расходует одну фигуру из резерва', () => {
    const snap = BoardSnapshot.initial();
    const reserves = addToReserve(emptyReserves(), 'white', 'bishop');
    const { reserves: after } = ShvedkiMoveGenerator.applyMove(snap, reserves, {
      kind: 'drop',
      piece: 'bishop',
      to: sq('c3'),
    });
    expect(after.white.count('bishop')).toBe(0);
    expect(after.black.count('bishop')).toBe(0);
  });

  it('hasAnyMove=false на пате без резервов', () => {
    // Классический пат.
    const fen = '7k/5K2/6Q1/8/8/8/8/8 b - - 0 1';
    const snap = BoardSnapshot.fromFen(fen);
    expect(ShvedkiMoveGenerator.hasAnyMove(snap, emptyReserves())).toBe(false);
  });
});
