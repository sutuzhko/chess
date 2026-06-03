import type { DomainEvent } from '@shared/types/DomainEvent.js';

export class AnalysisCompleted implements DomainEvent {
  readonly type = 'AnalysisCompleted' as const;
  readonly occurredAt: Date;
  constructor(
    readonly matchId: string,
    readonly bestMoveUci: string,
    readonly score: number,
    readonly depth: number,
    readonly nodes: number,
    readonly pv: readonly string[],
    readonly elapsedMs: number,
  ) {
    this.occurredAt = new Date();
  }
}
