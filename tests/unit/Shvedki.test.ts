import { BoardSnapshot, Square } from '@/modules/game/domain/game';
import {
  addToReserve,
  CrossBoardMoveService,
  DualBoard,
  emptyReserves,
  IllegalCrossBoardMoveError,
} from '@/modules/game/domain/shvedki';
import { describe, expect, it } from 'vitest';

const sq = Square.fromAlgebraic;

describe('Shvedki', () => {
  it('передаёт побитую фигуру в резерв противоположной доски', () => {
    const setup = '4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1';
    const dual = new DualBoard(
      BoardSnapshot.fromFen(setup),
      BoardSnapshot.initial(),
    );
    CrossBoardMoveService.applyMove(dual, {
      kind: 'normal',
      boardId: 'A',
      from: sq('e4'),
      to: sq('d5'),
    });
    // Белые взяли на доске A → партнёр на B играет за чёрных → пешка падает в чёрный резерв на B.
    expect(dual.reserves('B')
      .black
      .count('pawn'))
      .toBe(1);
    expect(dual.reserves('A')
      .white
      .count('pawn'))
      .toBe(0);
  });
  
  it('отвергает drop без резервной фигуры', () => {
    const dual = DualBoard.initial();
    expect(() => {
        CrossBoardMoveService.applyMove(dual, {
          kind: 'drop',
          boardId: 'A',
          piece: 'queen',
          to: sq('e3'),
        });
      },
    )
      .toThrow(IllegalCrossBoardMoveError);
  });
  
  it('отвергает drop, дающий шах', () => {
    const checkPosition = '4k3/8/8/8/8/8/8/4K3 w - - 0 1';
    const dual = new DualBoard(
      BoardSnapshot.fromFen(checkPosition),
      BoardSnapshot.initial(),
    );
    dual.setReserves('A', addToReserve(emptyReserves(), 'white', 'rook'));
    expect(() => {
        CrossBoardMoveService.applyMove(dual, {
          kind: 'drop',
          boardId: 'A',
          piece: 'rook',
          to: sq('e4'),
        });
      },
    )
      .toThrow(/check/);
  });
  
  it('легальный drop проходит и расходует резерв', () => {
    const fen = '4k3/8/8/8/8/8/8/3K4 w - - 0 1';
    const dual = new DualBoard(
      BoardSnapshot.fromFen(fen),
      BoardSnapshot.initial(),
    );
    dual.setReserves('A', addToReserve(emptyReserves(), 'white', 'knight'));
    CrossBoardMoveService.applyMove(dual, {
      kind: 'drop',
      boardId: 'A',
      piece: 'knight',
      to: sq('a4'),
    });
    expect(dual.snapshot('A')
      .pieceAt(sq('a4'))?.symbol)
      .toBe('N');
    expect(dual.reserves('A')
      .white
      .count('knight'))
      .toBe(0);
  });
});
