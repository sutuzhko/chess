import { EnginePosition } from '@/engine/core/EnginePosition';
import { evalPawnStructure } from '@/engine/evaluation/PawnStructure';
import { describe, expect, it } from 'vitest';

describe('Pawn structure evaluation', () => {
  it('распознаёт проходную белую пешку', () => {
    // Белая пешка b6, ни одной чёрной пешки на a/b/c → проходная.
    const p = EnginePosition.fromFen('4k3/8/1P6/8/8/8/8/4K3 w - - 0 1');
    const score = evalPawnStructure(p);
    expect(score.eg).toBeGreaterThan(0);
    expect(score.mg).toBeGreaterThan(0);
  });

  it('нет бонуса проходной, если заблокирована', () => {
    // Чёрная пешка на b8 (фактически нет такого хода, но FEN валиден) — пешка не проходная.
    const blocked = EnginePosition.fromFen('1p2k3/8/1P6/8/8/8/8/4K3 w - - 0 1');
    const passed = EnginePosition.fromFen('4k3/8/1P6/8/8/8/8/4K3 w - - 0 1');
    expect(evalPawnStructure(passed).eg).toBeGreaterThan(evalPawnStructure(blocked).eg);
  });

  it('штрафует сдвоенные пешки', () => {
    // Две белые пешки на d-вертикали (d2, d4), нет чёрных пешек на c/d/e.
    const doubled = EnginePosition.fromFen('4k3/8/8/8/3P4/8/3P4/4K3 w - - 0 1');
    // Одна пешка на d2.
    const single = EnginePosition.fromFen('4k3/8/8/8/8/8/3P4/4K3 w - - 0 1');
    // Сравниваем чисто структуру: оба варианта симметричны, но в doubled — две пешки,
    // обе изолированные и сдвоенные. Структурный штраф должен быть строго хуже на пешку.
    const diffMg = evalPawnStructure(doubled).mg - evalPawnStructure(single).mg;
    expect(diffMg).toBeLessThan(0); // штраф за сдвоенные + ещё одна проходная пешка не покрывает
  });

  it('штрафует изолированную пешку', () => {
    // Изолированная белая пешка d4 (нет своих на c/e).
    const isolated = EnginePosition.fromFen('4k3/8/8/8/3P4/8/8/4K3 w - - 0 1');
    // «Связанная» — d4 + e4 (поддерживает соседняя).
    const connected = EnginePosition.fromFen('4k3/8/8/8/3PP3/8/8/4K3 w - - 0 1');
    // У isolated один штраф за isolated, у connected — две пешки без isolated/doubled,
    // но обе проходные → connected лучше по структуре.
    expect(evalPawnStructure(connected).mg).toBeGreaterThan(evalPawnStructure(isolated).mg);
  });

  it('симметричная структура оценивается в 0', () => {
    const p = EnginePosition.fromFen(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    );
    expect(evalPawnStructure(p).mg).toBe(0);
    expect(evalPawnStructure(p).eg).toBe(0);
  });

  it('бонус проходной больше в EG, чем в MG', () => {
    const p = EnginePosition.fromFen('4k3/8/1P6/8/8/8/8/4K3 w - - 0 1');
    const s = evalPawnStructure(p);
    expect(s.eg).toBeGreaterThan(s.mg);
  });
});
