import type { SolvingSession } from '@modules/game/domain/puzzles';
import type { DomainEvent } from '@shared/types/DomainEvent.js';
import type { EventBus } from '@shared/types/EventBus.js';

export class GetPuzzleHintUseCase {
  constructor(private readonly bus: EventBus) {}

  execute(session: SolvingSession): DomainEvent[] {
    const events = session.revealHint();
    for (const event of events) this.bus.publish(event);
    return events;
  }
}
