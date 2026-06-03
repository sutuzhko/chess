import {
  GetPuzzleHintUseCase,
} from '@/modules/game/application/use-cases/GetPuzzleHint';
import {
  ListPuzzlesUseCase,
} from '@/modules/game/application/use-cases/ListPuzzles';
import {
  StartPuzzleSessionUseCase,
} from '@/modules/game/application/use-cases/StartPuzzleSession';
import {
  SubmitPuzzleMoveUseCase,
} from '@/modules/game/application/use-cases/SubmitPuzzleMove';
import { Square } from '@/modules/game/domain/game/value-objects/Square';
import {
  Puzzle,
  PUZZLE_SOURCE,
  PUZZLE_STATUS,
  type PuzzleData,
  SolvingSession,
} from '@/modules/game/domain/puzzles';
import {
  LocalStoragePuzzleRepository,
} from '@/modules/game/infrastructure/puzzles/LocalStoragePuzzleRepository';
import { InMemoryEventBus } from '@/shared/lib/event-bus/InMemoryEventBus';
import type { DomainEvent } from '@/shared/types/DomainEvent';
import { beforeEach, describe, expect, it } from 'vitest';

const sq = Square.fromAlgebraic;

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  
  get length(): number {
    return this.map.size;
  }
  
  clear(): void {
    this.map.clear();
  }
  
  getItem(k: string): string | null {
    return this.map.get(k) ?? null;
  }
  
  key(i: number): string | null {
    return Array.from(this.map.keys())[i] ?? null;
  }
  
  removeItem(k: string): void {
    this.map.delete(k);
  }
  
  setItem(k: string, v: string): void {
    this.map.set(k, v);
  }
}

const matePuzzleData: PuzzleData = {
  id: 'test-mate-1',
  fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1',
  sideToMove: 'white',
  solutions: [['d1d8']],
  themes: ['mate-in-1'],
  elo: 800,
  source: PUZZLE_SOURCE.bundled,
};

const twoMovePuzzle: PuzzleData = {
  id: 'test-2',
  fen: '4k3/8/8/8/8/8/4P3/4K3 w - - 0 1',
  sideToMove: 'white',
  solutions: [['e2e4', 'e8d8', 'e4e5']],
  themes: ['endgame'],
  elo: 800,
  source: PUZZLE_SOURCE.bundled,
};

const multiLinePuzzle: PuzzleData = {
  id: 'test-multi',
  fen: '7k/8/6K1/4P3/8/8/8/8 w - - 0 1',
  sideToMove: 'white',
  solutions: [
    ['e5e6', 'h8g8', 'e6e7', 'g8h8', 'e7e8q'],
    ['g6f6', 'h8h7', 'e5e6', 'h7h8', 'e6e7', 'h8h7', 'e7e8q'],
  ],
  themes: ['endgame', 'promotion'],
  elo: 1400,
  source: PUZZLE_SOURCE.bundled,
};

describe('SolvingSession', () => {
  it('принимает верный ход и помечает solved', () => {
    const puzzle = Puzzle.fromData(matePuzzleData);
    const session = SolvingSession.start(puzzle, 's1');
    const events = session.tryMove({
      from: sq('d1'),
      to: sq('d8'),
    });
    expect(session.status)
      .toBe(PUZZLE_STATUS.solved);
    expect(events.map((e) => e.type))
      .toContain('PuzzleMoveAccepted');
    expect(events.map((e) => e.type))
      .toContain('PuzzleSolved');
  });
  
  it('отвергает неверный ход и помечает failed', () => {
    const puzzle = Puzzle.fromData(matePuzzleData);
    const session = SolvingSession.start(puzzle, 's2');
    const events = session.tryMove({
      from: sq('d1'),
      to: sq('d2'),
    });
    expect(session.status)
      .toBe(PUZZLE_STATUS.failed);
    expect(events.map((e) => e.type))
      .toContain('PuzzleFailed');
  });
  
  it('автоматически играет ответ соперника и продолжает', () => {
    const puzzle = Puzzle.fromData(twoMovePuzzle);
    const session = SolvingSession.start(puzzle, 's3');
    const events = session.tryMove({
      from: sq('e2'),
      to: sq('e4'),
    });
    expect(session.status)
      .toBe(PUZZLE_STATUS.solving);
    expect(events.map((e) => e.type))
      .toContain('PuzzleOpponentReplied');
    // После принятого хода и ответа соперника израсходовано два полухода.
    expect(session.solutionIndex)
      .toBe(2);
  });
  
  it('показывает подсказку без изменения доски', () => {
    const puzzle = Puzzle.fromData(matePuzzleData);
    const session = SolvingSession.start(puzzle, 's4');
    const fenBefore = session.currentSnapshot.toFen();
    const events = session.revealHint();
    expect(events.map((e) => e.type))
      .toContain('PuzzleHintRevealed');
    expect(session.hintsRevealed)
      .toBe(1);
    expect(session.currentSnapshot.toFen())
      .toBe(fenBefore);
  });
  
  it('принимает любой первый ход multi-line задачи', () => {
    const puzzle = Puzzle.fromData(multiLinePuzzle);
    const sA = SolvingSession.start(puzzle, 'mA');
    const evA = sA.tryMove({
      from: sq('e5'),
      to: sq('e6'),
    });
    expect(evA.map((e) => e.type))
      .toContain('PuzzleMoveAccepted');
    expect(sA.status)
      .toBe(PUZZLE_STATUS.solving);
    
    const sB = SolvingSession.start(puzzle, 'mB');
    const evB = sB.tryMove({
      from: sq('g6'),
      to: sq('f6'),
    });
    expect(evB.map((e) => e.type))
      .toContain('PuzzleMoveAccepted');
    expect(sB.status)
      .toBe(PUZZLE_STATUS.solving);
  });
  
  it('отвергает ход, не подходящий ни к одной линии', () => {
    const puzzle = Puzzle.fromData(multiLinePuzzle);
    const session = SolvingSession.start(puzzle, 'mX');
    const ev = session.tryMove({
      from: sq('g6'),
      to: sq('g7'),
    });
    expect(session.status)
      .toBe(PUZZLE_STATUS.failed);
    expect(ev.map((e) => e.type))
      .toContain('PuzzleFailed');
  });
  
  it(
    'эмитит PuzzleAwaitingOpponent в AI-режиме вместо скриптового ответа',
    () => {
      const puzzle = Puzzle.fromData(twoMovePuzzle);
      const session = SolvingSession.start(puzzle, 'ai-1');
      session.setOpponentMode('ai');
      const events = session.tryMove({
        from: sq('e2'),
        to: sq('e4'),
      });
      expect(events.map((e) => e.type))
        .toContain('PuzzleAwaitingOpponent');
      expect(events.map((e) => e.type))
        .not
        .toContain('PuzzleOpponentReplied');
    },
  );
});

describe('SubmitPuzzleMoveUseCase', () => {
  it('публикует domain-события через шину', () => {
    const bus = new InMemoryEventBus();
    const events: DomainEvent[] = [];
    bus.subscribeAll((e) => events.push(e));
    const session = SolvingSession.start(Puzzle.fromData(matePuzzleData), 's5');
    new SubmitPuzzleMoveUseCase(bus).execute({
      session,
      from: sq('d1'),
      to: sq('d8'),
    });
    expect(events.map((e) => e.type))
      .toEqual(
        expect.arrayContaining(['PuzzleMoveAccepted', 'PuzzleSolved']),
      );
  });
});

describe('LocalStoragePuzzleRepository', () => {
  let storage: MemoryStorage;
  let repo: LocalStoragePuzzleRepository;
  
  beforeEach(() => {
    storage = new MemoryStorage();
    repo = new LocalStoragePuzzleRepository(storage);
  });
  
  it('по умолчанию листает bundled задачи', () => {
    const list = new ListPuzzlesUseCase(repo).execute();
    expect(list.length)
      .toBeGreaterThan(0);
    expect(list.every((p) => p.source === 'bundled'))
      .toBe(true);
  });
  
  it('сохраняет и листает custom задачи', () => {
    const data: PuzzleData = {
      ...matePuzzleData,
      id: 'custom-1',
      source: PUZZLE_SOURCE.custom,
    };
    repo.saveCustom(data);
    const list = new ListPuzzlesUseCase(repo).execute({ source: 'custom' });
    expect(list.find((p) => p.id === 'custom-1'))
      .toBeDefined();
  });
  
  it('фильтрует по темам', () => {
    const list = new ListPuzzlesUseCase(repo).execute({ themes: ['mate-in-1'] });
    expect(list.every((p) => p.themes.includes('mate-in-1')))
      .toBe(true);
  });
  
  it('персистит custom задачи в storage', () => {
    const data: PuzzleData = {
      ...matePuzzleData,
      id: 'persist-1',
      source: PUZZLE_SOURCE.custom,
    };
    repo.saveCustom(data);
    const repo2 = new LocalStoragePuzzleRepository(storage);
    expect(repo2.get('persist-1'))
      .not
      .toBeNull();
  });
  
  it('удаляет custom задачи', () => {
    const data: PuzzleData = {
      ...matePuzzleData,
      id: 'del-1',
      source: PUZZLE_SOURCE.custom,
    };
    repo.saveCustom(data);
    repo.deleteCustom('del-1');
    expect(repo.get('del-1'))
      .toBeNull();
  });
});

describe('StartPuzzleSessionUseCase', () => {
  it('стартует сессию для известного puzzle id', () => {
    const storage = new MemoryStorage();
    const repo = new LocalStoragePuzzleRepository(storage);
    const list = new ListPuzzlesUseCase(repo).execute();
    const first = list[0];
    if (!first) throw new Error('No bundled puzzles available');
    const session = new StartPuzzleSessionUseCase(repo).execute({
      puzzleId: first.id,
      sessionId: 'sess-1',
    });
    expect(session.puzzle.id)
      .toBe(first.id);
    expect(session.status)
      .toBe(PUZZLE_STATUS.solving);
  });
  
  it('бросает на неизвестный puzzle id', () => {
    const repo = new LocalStoragePuzzleRepository(new MemoryStorage());
    expect(() => new StartPuzzleSessionUseCase(repo).execute({
      puzzleId: 'does-not-exist', sessionId: 's',
    }))
      .toThrow();
  });
});

describe('GetPuzzleHintUseCase', () => {
  it('публикует PuzzleHintRevealed', () => {
    const bus = new InMemoryEventBus();
    const events: DomainEvent[] = [];
    bus.subscribeAll((e) => events.push(e));
    const session = SolvingSession.start(
      Puzzle.fromData(twoMovePuzzle),
      's-hint',
    );
    new GetPuzzleHintUseCase(bus).execute(session);
    expect(events.map((e) => e.type))
      .toContain('PuzzleHintRevealed');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Свободный режим (objective): best-move + mate
// ──────────────────────────────────────────────────────────────────────────────

const bestMovePuzzle: PuzzleData = {
  id: 'free-bm-1',
  fen: '1k1r4/pp1b1R2/3q2pp/4p3/2B5/4Q3/PPP2B2/2K5 b - - 0 1',
  sideToMove: 'black',
  solutions: [['d6d1']],
  themes: ['best-move'],
  elo: 1800,
  source: PUZZLE_SOURCE.bundled,
  objective: { kind: 'best-move', moves: 1 },
};

const matePuzzleObj: PuzzleData = {
  'id': 'c-mpqz0pr4-ux4a',
  'fen': '5B1R/8/7N/8/8/2b5/p1K5/k7 w - - 0 1',
  'sideToMove': 'white',
  'solutions': [['h6f5', 'c3h8', 'f5g7', 'h8g7', 'f8g7'], ['h6f5', 'c3e1', 'f8g7', 'e1c3', 'g7c3'], ['h6f5', 'c3b2', 'h8h1', 'b2c1', 'h1c1']],
  'themes': ['mate-in-3'],
  'elo': 1900,
  'source': PUZZLE_SOURCE.bundled,
  'createdAt': '2026-05-29T13:41:49.024Z',
  'title': 'Мат в 3 хода',
}

describe('SolvingSession · free-mode (objective)', () => {
  it('best-move: правильный ход — solved за 1 ход', () => {
    const session = SolvingSession.start(
      Puzzle.fromData(bestMovePuzzle),
      's-bm-ok',
    );
    expect(session.isFreeMode)
      .toBe(true);
    const events = session.tryMove({
      from: sq('d6'),
      to: sq('d1'),
    });
    expect(session.status)
      .toBe(PUZZLE_STATUS.solved);
    expect(events.map((e) => e.type))
      .toContain('PuzzleMoveAccepted');
    expect(events.map((e) => e.type))
      .toContain('PuzzleSolved');
    expect(session.solverMoves)
      .toBe(1);
  });
  
  it(
    'best-move: неверный (но легальный) ход — failed после исчерпания бюджета',
    () => {
      const session = SolvingSession.start(
        Puzzle.fromData(bestMovePuzzle),
        's-bm-bad',
      );
      // d6 → c6 — легальный ход ферзём, но не bm
      const events = session.tryMove({
        from: sq('d6'),
        to: sq('c6'),
      });
      expect(session.status)
        .toBe(PUZZLE_STATUS.failed);
      // PuzzleMoveAccepted НЕ должен эмититься на failed-ходе, иначе UI
      // запишет 2 попытки (одну верную, одну неверную).
      expect(events.map((e) => e.type))
        .not
        .toContain('PuzzleMoveAccepted');
      expect(events.map((e) => e.type))
        .toContain('PuzzleFailed');
    },
  );
  
  it('best-move: нелегальный ход — rejected, статус не меняется', () => {
    const session = SolvingSession.start(
      Puzzle.fromData(bestMovePuzzle),
      's-bm-illegal',
    );
    const events = session.tryMove({
      from: sq('a1'),
      to: sq('a2'),
    });
    expect(session.status)
      .toBe(PUZZLE_STATUS.solving);
    expect(events.map((e) => e.type))
      .toContain('PuzzleMoveRejected');
  });
  
  it('mate: ход с матом — solved', () => {
    // Мат-в-3: 1.Nf5 (Bh8) 2.Ng7 (Bxg7) 3.Bxg7#. Чёрные ответы — скриптовые.
    const session = SolvingSession.start(
      Puzzle.fromData(matePuzzleObj),
      's-mate-ok',
    );
    session.tryMove({
      from: sq('h6'),
      to: sq('f5'),
    });
    session.tryMove({
      from: sq('f5'),
      to: sq('g7'),
    });
    const events = session.tryMove({
      from: sq('f8'),
      to: sq('g7'),
    });
    expect(session.status)
      .toBe(PUZZLE_STATUS.solved);
    expect(events.map((e) => e.type))
      .toContain('PuzzleSolved');
  });

  it('currentFen возвращает FEN после ходов', () => {
    const session = SolvingSession.start(
      Puzzle.fromData(matePuzzleObj),
      's-fen',
    );
    const before = session.currentFen;
    session.tryMove({
      from: sq('h6'),
      to: sq('f5'),
    });
    const after = session.currentFen;
    expect(after)
      .not
      .toBe(before);
    // После Nf5 (бел.) сессия проиграет скриптовый ответ чёрных → снова ход белых.
    expect(after.split(/\s+/)[1])
      .toBe('w');
  });
});

describe('SolvePuzzleUseCase', () => {
  it('возвращает pv/scoreCp/mateIn из движка-заглушки', async () => {
    const { SolvePuzzleUseCase } = await import(
      '../../src/modules/game/application/use-cases/SolvePuzzle.js'
      );
    const fakeEngine = {
      analyze: async () => ({
        bestMoveUci: 'd1d8',
        pv: ['d1d8'],
        score: 29999, // > MATE - 100 → срабатывает детектор мата
        nodes: 1,
        elapsedMs: 0,
        depth: 4,
      }),
      cancel: () => {
      },
    };
    const uc = new SolvePuzzleUseCase(fakeEngine);
    const r = await uc.execute({ fen: matePuzzleData.fen, maxDepth: 4 });
    expect(r.bestMoveUci)
      .toBe('d1d8');
    expect(r.pv)
      .toEqual(['d1d8']);
    // 1 полуход до мата → mate-in-1.
    expect(r.mateIn)
      .toBe(1);
    expect(r.depth)
      .toBe(4);
  });
  
  it('mateIn: 7 полуходов до мата = #4 (не #5)', async () => {
    const { SolvePuzzleUseCase } = await import(
      '../../src/modules/game/application/use-cases/SolvePuzzle.js'
      );
    const fakeEngine = {
      analyze: async () => ({
        bestMoveUci: 'e4e5',
        pv: ['e4e5', 'd5d4', 'e5e6', 'd4d3', 'e6e7', 'd3d2', 'e7e8q'],
        score: 30_000 - 7, // 7 полуходов до мата
        nodes: 1,
        elapsedMs: 0,
        depth: 8,
      }),
      cancel: () => {
      },
    };
    const uc = new SolvePuzzleUseCase(fakeEngine);
    const r = await uc.execute({ fen: 'k7/8/8/8/4P3/8/8/4K3 w - - 0 1' });
    // ceil(7/2) = 4
    expect(r.mateIn)
      .toBe(4);
  });
  
  it(
    'achieved=false когда движок нашёл мат глубже бюджета (mate-in-3 puzzle, mate-in-4 PV)',
    async () => {
      const { SolvePuzzleUseCase } = await import(
        '../../src/modules/game/application/use-cases/SolvePuzzle.js'
        );
      const fakeEngine = {
        analyze: async () => ({
          bestMoveUci: 'r1g8',
          pv: ['a1a2', 'b2b3', 'c3c4', 'd4d5', 'e5e6', 'f6f7', 'g7g8q'],
          score: 30_000 - 7, // мат за 4 хода (7 плies)
          nodes: 1,
          elapsedMs: 0,
          depth: 8,
        }),
        cancel: () => {
        },
      };
      const uc = new SolvePuzzleUseCase(fakeEngine);
      const r = await uc.execute({
        fen: 'r6k/8/8/8/8/8/8/4K3 w - - 0 1',
        objective: { kind: 'mate', moves: 3 },
      });
      expect(r.mateIn)
        .toBe(4);
      expect(r.achieved)
        .toBe(false);
      // При achieved=false PV не обрезается по бюджету — показываем целиком.
      expect(r.pv.length)
        .toBe(7);
    },
  );
  
  it(
    'achieved=true когда мат укладывается в бюджет (mate-in-3 puzzle, mate-in-2 PV)',
    async () => {
      const { SolvePuzzleUseCase } = await import(
        '../../src/modules/game/application/use-cases/SolvePuzzle.js'
        );
      const fakeEngine = {
        analyze: async () => ({
          bestMoveUci: 'r1g8',
          pv: ['a1a8', 'b1b8', 'c1c8'],
          score: 30_000 - 3, // мат за 2 хода (3 плies)
          nodes: 1,
          elapsedMs: 0,
          depth: 8,
        }),
        cancel: () => {
        },
      };
      const uc = new SolvePuzzleUseCase(fakeEngine);
      const r = await uc.execute({
        fen: 'r6k/8/8/8/8/8/8/4K3 w - - 0 1',
        objective: { kind: 'mate', moves: 3 },
      });
      expect(r.mateIn)
        .toBe(2);
      expect(r.achieved)
        .toBe(true);
      // 2*3 - 1 = 5 — но у нас всего 3 хода → показывается всё.
      expect(r.pv.length)
        .toBe(3);
    },
  );
});

describe('PuzzleCodec.deriveObjectiveFromThemes', () => {
  it('mate-in-3 тема → objective {mate, 3}', async () => {
    const { PuzzleCodec } = await import(
      '../../src/modules/game/infrastructure/puzzles/PuzzleCodec.js'
      );
    const puzzle = PuzzleCodec.parse({
      id: 'm3',
      fen: '7k/8/6K1/6Q1/8/8/8/8 w - - 0 1',
      sideToMove: 'white',
      solutions: [['g5g8']],
      themes: ['mate-in-3', 'endgame'],
      elo: 1100,
    }, PUZZLE_SOURCE.bundled);
    expect(puzzle.objective)
      .toEqual({ kind: 'mate', moves: 3 });
  });
  
  it('best-move тема → objective {best-move, 1}', async () => {
    const { PuzzleCodec } = await import(
      '../../src/modules/game/infrastructure/puzzles/PuzzleCodec.js'
      );
    const puzzle = PuzzleCodec.parse({
      id: 'bm1',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      sideToMove: 'white',
      solutions: [['e2e4']],
      themes: ['best-move', 'opening'],
      elo: 800,
    }, PUZZLE_SOURCE.bundled);
    expect(puzzle.objective)
      .toEqual({ kind: 'best-move', moves: 1 });
  });
  
  it('явный objective не перезаписывается выводом из тем', async () => {
    const { PuzzleCodec } = await import(
      '../../src/modules/game/infrastructure/puzzles/PuzzleCodec.js'
      );
    const puzzle = PuzzleCodec.parse({
      id: 'ex',
      fen: '7k/8/6K1/6Q1/8/8/8/8 w - - 0 1',
      sideToMove: 'white',
      solutions: [['g5g8']],
      themes: ['mate-in-3'], // тема говорит 3
      objective: { kind: 'mate', moves: 5 }, // а явно задано 5
      elo: 1100,
    }, PUZZLE_SOURCE.bundled);
    expect(puzzle.objective)
      .toEqual({ kind: 'mate', moves: 5 });
  });
});
