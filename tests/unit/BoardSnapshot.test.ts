import {
  BoardSnapshot,
  INITIAL_FEN,
} from '@/modules/game/domain/game/BoardSnapshot';
import { Move } from '@/modules/game/domain/game/value-objects/Move';
import { Square } from '@/modules/game/domain/game/value-objects/Square';
import { describe, expect, it } from 'vitest';

const sq = Square.fromAlgebraic;

const FEN_KIWIPETE = 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1';
const FEN_KK_ENDGAME = '8/8/8/4k3/8/8/4K3/8 w - - 0 1';
const FEN_AFTER_E4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
const FEN_CASTLING_OPEN = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
const FEN_EP_READY = 'rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3';
const FEN_PROMO = '8/P7/8/8/8/8/8/4k2K w - - 0 1';

describe('BoardSnapshot', () => {
  it('начальная позиция соответствует INITIAL_FEN', () => {
    expect(BoardSnapshot.initial().toFen()).toBe(INITIAL_FEN);
  });

  it('round-trip произвольного FEN', () => {
    const fens = [FEN_KIWIPETE, FEN_KK_ENDGAME, FEN_AFTER_E4];
    for (const f of fens) expect(BoardSnapshot.fromFen(f).toFen()).toBe(f);
  });

  it('тихий ход пешки меняет сторону и обновляет часы', () => {
    const initial = BoardSnapshot.initial();
    const e4 = initial.apply(new Move(sq('e2'), sq('e4'), 'double-push'));
    expect(e4.sideToMove).toBe('black');
    expect(e4.enPassantTarget?.algebraic).toBe('e3');
    expect(e4.halfmoveClock).toBe(0);
    expect(e4.fullmoveNumber).toBe(1);
  });

  it('рокировка перемещает короля и ладью', () => {
    const snap = BoardSnapshot.fromFen(FEN_CASTLING_OPEN);
    const after = snap.apply(new Move(sq('e1'), sq('g1'), 'castle-king'));
    expect(after.pieceAt(sq('g1'))?.symbol).toBe('K');
    expect(after.pieceAt(sq('f1'))?.symbol).toBe('R');
    expect(after.pieceAt(sq('h1'))).toBeNull();
    expect(after.castlingRights.has('white', 'king')).toBe(false);
    expect(after.castlingRights.has('white', 'queen')).toBe(false);
  });

  it('en-passant убирает побитую пешку', () => {
    const snap = BoardSnapshot.fromFen(FEN_EP_READY);
    const ep = snap.apply(new Move(sq('e5'), sq('d6'), 'en-passant', null, 'pawn'));
    expect(ep.pieceAt(sq('d6'))?.symbol).toBe('P');
    expect(ep.pieceAt(sq('d5'))).toBeNull();
    expect(ep.pieceAt(sq('e5'))).toBeNull();
    expect(ep.halfmoveClock).toBe(0);
  });

  it('превращение заменяет пешку выбранной фигурой', () => {
    const snap = BoardSnapshot.fromFen(FEN_PROMO);
    const after = snap.apply(new Move(sq('a7'), sq('a8'), null, 'queen'));
    expect(after.pieceAt(sq('a8'))?.symbol).toBe('Q');
    expect(after.pieceAt(sq('a7'))).toBeNull();
  });

  it('взятие ладьи на исходном углу снимает право на рокировку', () => {
    const snap = BoardSnapshot.fromFen(FEN_CASTLING_OPEN);
    const after = snap.apply(new Move(sq('a1'), sq('a8'), null, null, 'rook'));
    expect(after.castlingRights.has('black', 'queen')).toBe(false);
    expect(after.castlingRights.has('white', 'queen')).toBe(false);
    expect(after.castlingRights.has('black', 'king')).toBe(true);
  });
});
