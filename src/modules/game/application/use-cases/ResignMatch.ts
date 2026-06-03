import type {
  MatchRepository,
} from '@modules/game/application/ports/MatchRepository.js';
import type { Color } from '@modules/game/domain/game/value-objects/Color.js';
import type { DomainEvent } from '@shared/types/DomainEvent.js';
import type { EventBus } from '@shared/types/EventBus.js';

export class ResignMatchUseCase {
  constructor(
    private readonly repo: MatchRepository,
    private readonly bus: EventBus,
  ) {}

  execute(matchId: string, loser: Color): DomainEvent[] {
    const match = this.repo.get(matchId);
    const events = match.resign(loser);
    this.repo.save(match);
    for (const event of events) this.bus.publish(event);
    return events;
  }
}
