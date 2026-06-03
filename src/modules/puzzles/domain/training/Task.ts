import { BoardSnapshot } from '@modules/game/domain/game';

export type TaskKind = 'mate-in-n' | 'best-move' | 'best-line';

export interface TaskParams {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly kind: TaskKind;
  readonly fen: string;
  readonly expectedLineUci: readonly string[];
  readonly difficulty?: 'easy' | 'medium' | 'hard';
}

export class Task {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly kind: TaskKind;
  readonly initialFen: string;
  readonly expectedLineUci: readonly string[];
  readonly difficulty: 'easy' | 'medium' | 'hard';

  constructor(params: TaskParams) {
    this.id = params.id;
    this.title = params.title;
    this.description = params.description ?? '';
    this.kind = params.kind;
    this.initialFen = params.fen;
    this.expectedLineUci = params.expectedLineUci;
    this.difficulty = params.difficulty ?? 'medium';
    BoardSnapshot.fromFen(params.fen);
  }

  initialSnapshot(): BoardSnapshot {
    return BoardSnapshot.fromFen(this.initialFen);
  }
}
