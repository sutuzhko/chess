import type { DomainEvent } from '@shared/types/DomainEvent.js';

export class PuzzleFailed implements DomainEvent {
  readonly type = 'PuzzleFailed';
  readonly occurredAt = new Date();
  constructor(
    readonly sessionId: string,
    readonly puzzleId: string,
    readonly expectedUci: string,
    readonly attemptedUci: string,
  ) {}
}
