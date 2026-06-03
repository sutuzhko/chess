/** Сборка PuzzleData из состояния редактора + утилита moveToUci. */
import type { Move } from '@modules/game/domain/game';
import type { PuzzleData } from '@modules/game/domain/puzzles';
import {
  generatePuzzleId,
  PUZZLE_SOURCE,
  type PuzzleEditorState,
} from './state.js';

const PROMO_MAP: Record<string, string> = {
  queen: 'q', rook: 'r', bishop: 'b', knight: 'n',
};

export function moveToUci(m: Move): string {
  const promo = m.promotion ? PROMO_MAP[m.promotion] ?? '' : '';
  return `${m.from.algebraic}${m.to.algebraic}${promo}`;
}

export function buildPuzzle(state: PuzzleEditorState): PuzzleData | null {
  if (state.fenError) return null;
  if (!state.fen.trim()) return null;
  const solutions = state.lines
    .map((l) => [...l.moves])
    .filter((moves) => moves.length > 0);
  if (solutions.length === 0) return null;
  const title = state.title.trim();
  const description = state.description.trim();
  const id = state.editingId || generatePuzzleId();
  const createdAt = state.createdAt || new Date().toISOString();
  return {
    id,
    fen: state.fen,
    sideToMove: state.sideToMove,
    solutions,
    themes: [...state.themes],
    elo: state.elo,
    source: PUZZLE_SOURCE.custom,
    createdAt,
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(state.objective ? { objective: state.objective } : {}),
  };
}
