import type { Match, MoveMade } from '@modules/game/domain/game';
import type { Task } from './Task.js';

export type ValidationOutcome =
  | { kind: 'progress'; nextExpectedUci: string | null }
  | { kind: 'wrong-move'; expectedUci: string; actualUci: string }
  | { kind: 'solved' };

const moveUci = (event: MoveMade): string => {
  let uci = event.move.from.algebraic + event.move.to.algebraic;
  if (event.move.promotion) {
    uci += event.move.promotion.charAt(0);
  }
  return uci;
};

export class TaskValidator {
  static validateMatchHistory(task: Task, match: Match): ValidationOutcome {
    const moves: string[] = [];
    for (let i = 1; i <= match.timeline.currentIndex; i++) {
      const event = match.timeline.entryAt(i).events.find(
        (e): e is MoveMade => e.type === 'MoveMade',
      );
      if (event) moves.push(moveUci(event));
    }
    for (let i = 0; i < moves.length; i++) {
      const expected = task.expectedLineUci[i];
      if (expected === undefined) {
        return { kind: 'wrong-move', expectedUci: '(none)', actualUci: moves[i] ?? '' };
      }
      if (expected !== moves[i]) {
        return { kind: 'wrong-move', expectedUci: expected, actualUci: moves[i] ?? '' };
      }
    }
    if (moves.length >= task.expectedLineUci.length) return { kind: 'solved' };
    return {
      kind: 'progress',
      nextExpectedUci: task.expectedLineUci[moves.length] ?? null,
    };
  }
}
