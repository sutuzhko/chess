import type {
  AnalysisProgress,
  EngineAdapter,
} from '@modules/game/application/ports/EngineAdapter.js';
import type { PuzzleObjective } from '@modules/game/domain/puzzles';

/**
 * Граница оценок, после которой score трактуется как форсированный мат.
 * Совпадает с константой `MATE` движка (search/Search.ts).
 */
const MATE_SCORE = 30_000;
const MATE_BAND = 1_000;

export interface SolvePuzzleInput {
  /** FEN стартовой позиции задачи. */
  readonly fen: string;
  /** Цель задачи — задаёт критерий валидации и длину видимого PV. */
  readonly objective?: PuzzleObjective;
  readonly maxDepth?: number;
  readonly maxTimeMs?: number;
}

export interface SolvePuzzleResult {
  /** Принципиальный вариант — последовательность UCI-ходов лучшей линии. */
  readonly pv: readonly string[];
  /** Лучший ход (первый из PV). */
  readonly bestMoveUci: string;
  /** Оценка позиции в сантипешках от лица стороны, которая ходит. */
  readonly scoreCp: number;
  /**
   * Если движок видит форсированный мат — число ходов до мата (всегда
   * положительное). null — мата не видно.
   */
  readonly mateIn: number | null;
  /** Достигнутая глубина анализа. */
  readonly depth: number;
  /**
   * Удовлетворяет ли найденный вариант цели задачи:
   * - null  — у задачи нет objective, проверять нечего;
   * - true  — цель достижима (для mate-in-N: движок видит мат в ≤N ходов);
   * - false — цель НЕ достижима по результатам анализа (мат глубже бюджета,
   *   или для mate-в-N — мата нет; для best-move — всегда true, движок
   *   считает свой ход лучшим).
   */
  readonly achieved: boolean | null;
}

/**
 * Длина видимого варианта PV для данной цели.
 * best-move: первый ход решающей стороны (1 полуход).
 * mate в N: N ходов решающей + N-1 ответов оппонента = 2N-1 полуходов.
 * Без objective: показываем PV целиком.
 */
function pvLengthForObjective(objective: PuzzleObjective | undefined): number | null {
  if (!objective) return null;
  if (objective.kind === 'best-move') return 1;
  // 'mate': N solver moves + (N-1) opponent replies = 2N-1 plies.
  return 2 * objective.moves - 1;
}

/** Проверка, удовлетворяет ли найденный вариант цели задачи. */
function checkAchieved(
  objective: PuzzleObjective | undefined,
  scoreCp: number,
  mateIn: number | null,
): boolean | null {
  if (!objective) return null;
  if (objective.kind === 'best-move') return true;
  // objective.kind === 'mate'
  if (mateIn === null || scoreCp <= 0) return false;
  return mateIn <= objective.moves;
}

/**
 * «Пусть решит ИИ» — движок самостоятельно анализирует позицию задачи и
 * возвращает свой PV + оценку.
 *
 * При `achieved=true` PV обрезается по бюджету `objective`. При
 * `achieved=false` PV показывается целиком, чтобы пользователь видел, что
 * именно нашёл движок (например, мат на ход глубже бюджета).
 */
export class SolvePuzzleUseCase {
  constructor(private readonly engine: EngineAdapter) {}

  async execute(
    input: SolvePuzzleInput,
    onProgress?: (info: AnalysisProgress) => void,
  ): Promise<SolvePuzzleResult> {
    const result = await this.engine.analyze(
      {
        fen: input.fen,
        ...(input.maxDepth !== undefined ? { maxDepth: input.maxDepth } : {}),
        ...(input.maxTimeMs !== undefined ? { maxTimeMs: input.maxTimeMs } : {}),
        multiPV: 1,
      },
      onProgress,
    );

    const abs = Math.abs(result.score);
    // Движок возвращает score = MATE_SCORE - распостояние_в_полуходах.
    // «Мат за N ходов» = N полных ходов мающей стороны = ceil(plies/2).
    const mateIn = abs > MATE_SCORE - MATE_BAND
      ? Math.ceil((MATE_SCORE - abs) / 2)
      : null;

    const achieved = checkAchieved(input.objective, result.score, mateIn);

    // Если цель достигнута — обрезаем PV по бюджету (best-move=1, mate=2N-1).
    // Если НЕ достигнута — показываем полный PV, чтобы было видно, что нашёл движок.
    const cap = achieved === true ? pvLengthForObjective(input.objective) : null;
    const pv = cap !== null ? result.pv.slice(0, cap) : [...result.pv];
    const bestMoveUci = pv[0] ?? result.bestMoveUci;

    return {
      pv,
      bestMoveUci,
      scoreCp: result.score,
      mateIn,
      depth: result.depth,
      achieved,
    };
  }
}
