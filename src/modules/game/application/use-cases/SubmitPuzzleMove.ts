import type { PromotionPiece, Square } from '@modules/game/domain/game';
import type { SolvingSession } from '@modules/game/domain/puzzles';
import type { DomainEvent } from '@shared/types/DomainEvent.js';
import type { EventBus } from '@shared/types/EventBus.js';

export interface SubmitPuzzleMoveInput {
  readonly session: SolvingSession;
  readonly from: Square;
  readonly to: Square;
  readonly promotion?: PromotionPiece;
}

export class SubmitPuzzleMoveUseCase {
  constructor(private readonly bus: EventBus) {}

  execute(input: SubmitPuzzleMoveInput): DomainEvent[] {
    const events = input.session.tryMove({
      from: input.from,
      to: input.to,
      ...(input.promotion ? { promotion: input.promotion } : {}),
    });
    for (const event of events) this.bus.publish(event);
    return events;
  }

  reject(session: SolvingSession, from: Square, to: Square, promotion?: PromotionPiece): void {
    const events = session.rejectAttempt({
      from, to,
      ...(promotion ? { promotion } : {}),
    });
    for (const event of events) this.bus.publish(event);
  }
}
