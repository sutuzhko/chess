import type { DomainEvent } from '@shared/types/DomainEvent.js';

export class PuzzleHintRevealed implements DomainEvent {
  readonly type = 'PuzzleHintRevealed';
  readonly occurredAt = new Date();
  constructor(
    readonly sessionId: string,
    readonly puzzleId: string,
    readonly nextUci: string,
    readonly hintsRevealed: number,
  ) {}
}
