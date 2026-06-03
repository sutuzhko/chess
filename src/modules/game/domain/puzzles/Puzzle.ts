import type { Color } from '@modules/game/domain/game';
import type { PuzzleObjective } from './objective.js';

export const PUZZLE_SOURCE = {
  bundled: 'bundled',
  custom: 'custom',
} as const;
export type PuzzleSource = (typeof PUZZLE_SOURCE)[keyof typeof PUZZLE_SOURCE];

export type SolutionLine = readonly string[];

export interface PuzzleData {
  readonly id: string;
  readonly fen: string;
  readonly sideToMove: Color;
  readonly solutions: readonly SolutionLine[];
  readonly themes: readonly string[];
  readonly elo: number;
  readonly source: PuzzleSource;
  readonly title?: string;
  readonly description?: string;
  readonly createdAt?: string;
  /**
   * Если задано — задача решается в свободном режиме:
   * любой легальный ход принимается, цель проверяется после каждого хода
   * решающей стороны; если за `objective.moves` ходов не достигнута — провал.
   * Если не задано — старое поведение (скриптовая сверка по solutions).
   */
  readonly objective?: PuzzleObjective;
}

export class Puzzle {
  private constructor(
    private readonly data: PuzzleData,
    private readonly _mainLine: SolutionLine,
  ) {}

  static fromData(data: PuzzleData): Puzzle {
    const [first, ...rest] = data.solutions;
    if (!first) {
      throw new Error(`Puzzle ${data.id} has no solution lines`);
    }
    for (const line of [first, ...rest]) {
      if (line.length === 0) {
        throw new Error(`Puzzle ${data.id} has empty solution line`);
      }
    }
    return new Puzzle(data, first);
  }

  get id(): string { return this.data.id; }
  get fen(): string { return this.data.fen; }
  get sideToMove(): Color { return this.data.sideToMove; }
  get solutions(): readonly SolutionLine[] { return this.data.solutions; }
  get mainLine(): SolutionLine { return this._mainLine; }
  get themes(): readonly string[] { return this.data.themes; }
  get elo(): number { return this.data.elo; }
  get source(): PuzzleSource { return this.data.source; }
  get title(): string | undefined { return this.data.title; }
  get description(): string | undefined { return this.data.description; }
  get createdAt(): string | undefined { return this.data.createdAt; }
  get objective(): PuzzleObjective | undefined { return this.data.objective; }

  toData(): PuzzleData { return this.data; }
}
