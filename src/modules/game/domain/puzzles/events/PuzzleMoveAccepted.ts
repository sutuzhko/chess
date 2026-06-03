import type { DomainEvent } from '@shared/types/DomainEvent.js';

export class PuzzleMoveAccepted implements DomainEvent {
  readonly type = 'PuzzleMoveAccepted';
  readonly occurredAt = new Date();
  constructor(
    readonly sessionId: string,
    readonly puzzleId: string,
    readonly uci: string,
    readonly solutionIndex: number,
  ) {}
}
