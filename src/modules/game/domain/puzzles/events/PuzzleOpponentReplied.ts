import type { DomainEvent } from '@shared/types/DomainEvent.js';

export class PuzzleOpponentReplied implements DomainEvent {
  readonly type = 'PuzzleOpponentReplied';
  readonly occurredAt = new Date();
  constructor(
    readonly sessionId: string,
    readonly puzzleId: string,
    readonly uci: string,
  ) {}
}
