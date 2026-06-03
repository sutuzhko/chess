import { EnginePosition } from '@/engine/core/EnginePosition';
import { Search } from '@/engine/search/Search';
import { describe, expect, it } from 'vitest';

describe('Engine search', () => {
  it('находит mate-in-1', () => {
    const p = EnginePosition.fromFen('6k1/5ppp/8/8/8/8/8/R6K w - - 0 1');
    const result = new Search().search(p, { maxDepth: 3 });
    expect(result.bestUci).toBe('a1a8');
  });

  it('находит лучшее взятие в тактической позиции', () => {
    const p = EnginePosition.fromFen('4k3/8/8/3q4/8/8/3R4/4K3 w - - 0 1');
    const result = new Search().search(p, { maxDepth: 3 });
    expect(result.bestUci).toBe('d2d5');
  });

  it('возвращает легальный ход из начальной позиции', () => {
    const p = EnginePosition.fromFen(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    );
    const result = new Search().search(p, { maxDepth: 3 });
    expect(result.bestUci).toMatch(/^[a-h][1-8][a-h][1-8][qrbn]?$/);
  });

  // Регрессия на C2: iterative deepening не обрывается мгновенно, найдя
  // первый мат — должен продолжить искать ход короче. Здесь у белых есть
  // мат-в-1 (Qg8#), но также мат-в-1 через Qxh7 — обе одинаковой длины.
  // Главное — score соответствует мат-в-1.
  it('находит кратчайший мат через iterative deepening', () => {
    // K на h8, Q на g6, белые: K на f6, Q на a1 — мат в 2 через Qh8# с переходом Q или сразу.
    // Простой кейс: «мат в 1» при глубине 5 (хватит и для мат-в-3).
    const p = EnginePosition.fromFen('6k1/5ppp/8/8/8/8/8/Q6K w - - 0 1');
    const result = new Search().search(p, { maxDepth: 5 });
    expect(result.bestUci).toBe('a1a8');
    // Мат в 1 = 1 полуход → ceil(1/2) = 1. score должен быть ~MATE-1.
    expect(Math.abs(result.score)).toBeGreaterThan(29_000);
  });

  // Регрессия: задача из bundled — мат-в-3 (1.Nf5 …). Раньше движок
  // возвращал мат-в-4 из-за TT mate-distance bug — score-у не корректировали
  // на ply, и стабильный «застывший» mate-in-4 рубил поиск более короткого.
  it('находит mate-in-3 в задаче (Nf5)', () => {
    const p = EnginePosition.fromFen('5B1R/8/7N/8/8/2b5/p1K5/k7 w - - 0 1');
    const result = new Search().search(p, { maxDepth: 12, maxTimeMs: 20_000 });
    // Лучший ход — конь h6→f5 (стартовый ход всех трёх матовых линий).
    expect(result.bestUci).toBe('h6f5');
    // Мат в 3 хода = 5 полуходов → score = MATE - 5 = 29_995.
    // Проверяем именно 5, не 7 (то была бы мат-в-4).
    expect(Math.abs(result.score)).toBe(30_000 - 5);
  });
});
