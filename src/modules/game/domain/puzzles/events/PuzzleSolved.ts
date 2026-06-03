import type { DomainEvent } from '@shared/types/DomainEvent.js';

export class PuzzleSolved implements DomainEvent {
  readonly type = 'PuzzleSolved';
  readonly occurredAt = new Date();
  constructor(
    readonly sessionId: string,
    readonly puzzleId: string,
    readonly hintsRevealed: number,
  ) {}
}
