import type {
  MakeMoveUseCase,
  MatchRepository,
} from '@modules/game/application';
import type { PromotionPiece, Square } from '@modules/game/domain/game';
import type { Task } from '@modules/puzzles/domain/training';
import {
  MoveAttempted,
  TaskSolved,
  TaskValidator,
} from '@modules/puzzles/domain/training';
import type { EventBus } from '@shared/types/EventBus.js';

export interface AttemptTaskMoveInput {
  readonly task: Task;
  readonly matchId: string;
  readonly from: Square;
  readonly to: Square;
  readonly promotion?: PromotionPiece;
}

export class AttemptTaskMoveUseCase {
  private attempts = new Map<string, number>();

  constructor(
    private readonly repo: MatchRepository,
    private readonly bus: EventBus,
    private readonly makeMove: MakeMoveUseCase,
  ) {}

  execute(input: AttemptTaskMoveInput): { correct: boolean; solved: boolean } {
    const beforeIndex = this.repo.get(input.matchId).timeline.currentIndex;
    try {
      this.makeMove.execute({
        matchId: input.matchId,
        from: input.from,
        to: input.to,
        ...(input.promotion ? { promotion: input.promotion } : {}),
      });
    } catch {
      const attempts = (this.attempts.get(input.task.id) ?? 0) + 1;
      this.attempts.set(input.task.id, attempts);
      this.bus.publish(
        new MoveAttempted(
          input.task.id,
          input.from.algebraic + input.to.algebraic,
          false,
          input.task.expectedLineUci[beforeIndex] ?? null,
        ),
      );
      return { correct: false, solved: false };
    }

    const match = this.repo.get(input.matchId);
    const outcome = TaskValidator.validateMatchHistory(input.task, match);

    const attempts = (this.attempts.get(input.task.id) ?? 0) + 1;
    this.attempts.set(input.task.id, attempts);

    if (outcome.kind === 'wrong-move') {
      this.bus.publish(
        new MoveAttempted(input.task.id, outcome.actualUci, false, outcome.expectedUci),
      );
      match.undo();
      this.repo.save(match);
      return { correct: false, solved: false };
    }

    const lastUci = (() => {
      const idx = match.timeline.currentIndex;
      const events = match.timeline.entryAt(idx).events;
      const moveEvent = events.find((e) => e.type === 'MoveMade') as
        | { move: { from: Square; to: Square; promotion: PromotionPiece | null } }
        | undefined;
      if (!moveEvent) return '';
      let uci = moveEvent.move.from.algebraic + moveEvent.move.to.algebraic;
      if (moveEvent.move.promotion) uci += moveEvent.move.promotion.charAt(0);
      return uci;
    })();

    this.bus.publish(new MoveAttempted(input.task.id, lastUci, true, null));

    if (outcome.kind === 'solved') {
      this.bus.publish(new TaskSolved(input.task.id, attempts));
      return { correct: true, solved: true };
    }
    return { correct: true, solved: false };
  }

  resetAttempts(taskId: string): void {
    this.attempts.delete(taskId);
  }
}
