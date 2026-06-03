import {
  ForfeitMatchUseCase,
} from '@/modules/game/application/use-cases/ForfeitMatch';
import {
  GetLegalMovesUseCase,
} from '@/modules/game/application/use-cases/GetLegalMoves';
import { MakeMoveUseCase } from '@/modules/game/application/use-cases/MakeMove';
import { RedoMoveUseCase } from '@/modules/game/application/use-cases/RedoMove';
import {
  ResignMatchUseCase,
} from '@/modules/game/application/use-cases/ResignMatch';
import {
  StartMatchUseCase,
} from '@/modules/game/application/use-cases/StartMatch';
import { UndoMoveUseCase } from '@/modules/game/application/use-cases/UndoMove';
import { Square } from '@/modules/game/domain/game/value-objects/Square';
import {
  InMemoryMatchRepository,
} from '@/modules/game/infrastructure/persistence/InMemoryMatchRepository';
import { InMemoryEventBus } from '@/shared/lib/event-bus/InMemoryEventBus';
import type { DomainEvent } from '@/shared/types/DomainEvent';
import { describe, expect, it } from 'vitest';

const sq = Square.fromAlgebraic;

describe('Use cases', () => {
  it('MakeMove публикует события через шину', () => {
    const repo = new InMemoryMatchRepository();
    const bus = new InMemoryEventBus();
    new StartMatchUseCase(repo).execute({ matchId: 'm' });

    const seen: DomainEvent[] = [];
    bus.subscribeAll((e) => seen.push(e));

    new MakeMoveUseCase(repo, bus).execute({
      matchId: 'm',
      from: sq('e2'),
      to: sq('e4'),
    });

    expect(seen.map((e) => e.type)).toContain('MoveMade');
  });

  it('Undo эмитит UndoMoveMade и восстанавливает снимок', () => {
    const repo = new InMemoryMatchRepository();
    const bus = new InMemoryEventBus();
    new StartMatchUseCase(repo).execute({ matchId: 'm' });
    const before = repo.get('m').currentSnapshot.toFen();

    const seen: DomainEvent[] = [];
    bus.subscribeAll((e) => seen.push(e));

    new MakeMoveUseCase(repo, bus).execute({
      matchId: 'm',
      from: sq('e2'),
      to: sq('e4'),
    });
    new UndoMoveUseCase(repo, bus).execute('m');

    expect(repo.get('m').currentSnapshot.toFen()).toBe(before);
    expect(seen.some((e) => e.type === 'UndoMoveMade')).toBe(true);
  });

  it('StartMatch отвергает дубликат id', () => {
    const repo = new InMemoryMatchRepository();
    const uc = new StartMatchUseCase(repo);
    uc.execute({ matchId: 'm' });
    expect(() => uc.execute({ matchId: 'm' })).toThrow(/already exists/);
  });

  it('GetLegalMoves фильтрует ходы по полю отправления', () => {
    const repo = new InMemoryMatchRepository();
    new StartMatchUseCase(repo).execute({ matchId: 'm' });
    const uc = new GetLegalMovesUseCase(repo);
    const all = uc.execute({ matchId: 'm' });
    const fromE2 = uc.execute({ matchId: 'm', fromSquare: sq('e2') });
    expect(all.length).toBe(20);
    expect(fromE2.length).toBe(2);
    expect(fromE2.every((m) => m.from.equals(sq('e2')))).toBe(true);
  });

  it('Resign публикует MatchEnded через шину', () => {
    const repo = new InMemoryMatchRepository();
    const bus = new InMemoryEventBus();
    new StartMatchUseCase(repo).execute({ matchId: 'm' });
    const seen: DomainEvent[] = [];
    bus.subscribeAll((e) => seen.push(e));
    new ResignMatchUseCase(repo, bus).execute('m', 'white');
    expect(seen.map((e) => e.type)).toContain('MatchEnded');
    expect(repo.get('m').status.kind).toBe('resignation');
  });

  it('Forfeit публикует MatchEnded и фиксирует поражение по времени', () => {
    const repo = new InMemoryMatchRepository();
    const bus = new InMemoryEventBus();
    new StartMatchUseCase(repo).execute({ matchId: 'm' });
    const seen: DomainEvent[] = [];
    bus.subscribeAll((e) => seen.push(e));
    new ForfeitMatchUseCase(repo, bus).execute('m', 'black');
    expect(seen.map((e) => e.type)).toContain('MatchEnded');
    expect(repo.get('m').status).toEqual({ kind: 'time-forfeit', winner: 'white' });
  });

  it('Redo повторяет отменённый ход и эмитит событие', () => {
    const repo = new InMemoryMatchRepository();
    const bus = new InMemoryEventBus();
    new StartMatchUseCase(repo).execute({ matchId: 'm' });
    new MakeMoveUseCase(repo, bus).execute({ matchId: 'm', from: sq('e2'), to: sq('e4') });
    const afterMoveFen = repo.get('m').currentSnapshot.toFen();
    new UndoMoveUseCase(repo, bus).execute('m');

    const seen: DomainEvent[] = [];
    bus.subscribeAll((e) => seen.push(e));
    new RedoMoveUseCase(repo, bus).execute('m');

    expect(repo.get('m').currentSnapshot.toFen()).toBe(afterMoveFen);
    expect(seen.length).toBeGreaterThan(0);
  });

  it('Redo без отменённых ходов не публикует событий', () => {
    const repo = new InMemoryMatchRepository();
    const bus = new InMemoryEventBus();
    new StartMatchUseCase(repo).execute({ matchId: 'm' });
    const seen: DomainEvent[] = [];
    bus.subscribeAll((e) => seen.push(e));
    expect(new RedoMoveUseCase(repo, bus).execute('m')).toEqual([]);
    expect(seen).toHaveLength(0);
  });
});
