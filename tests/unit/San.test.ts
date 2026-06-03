import { BoardSnapshot } from '@/modules/game/domain/game/BoardSnapshot';
import { MoveGenerator } from '@/modules/game/domain/game/MoveGenerator';
import { moveToSan, sanToMove } from '@/modules/game/domain/game/notation/San';
import { Move } from '@/modules/game/domain/game/value-objects/Move';
import { Square } from '@/modules/game/domain/game/value-objects/Square';
import { describe, expect, it } from 'vitest';

const sq = Square.fromAlgebraic;

const FEN_CASTLING_OPEN = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
const FEN_PROMO_CAPTURE = 'r3k3/1P6/8/8/8/8/8/4K3 w - - 0 1';
const FEN_TWO_KNIGHTS = 'k7/8/3N1N2/8/8/8/8/4K3 w - - 0 1'; // оба коня могут пойти на e4, не дают шах
const FEN_FOOLS_MATE_BEFORE = 'rnb1kbnr/pppp1ppp/8/4p3/6P1/5P1q/PPPPP2P/RNBQKBNR b KQkq - 0 1';
const FEN_CHECK_GIVING = '4k3/8/8/8/8/8/8/R3K3 w - - 0 1';

describe('moveToSan', () => {
  it('пешечный ход → клетка назначения', () => {
    const snap = BoardSnapshot.initial();
    const move = new Move(sq('e2'), sq('e4'), 'double-push');
    expect(moveToSan(snap, move)).toBe('e4');
  });

  it('ход фигуры использует букву фигуры', () => {
    const snap = BoardSnapshot.initial();
    const move = new Move(sq('g1'), sq('f3'));
    expect(moveToSan(snap, move)).toBe('Nf3');
  });

  it('взятие пешкой указывается через f<file>x<to>', () => {
    const snap = BoardSnapshot.fromFen('rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2');
    const move = new Move(sq('e4'), sq('d5'), null, null, 'pawn');
    expect(moveToSan(snap, move)).toBe('exd5');
  });

  it('взятие фигурой через x', () => {
    const snap = BoardSnapshot.fromFen('4k3/8/8/3q4/8/8/3R4/4K3 w - - 0 1');
    const move = new Move(sq('d2'), sq('d5'), null, null, 'queen');
    expect(moveToSan(snap, move)).toBe('Rxd5');
  });

  it('короткая рокировка → O-O', () => {
    const snap = BoardSnapshot.fromFen(FEN_CASTLING_OPEN);
    const move = new Move(sq('e1'), sq('g1'), 'castle-king');
    expect(moveToSan(snap, move)).toBe('O-O');
  });

  it('длинная рокировка → O-O-O', () => {
    const snap = BoardSnapshot.fromFen(FEN_CASTLING_OPEN);
    const move = new Move(sq('e1'), sq('c1'), 'castle-queen');
    expect(moveToSan(snap, move)).toBe('O-O-O');
  });

  it('превращение пешки → =Q', () => {
    const snap = BoardSnapshot.fromFen('8/P7/8/8/8/8/8/4k2K w - - 0 1');
    const move = new Move(sq('a7'), sq('a8'), null, 'queen');
    expect(moveToSan(snap, move)).toBe('a8=Q');
  });

  it('превращение со взятием → axb8=Q', () => {
    const snap = BoardSnapshot.fromFen(FEN_PROMO_CAPTURE);
    const move = new Move(sq('b7'), sq('a8'), null, 'queen', 'rook');
    expect(moveToSan(snap, move)).toBe('bxa8=Q+');
  });

  it('добавляет + при шахе', () => {
    const snap = BoardSnapshot.fromFen(FEN_CHECK_GIVING);
    const move = new Move(sq('a1'), sq('a8'));
    expect(moveToSan(snap, move)).toBe('Ra8+');
  });

  it('добавляет # при мате', () => {
    // 1...Qh3# is not actually mate; use a real mate: 1.f3 e5 2.g4 Qh4# — после хода Qh4
    const snap = BoardSnapshot.fromFen(FEN_FOOLS_MATE_BEFORE);
    // black queen on h3 → h4 with shah; using rook example is simpler
    void snap;
    // Use a known mate: Qxf7# in position где это мат
    const matePos = BoardSnapshot.fromFen('rnbqkbnr/pppp1ppp/8/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 1');
    // мат через Bxf7+ (не настоящий мат). Используем известную позицию-задачу
    const m1 = BoardSnapshot.fromFen('6k1/5ppp/8/8/8/8/8/R6K w - - 0 1');
    const move = new Move(sq('a1'), sq('a8'));
    expect(moveToSan(m1, move)).toBe('Ra8#');
    void matePos;
  });

  it('disambiguation по file когда два коня бьют одно поле', () => {
    const snap = BoardSnapshot.fromFen(FEN_TWO_KNIGHTS);
    const move = new Move(sq('d6'), sq('e4'));
    const san = moveToSan(snap, move);
    expect(san).toBe('Nde4');
  });

  it('бросает если на from нет фигуры', () => {
    const snap = BoardSnapshot.initial();
    const move = new Move(sq('e4'), sq('e5'));
    expect(() => moveToSan(snap, move)).toThrow();
  });
});

describe('sanToMove', () => {
  it('парсит обычный пешечный ход', () => {
    const snap = BoardSnapshot.initial();
    const move = sanToMove(snap, 'e4');
    expect(move.to.algebraic).toBe('e4');
  });

  it('парсит ход фигуры', () => {
    const snap = BoardSnapshot.initial();
    const move = sanToMove(snap, 'Nf3');
    expect(move.from.algebraic).toBe('g1');
    expect(move.to.algebraic).toBe('f3');
  });

  it('парсит короткую рокировку', () => {
    const snap = BoardSnapshot.fromFen(FEN_CASTLING_OPEN);
    expect(sanToMove(snap, 'O-O').special).toBe('castle-king');
    expect(sanToMove(snap, '0-0').special).toBe('castle-king');
  });

  it('парсит длинную рокировку', () => {
    const snap = BoardSnapshot.fromFen(FEN_CASTLING_OPEN);
    expect(sanToMove(snap, 'O-O-O').special).toBe('castle-queen');
    expect(sanToMove(snap, '0-0-0').special).toBe('castle-queen');
  });

  it('парсит превращение пешки', () => {
    const snap = BoardSnapshot.fromFen('8/P7/8/8/8/8/8/4k2K w - - 0 1');
    const move = sanToMove(snap, 'a8=Q');
    expect(move.promotion).toBe('queen');
  });

  it('игнорирует суффикс шаха/мата', () => {
    const snap = BoardSnapshot.fromFen(FEN_CHECK_GIVING);
    expect(sanToMove(snap, 'Ra8+').to.algebraic).toBe('a8');
  });

  it('парсит взятие через x', () => {
    const snap = BoardSnapshot.fromFen('4k3/8/8/3q4/8/8/3R4/4K3 w - - 0 1');
    const move = sanToMove(snap, 'Rxd5');
    expect(move.to.algebraic).toBe('d5');
    expect(move.isCapture).toBe(true);
  });

  it('парсит ход с disambiguation по файлу', () => {
    const snap = BoardSnapshot.fromFen(FEN_TWO_KNIGHTS);
    const move = sanToMove(snap, 'Nde4');
    expect(move.from.algebraic).toBe('d6');
  });

  it('бросает на неизвестном SAN', () => {
    const snap = BoardSnapshot.initial();
    expect(() => sanToMove(snap, 'Zz9')).toThrow();
  });

  it('бросает на нелегальной рокировке', () => {
    expect(() => sanToMove(BoardSnapshot.initial(), 'O-O')).toThrow();
  });

  it('round-trip: moveToSan(sanToMove(s)) == s для разных типов', () => {
    const snap = BoardSnapshot.initial();
    for (const m of MoveGenerator.legalMoves(snap)) {
      const s = moveToSan(snap, m);
      const back = sanToMove(snap, s);
      expect(moveToSan(snap, back)).toBe(s);
    }
  });
});
