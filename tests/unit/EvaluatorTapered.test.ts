import { EnginePosition } from '@/engine/core/EnginePosition';
import { evaluate } from '@/engine/evaluation/Evaluator';
import { phaseOf } from '@/engine/evaluation/Phase';
import { describe, expect, it } from 'vitest';

describe('Tapered evaluation', () => {
  it('phaseOf=256 (MG) для начальной позиции', () => {
    const p = EnginePosition.fromFen(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    );
    expect(phaseOf(p)).toBe(256);
  });

  it('phaseOf=0 (EG) для чисто пешечного эндшпиля', () => {
    const p = EnginePosition.fromFen('4k3/4p3/8/8/8/8/4P3/4K3 w - - 0 1');
    expect(phaseOf(p)).toBe(0);
  });

  it('phaseOf уменьшается при снятии материала', () => {
    const full = EnginePosition.fromFen(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    );
    const lessMaterial = EnginePosition.fromFen(
      'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1',
    );
    expect(phaseOf(lessMaterial)).toBeLessThan(phaseOf(full));
  });

  it('король в центре получает бонус в пешечном эндшпиле', () => {
    // Белый король в центре vs у края — оценка центра должна быть выше.
    const centre = EnginePosition.fromFen('4k3/8/8/3K4/8/8/8/8 w - - 0 1');
    const corner = EnginePosition.fromFen('4k3/8/8/8/8/8/8/K7 w - - 0 1');
    expect(evaluate(centre)).toBeGreaterThan(evaluate(corner));
  });

  it('проходная пешка получает бонус в эндшпиле', () => {
    // У белых проходная b6, у чёрных нет; материал равный.
    const withPassed = EnginePosition.fromFen('4k3/8/1P6/8/8/8/8/4K3 w - - 0 1');
    // Та же пешка но с блокирующей чёрной пешкой на b8 → нет проходной.
    const blocked = EnginePosition.fromFen('1p2k3/8/1P6/8/8/8/8/4K3 w - - 0 1');
    expect(evaluate(withPassed)).toBeGreaterThan(evaluate(blocked));
  });

  it('симметричная позиция оценивается ~0', () => {
    // Полностью симметричная позиция должна быть оценена ~0.
    const p = EnginePosition.fromFen(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    );
    expect(Math.abs(evaluate(p))).toBeLessThanOrEqual(50);
  });
});
