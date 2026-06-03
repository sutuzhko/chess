/** Начальное состояние редактора пазлов и типы. Отдельный файл — изоляция fen-парсинга и initial-state. */
import { parseFen, PUZZLE_SOURCE } from '@modules/game/application';
import type { PuzzleData, PuzzleObjective } from '@modules/game/domain/puzzles';
import { reactive } from 'vue';

export interface SolutionLineDraft {
  readonly id: string;
  readonly moves: readonly string[];
}

export interface PuzzleEditorState {
  fen: string;
  fenError: string;
  title: string;
  description: string;
  themes: string[];
  elo: number;
  sideToMove: 'white' | 'black';
  lines: SolutionLineDraft[];
  activeLineId: string;
  saved: boolean;
  editingId: string;
  createdAt: string;
  /** Цель задачи. null/'none' — обычное скриптовое поведение (сверка по линиям). */
  objective: PuzzleObjective | null;
}

export interface PuzzleEditorOptions {
  readonly initialFen?: string;
  readonly initialPuzzle?: PuzzleData;
}

const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export function makeLineId(): string {
  return `line-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function generatePuzzleId(): string {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 6);
  return `c-${ts}-${rnd}`;
}

export { PUZZLE_SOURCE };

export function createInitialState(options?: PuzzleEditorOptions): PuzzleEditorState {
  const initialPuzzle = options?.initialPuzzle;
  const initialFen = options?.initialFen;

  let startingFen = DEFAULT_FEN;
  let startingSide: 'white' | 'black' = 'white';
  let lines: SolutionLineDraft[] = [{ id: makeLineId(), moves: [] }];
  let themes: string[] = [];
  let elo = 1200;
  let title = '';
  let description = '';
  let editingId = '';
  let createdAt = '';
  let objective: PuzzleObjective | null = null;

  if (initialPuzzle) {
    try {
      const parsed = parseFen(initialPuzzle.fen);
      startingFen = parsed.fen;
      startingSide = parsed.sideToMove;
    } catch {
      startingFen = initialPuzzle.fen;
      startingSide = initialPuzzle.sideToMove;
    }
    const drafts = initialPuzzle.solutions.map<SolutionLineDraft>((moves) => ({
      id: makeLineId(),
      moves: [...moves],
    }));
    if (drafts.length > 0) lines = drafts;
    themes = [...initialPuzzle.themes];
    elo = initialPuzzle.elo;
    title = initialPuzzle.title ?? '';
    description = initialPuzzle.description ?? '';
    editingId = initialPuzzle.id;
    createdAt = initialPuzzle.createdAt ?? '';
    objective = initialPuzzle.objective ?? null;
  } else if (initialFen?.trim()) {
    try {
      const parsed = parseFen(initialFen);
      startingFen = parsed.fen;
      startingSide = parsed.sideToMove;
    } catch { /* fall back to default */ }
  }

  const firstLine = lines[0] ?? { id: makeLineId(), moves: [] };
  return reactive<PuzzleEditorState>({
    fen: startingFen,
    fenError: '',
    title,
    description,
    themes,
    elo,
    sideToMove: startingSide,
    lines,
    activeLineId: firstLine.id,
    saved: false,
    editingId,
    createdAt,
    objective,
  });
}
