import type { DomainEvent } from '@shared/types/DomainEvent.js';

export class EvaluationUpdated implements DomainEvent {
  readonly type = 'EvaluationUpdated' as const;
  readonly occurredAt: Date;
  constructor(
    readonly matchId: string,
    readonly depth: number,
    readonly score: number,
    readonly bestMoveUci: string | null,
    readonly nodes: number,
    readonly pv: readonly string[],
  ) {
    this.occurredAt = new Date();
  }
}
