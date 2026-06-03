import type {
  PromotionPiece,
} from '@modules/game/domain/game/value-objects/PieceType.js';
import type { Square } from '@modules/game/domain/game/value-objects/Square.js';
import type { DomainEvent } from '@shared/types/DomainEvent.js';

export class PawnPromoted implements DomainEvent {
  readonly type = 'PawnPromoted' as const;
  readonly occurredAt: Date;
  constructor(
    readonly matchId: string,
    readonly square: Square,
    readonly promotedTo: PromotionPiece,
  ) {
    this.occurredAt = new Date();
  }
}
