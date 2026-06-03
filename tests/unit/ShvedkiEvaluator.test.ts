import { BoardSnapshot } from '@/modules/game/domain/game';
import { addToReserve, emptyReserves } from '@/modules/game/domain/shvedki';
import { evaluateShvedki } from '@/modules/game/infrastructure/engine/shvedki';
import { describe, expect, it } from 'vitest';

describe('ShvedkiEvaluator', () => {
  it('штрафует сторону, у соперника которой ферзь в резерве', () => {
    const snap = BoardSnapshot.initial();
    const empty = emptyReserves();
    const baseline = evaluateShvedki({ snap, reserves: empty });

    // Кладём чёрному ферзя в резерв. Ход белых, поэтому оценка с точки зрения
    // белых должна просесть относительно симметричной базы.
    const withBlackQueen = addToReserve(empty, 'black', 'queen');
    const dropped = evaluateShvedki({ snap, reserves: withBlackQueen });
    expect(dropped).toBeLessThan(baseline);
    // 0.75 × 900 = 675 — основной размах должен быть около этой величины.
    expect(baseline - dropped).toBeGreaterThan(500);
  });

  it('награждает сторону, у которой материал в резерве', () => {
    const snap = BoardSnapshot.initial();
    const empty = emptyReserves();
    const withWhiteRook = addToReserve(empty, 'white', 'rook');
    const baseline = evaluateShvedki({ snap, reserves: empty });
    const better = evaluateShvedki({ snap, reserves: withWhiteRook });
    // Ход белых, белая ладья в кармане → оценка обязана вырасти.
    expect(better).toBeGreaterThan(baseline);
  });

  it('штрафует раскрытого короля при наличии резерва у соперника', () => {
    // Чёрный король на e8 без пешечного прикрытия, у белых в резерве ферзь.
    const fen = '4k3/8/8/8/8/8/PPPPPPPP/R1BQKBNR w KQ - 0 1';
    const snap = BoardSnapshot.fromFen(fen);
    const empty = emptyReserves();
    const withReserve = addToReserve(empty, 'white', 'queen');
    const safe = evaluateShvedki({ snap, reserves: empty });
    const danger = evaluateShvedki({ snap, reserves: withReserve });
    // С точки зрения белых: ферзь в резерве рядом с раскрытым королём
    // соперника обязан давать больше, чем база с пустыми резервами.
    expect(danger).toBeGreaterThan(safe);
  });
});
