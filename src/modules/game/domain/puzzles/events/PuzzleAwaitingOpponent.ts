import type { DomainEvent } from '@shared/types/DomainEvent.js';

export class PuzzleAwaitingOpponent implements DomainEvent {
  readonly type = 'PuzzleAwaitingOpponent';
  readonly occurredAt = new Date();
  constructor(
    readonly sessionId: string,
    readonly puzzleId: string,
    readonly fen: string,
  ) {}
}
