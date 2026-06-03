/** Конфигурация AI-уровней. Подробности по параметрам — docs/codebase/ai-levels.md */

export const AI_LEVEL_MIN = 1;
export const AI_LEVEL_MAX = 20;

export const AI_LEVEL_MARKS = [
  { level: 1,  label: 'Новичок', elo: 400  },
  { level: 2,  label: 'IV разряд', elo: 1000 },
  { level: 5,  label: 'III разряд', elo: 1300 },
  { level: 8, label: 'II разряд', elo: 1600 },
  { level: 13, label: 'I разряд', elo: 1850 },
  { level: 16, label: 'КМС', elo: 2050 },
  { level: 18, label: 'Мастер', elo: 2200 },
  { level: 20, label: 'Международный Мастер', elo: 2200 },
] as const;

export interface AiProfile {
  /** Максимальная глубина alpha-beta. */
  readonly depth: number;
  /** Сколько лучших ходов-кандидатов рассматривается. */
  readonly multiPV: number;
  /** Хаотичность выбора из кандидатов: 0 — детерминированный, выше — случайнее. */
  readonly temperature: number;
  /** Шум оценки в сентипешках, добавляется к eval движка. */
  readonly noiseCP: number;
  /** Вероятность сыграть «разумно, но слабее» — имитация зевка. */
  readonly blunderProb: number;
}

const AI_LEVEL_TABLE: readonly AiProfile[] = [
  { depth: 3, multiPV: 5, temperature: 0, noiseCP: 120, blunderProb: 0.18 }, // 1 Новичок
  { depth: 3, multiPV: 5, temperature: 0, noiseCP: 110, blunderProb: 0.17 }, // 2 IV разряд
  { depth: 3, multiPV: 5, temperature: 0, noiseCP: 100, blunderProb: 0.16 }, // 3 IV разряд
  { depth: 3, multiPV: 5, temperature: 0, noiseCP: 90,  blunderProb: 0.15 }, // 4 IV разряд
  { depth: 4, multiPV: 4, temperature: 0, noiseCP: 80,  blunderProb: 0.13 }, // 5 III разряд
  { depth: 4, multiPV: 4, temperature: 0, noiseCP: 70,  blunderProb: 0.11 }, // 6 III разряд
  { depth: 4, multiPV: 4, temperature: 0, noiseCP: 60,  blunderProb: 0.10 }, // 7 III разряд
  { depth: 5, multiPV: 4, temperature: 0, noiseCP: 50,  blunderProb: 0.08 }, // 8 II разряд
  { depth: 5, multiPV: 2, temperature: 0, noiseCP: 40,  blunderProb: 0.07 }, // 9 II разряд
  { depth: 5, multiPV: 2, temperature: 0, noiseCP: 5,   blunderProb: 0.05 }, // 10 II разряд
  { depth: 6, multiPV: 2, temperature: 0, noiseCP: 0,   blunderProb: 0    }, // 11 II разряд
  { depth: 6, multiPV: 2, temperature: 0, noiseCP: 0,   blunderProb: 0    }, // 12 II разряд
  { depth: 6, multiPV: 1, temperature: 0, noiseCP: 0,   blunderProb: 0    }, // 13 I разряд
  { depth: 6, multiPV: 1, temperature: 0, noiseCP: 0,   blunderProb: 0    }, // 14 I разряд
  { depth: 6, multiPV: 1, temperature: 0, noiseCP: 0,   blunderProb: 0    }, // 15 I разряд
  { depth: 7, multiPV: 1, temperature: 0, noiseCP: 0,   blunderProb: 0    }, // 16 КМС
  { depth: 7, multiPV: 1, temperature: 0, noiseCP: 0,   blunderProb: 0    }, // 17 КМС
  { depth: 8, multiPV: 1, temperature: 0, noiseCP: 0,   blunderProb: 0    }, // 18 Мастер
  { depth: 8, multiPV: 1, temperature: 0, noiseCP: 0,   blunderProb: 0    }, // 19 Мастер
  { depth: 8, multiPV: 1, temperature: 0, noiseCP: 0,   blunderProb: 0    }, // 20 Международный мастер
];

export function getAiProfile(level: number): AiProfile {
  const idx = Math.max(0, Math.min(AI_LEVEL_MAX - 1, level - 1));
  const profile = AI_LEVEL_TABLE[idx];
  if (!profile) throw new Error(`No AI profile for level ${String(level)}`);
  return profile;
}

export function getAiLevelLabel(level: number): string {
  if (level <= 2)  return 'Новичок';
  if (level <= 4)  return 'IV разряд';
  if (level <= 7)  return 'III разряд';
  if (level <= 12) return 'II разряд';
  if (level <= 15) return 'I разряд';
  if (level <= 17) return 'КМС';
  if (level <= 19) return 'Мастер';
  return 'Международный мастер';
}

export function getAiLevelElo(level: number): number {
  const marks = [...AI_LEVEL_MARKS];
  const exact = marks.find((m) => m.level === level);
  if (exact) return exact.elo;
  const lower = marks.filter((m) => m.level <= level).at(-1);
  const upper = marks.find((m) => m.level >= level);
  if (!lower || !upper || lower === upper) return lower?.elo ?? upper?.elo ?? 400;
  const t = (level - lower.level) / (upper.level - lower.level);
  return Math.round(lower.elo + t * (upper.elo - lower.elo));
}
