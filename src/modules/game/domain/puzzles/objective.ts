import type { Match } from '@modules/game/domain/game';

/**
 * Цель решения задачи.
 * Если у задачи задана `objective`, решатель переключается в свободный режим:
 * игрок делает любые легальные ходы, а после каждого хода проверяется,
 * достигнута ли цель. Если за `moves` ходов цель не достигнута — задача
 * провалена.
 */
export const OBJECTIVE_KIND = {
  /** Найти лучший ход. UCI хода должен совпасть с одной из принятых линий. */
  bestMove: 'best-move',
  /** Поставить мат за указанное число ходов решающей стороны. */
  mate: 'mate',
} as const;
export type ObjectiveKind = (typeof OBJECTIVE_KIND)[keyof typeof OBJECTIVE_KIND];

export interface PuzzleObjective {
  readonly kind: ObjectiveKind;
  /** Бюджет: количество ходов решающей стороны. */
  readonly moves: number;
}

export type ObjectiveOutcome = 'reached' | 'failed' | 'continue';

export interface ObjectiveEvaluatorInput {
  readonly match: Match;
  readonly objective: PuzzleObjective;
  /** UCI последнего хода игрока. */
  readonly lastInputUci: string;
  /** Сколько ходов решающей стороны уже сделано (включая последний). */
  readonly solverMoves: number;
  /** Множество принимаемых первых ходов (для `best-move`). UCI. */
  readonly acceptedFirstMoves: ReadonlySet<string>;
}

/**
 * Решает исход хода игрока в свободном режиме:
 * - `reached` — цель достигнута (PuzzleSolved);
 * - `failed`  — бюджет исчерпан, цель не достигнута (PuzzleFailed);
 * - `continue` — продолжаем, ждём ответ оппонента или следующий ход игрока.
 */
export function evaluateObjective(input: ObjectiveEvaluatorInput): ObjectiveOutcome {
  const { match, objective, lastInputUci, solverMoves, acceptedFirstMoves } = input;

  switch (objective.kind) {
    case OBJECTIVE_KIND.mate: {
      if (match.status.kind === 'checkmate') return 'reached';
      if (solverMoves >= objective.moves) return 'failed';
      return 'continue';
    }
    case OBJECTIVE_KIND.bestMove: {
      if (solverMoves === 1 && acceptedFirstMoves.has(lastInputUci)) return 'reached';
      if (solverMoves >= objective.moves) return 'failed';
      return 'continue';
    }
    default:
      return 'continue';
  }
}
