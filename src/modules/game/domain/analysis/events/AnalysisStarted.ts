import type { DomainEvent } from '@shared/types/DomainEvent.js';

export class AnalysisStarted implements DomainEvent {
  readonly type = 'AnalysisStarted' as const;
  readonly occurredAt: Date;
  constructor(
    readonly matchId: string,
    readonly fen: string,
    readonly maxDepth: number,
  ) {
    this.occurredAt = new Date();
  }
}
