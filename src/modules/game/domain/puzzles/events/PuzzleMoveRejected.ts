import type { DomainEvent } from '@shared/types/DomainEvent.js';

export class PuzzleMoveRejected implements DomainEvent {
  readonly type = 'PuzzleMoveRejected';
  readonly occurredAt = new Date();
  constructor(
    readonly sessionId: string,
    readonly puzzleId: string,
    readonly attemptedUci: string,
  ) {}
}
