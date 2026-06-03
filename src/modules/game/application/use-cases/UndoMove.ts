import type {
  MatchRepository,
} from '@modules/game/application/ports/MatchRepository.js';
import type { DomainEvent } from '@shared/types/DomainEvent.js';
import type { EventBus } from '@shared/types/EventBus.js';

export class UndoMoveUseCase {
  constructor(
    private readonly repo: MatchRepository,
    private readonly bus: EventBus,
  ) {}

  execute(matchId: string): DomainEvent[] {
    const match = this.repo.get(matchId);
    const events = match.undo();
    if (events.length > 0) {
      this.repo.save(match);
      for (const event of events) this.bus.publish(event);
    }
    return events;
  }
}
