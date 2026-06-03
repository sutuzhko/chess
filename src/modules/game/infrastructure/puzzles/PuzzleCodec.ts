import {
  OBJECTIVE_KIND,
  type ObjectiveKind,
  Puzzle,
  PUZZLE_SOURCE,
  type PuzzleData,
  type PuzzleObjective,
  type PuzzleSource,
} from '@modules/game/domain/puzzles';

const OBJECTIVE_KIND_VALUES: readonly ObjectiveKind[] = Object.values(OBJECTIVE_KIND);

export const PuzzleCodec = {
  parse(raw: unknown, defaultSource: PuzzleSource): Puzzle {
    if (raw === null || typeof raw !== 'object') throw new Error('Invalid puzzle data');
    const obj = raw as Record<string, unknown>;
    if (typeof obj.id !== 'string' || !obj.id) throw new Error('Puzzle.id missing');
    if (typeof obj.fen !== 'string' || !obj.fen) throw new Error('Puzzle.fen missing');
    const side = obj.sideToMove;
    if (side !== 'white' && side !== 'black') {
      throw new Error(`Puzzle.sideToMove invalid: ${String(side)}`);
    }
    const solutions = parseSolutions(obj);
    if (solutions.length === 0) {
      throw new Error(`Puzzle.solutions empty: ${obj.id}`);
    }
    if (!Array.isArray(obj.themes)) throw new Error(`Puzzle.themes invalid: ${obj.id}`);
    if (typeof obj.elo !== 'number') throw new Error(`Puzzle.elo invalid: ${obj.id}`);

    const themes = obj.themes as string[];
    const objective = parseObjective(obj.objective, obj.id) ?? deriveObjectiveFromThemes(themes);

    const data: PuzzleData = {
      id: obj.id,
      fen: obj.fen,
      sideToMove: side,
      solutions,
      themes,
      elo: obj.elo,
      source: (obj.source as PuzzleSource | undefined) ?? defaultSource,
      ...(typeof obj.title === 'string' && obj.title ? { title: obj.title } : {}),
      ...(typeof obj.description === 'string' && obj.description ? { description: obj.description } : {}),
      ...(typeof obj.createdAt === 'string' && obj.createdAt ? { createdAt: obj.createdAt } : {}),
      ...(objective ? { objective } : {}),
    };
    return Puzzle.fromData(data);
  },

  parseList(raw: unknown, defaultSource: PuzzleSource = PUZZLE_SOURCE.bundled): Puzzle[] {
    if (!Array.isArray(raw)) throw new Error('Puzzle list must be an array');
    return raw.map((p) => PuzzleCodec.parse(p, defaultSource));
  },

  serialize(puzzle: Puzzle): PuzzleData {
    return puzzle.toData();
  },
};

function parseObjective(raw: unknown, puzzleId: string): PuzzleObjective | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== 'object') {
    throw new Error(`Puzzle.objective invalid: ${puzzleId}`);
  }
  const o = raw as Record<string, unknown>;
  const kind = o.kind;
  if (typeof kind !== 'string' || !(OBJECTIVE_KIND_VALUES as readonly string[]).includes(kind)) {
    throw new Error(`Puzzle.objective.kind invalid: ${puzzleId}`);
  }
  const moves = o.moves;
  if (typeof moves !== 'number' || !Number.isInteger(moves) || moves < 1) {
    throw new Error(`Puzzle.objective.moves invalid: ${puzzleId}`);
  }
  return { kind: kind as ObjectiveKind, moves };
}

/**
 * Если objective не задан явно — выводим из тем:
 *   - `mate-in-N` (N=1..9) → { kind: 'mate', moves: N }
 *   - `best-move` → { kind: 'best-move', moves: 1 }
 * Это автоматически переводит легаси-задачи bundled-puzzles.json в free-mode,
 * не ломая старый формат данных.
 */
function deriveObjectiveFromThemes(themes: readonly string[]): PuzzleObjective | undefined {
  for (const t of themes) {
    const m = /^mate-in-(\d+)$/.exec(t);
    if (m) {
      const n = Number(m[1]);
      if (Number.isInteger(n) && n >= 1) return { kind: OBJECTIVE_KIND.mate, moves: n };
    }
    if (t === 'best-move') return { kind: OBJECTIVE_KIND.bestMove, moves: 1 };
  }
  return undefined;
}

function parseSolutions(obj: Record<string, unknown>): readonly (readonly string[])[] {
  const raw = obj.solutions ?? obj.solution;
  if (!Array.isArray(raw) || raw.length === 0) return [];
  // Legacy-формат: плоский массив UCI-строк → оборачиваем в одну линию.
  if (raw.every((x): x is string => typeof x === 'string')) {
    return [raw];
  }
  // Текущий формат: массив линий, каждая — массив UCI-строк.
  return raw
    .filter((line): line is string[] => Array.isArray(line) && line.every((x) => typeof x === 'string'))
    .filter((line) => line.length > 0);
}
