import { MakeMoveUseCase } from '@/modules/game/application/use-cases/MakeMove';
import {
  StartMatchUseCase,
} from '@/modules/game/application/use-cases/StartMatch';
import { Square } from '@/modules/game/domain/game/value-objects/Square';
import {
  InMemoryMatchRepository,
} from '@/modules/game/infrastructure/persistence/InMemoryMatchRepository';
import {
  AttemptTaskMoveUseCase,
} from '@/modules/puzzles/application/use-cases/AttemptTaskMove';
import { Task } from '@/modules/puzzles/domain/training/Task';
import { InMemoryEventBus } from '@/shared/lib/event-bus/InMemoryEventBus';
import { describe, expect, it } from 'vitest';

const sq = Square.fromAlgebraic;

describe('Training', () => {
  it('отмечает верный ход как solved для one-move задачи', () => {
    const repo = new InMemoryMatchRepository();
    const bus = new InMemoryEventBus();
    const task = new Task({
      id: 't1',
      title: 'Mate in 1',
      kind: 'mate-in-n',
      fen: '6k1/5ppp/8/8/8/8/8/R6K w - - 0 1',
      expectedLineUci: ['a1a8'],
    });
    new StartMatchUseCase(repo).execute({ matchId: 'm', fen: task.initialFen });

    const events: string[] = [];
    bus.subscribeAll((e) => events.push(e.type));

    const result = new AttemptTaskMoveUseCase(repo, bus, new MakeMoveUseCase(repo, bus)).execute({
      task,
      matchId: 'm',
      from: sq('a1'),
      to: sq('a8'),
    });

    expect(result.solved).toBe(true);
    expect(events).toContain('TaskSolved');
  });

  it('отвергает неверный ход и сохраняет состояние', () => {
    const repo = new InMemoryMatchRepository();
    const bus = new InMemoryEventBus();
    const task = new Task({
      id: 't1',
      title: 'Mate in 1',
      kind: 'mate-in-n',
      fen: '6k1/5ppp/8/8/8/8/8/R6K w - - 0 1',
      expectedLineUci: ['a1a8'],
    });
    new StartMatchUseCase(repo).execute({ matchId: 'm', fen: task.initialFen });

    const result = new AttemptTaskMoveUseCase(repo, bus, new MakeMoveUseCase(repo, bus)).execute({
      task,
      matchId: 'm',
      from: sq('a1'),
      to: sq('a4'),
    });

    expect(result.correct).toBe(false);
    expect(repo.get('m').currentSnapshot.toFen()).toBe(task.initialFen);
  });
});
