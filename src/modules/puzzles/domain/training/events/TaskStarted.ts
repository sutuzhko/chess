import type { DomainEvent } from '@shared/types/DomainEvent.js';

export class TaskStarted implements DomainEvent {
  readonly type = 'TaskStarted' as const;
  readonly occurredAt: Date;
  constructor(
    readonly taskId: string,
    readonly matchId: string,
  ) {
    this.occurredAt = new Date();
  }
}
