import type { GameStatus } from '@modules/game/domain/game/GameStatus.js';
import type { DomainEvent } from '@shared/types/DomainEvent.js';

export class MatchEnded implements DomainEvent {
  readonly type = 'MatchEnded' as const;
  readonly occurredAt: Date;
  constructor(
    readonly matchId: string,
    readonly status: GameStatus,
  ) {
    this.occurredAt = new Date();
  }
}
