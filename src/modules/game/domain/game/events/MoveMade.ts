import type { BoardSnapshot } from '@modules/game/domain/game/BoardSnapshot.js';
import type { Move } from '@modules/game/domain/game/value-objects/Move.js';
import type { DomainEvent } from '@shared/types/DomainEvent.js';

export class MoveMade implements DomainEvent {
  readonly type = 'MoveMade' as const;
  readonly occurredAt: Date;
  constructor(
    readonly matchId: string,
    readonly move: Move,
    readonly snapshotBefore: BoardSnapshot,
    readonly snapshotAfter: BoardSnapshot,
  ) {
    this.occurredAt = new Date();
  }
}
