import type {
  MatchRepository,
} from '@modules/game/application/ports/MatchRepository.js';
import type {
  PromotionPiece,
} from '@modules/game/domain/game/value-objects/PieceType.js';
import type { Square } from '@modules/game/domain/game/value-objects/Square.js';
import type { DomainEvent } from '@shared/types/DomainEvent.js';
import type { EventBus } from '@shared/types/EventBus.js';

export interface MakeMoveInput {
  readonly matchId: string;
  readonly from: Square;
  readonly to: Square;
  readonly promotion?: PromotionPiece;
}

export class MakeMoveUseCase {
  constructor(
    private readonly repo: MatchRepository,
    private readonly bus: EventBus,
  ) {}

  execute(input: MakeMoveInput): DomainEvent[] {
    const match = this.repo.get(input.matchId);
    const events = match.applyMove({
      from: input.from,
      to: input.to,
      ...(input.promotion ? { promotion: input.promotion } : {}),
    });
    this.repo.save(match);
    for (const event of events) this.bus.publish(event);
    return events;
  }
}
