import {
  applyUciMove,
  isFenValid,
  parseFen,
  replayPv,
  snapshotFromFen,
  uciToSan,
} from '@/modules/game/application/fen';
import { INITIAL_FEN } from '@/modules/game/domain/game/BoardSnapshot';
import { describe, expect, it } from 'vitest';

const FEN_AFTER_E4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
const FEN_KING_PAWN = '8/8/8/4k3/8/8/4K3/8 w - - 0 1';
const FEN_PROMO = '8/P7/8/8/8/8/8/4k2K w - - 0 1';

describe('application/fen', () => {
  it('snapshotFromFen возвращает рабочий BoardSnapshot', () => {
    const snap = snapshotFromFen(INITIAL_FEN);
    expect(snap.toFen()).toBe(INITIAL_FEN);
  });

  it('parseFen извлекает sideToMove из валидного FEN', () => {
    expect(parseFen(INITIAL_FEN).sideToMove).toBe('white');
    expect(parseFen(FEN_AFTER_E4).sideToMove).toBe('black');
  });

  it('parseFen бросает на невалидном FEN', () => {
    expect(() => parseFen('not a fen')).toThrow();
  });

  it('isFenValid возвращает true/false корректно', () => {
    expect(isFenValid(INITIAL_FEN)).toBe(true);
    expect(isFenValid(FEN_KING_PAWN)).toBe(true);
    expect(isFenValid('garbage')).toBe(false);
    expect(isFenValid('')).toBe(false);
  });

  it('applyUciMove применяет легальный UCI и возвращает новый FEN', () => {
    const after = applyUciMove(INITIAL_FEN, 'e2e4');
    expect(after).toBe(FEN_AFTER_E4);
  });

  it('applyUciMove поддерживает превращение', () => {
    const after = applyUciMove(FEN_PROMO, 'a7a8q');
    expect(after).toContain('Q');
  });

  it('applyUciMove бросает на нелегальном ходе', () => {
    expect(() => applyUciMove(INITIAL_FEN, 'e2e5')).toThrow(/Illegal/);
  });

  it('uciToSan конвертирует UCI в SAN для тихого хода', () => {
    expect(uciToSan(INITIAL_FEN, 'e2e4')).toBe('e4');
  });

  it('uciToSan бросает на нелегальном UCI', () => {
    expect(() => uciToSan(INITIAL_FEN, 'e2e5')).toThrow();
  });

  it('replayPv возвращает массив снапшотов от исходного до последнего', () => {
    const pv = ['e2e4', 'e7e5', 'g1f3'];
    const snaps = replayPv(INITIAL_FEN, pv);
    expect(snaps).toHaveLength(4);
    expect(snaps[0]?.toFen()).toBe(INITIAL_FEN);
  });

  it('replayPv прерывается на нелегальном ходе и возвращает накопленное', () => {
    const snaps = replayPv(INITIAL_FEN, ['e2e4', 'illegal']);
    expect(snaps).toHaveLength(2);
  });

  it('replayPv с пустой линией возвращает только стартовый снапшот', () => {
    const snaps = replayPv(INITIAL_FEN, []);
    expect(snaps).toHaveLength(1);
  });
});
