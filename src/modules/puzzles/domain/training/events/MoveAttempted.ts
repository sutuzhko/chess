import type { DomainEvent } from '@shared/types/DomainEvent.js';

export class MoveAttempted implements DomainEvent {
  readonly type = 'MoveAttempted' as const;
  readonly occurredAt: Date;
  constructor(
    readonly taskId: string,
    readonly attemptedUci: string,
    readonly correct: boolean,
    readonly expectedUci: string | null,
  ) {
    this.occurredAt = new Date();
  }
}
