import type { BoardSnapshot } from '@modules/game/domain/game/BoardSnapshot.js';
import type { DomainEvent } from '@shared/types/DomainEvent.js';

export class UndoMoveMade implements DomainEvent {
  readonly type = 'UndoMoveMade' as const;
  readonly occurredAt: Date;
  constructor(
    readonly matchId: string,
    readonly restoredSnapshot: BoardSnapshot,
  ) {
    this.occurredAt = new Date();
  }
}
