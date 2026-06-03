import type { Color } from '@modules/game/domain/game/value-objects/Color.js';
import type { DomainEvent } from '@shared/types/DomainEvent.js';

export class CheckDeclared implements DomainEvent {
  readonly type = 'CheckDeclared' as const;
  readonly occurredAt: Date;
  constructor(
    readonly matchId: string,
    readonly againstColor: Color,
  ) {
    this.occurredAt = new Date();
  }
}
