import type { DomainEvent } from '@shared/types/DomainEvent.js';

export class TaskSolved implements DomainEvent {
  readonly type = 'TaskSolved' as const;
  readonly occurredAt: Date;
  constructor(
    readonly taskId: string,
    readonly attempts: number,
  ) {
    this.occurredAt = new Date();
  }
}
