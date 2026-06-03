/** Управление solution-линиями в редакторе пазлов. CtxRef отделяет side-effects от изменения state. */
import { parseFen } from '@modules/game/application';
import {
  makeLineId,
  type PuzzleEditorState,
  type SolutionLineDraft,
} from './state.js';

export interface LinesCtx {
  state: PuzzleEditorState;
  rebuildBoard: () => void;
}

export function findActiveIndex(state: PuzzleEditorState): number {
  return state.lines.findIndex((l) => l.id === state.activeLineId);
}

export function applyFen(ctx: LinesCtx, fen: string): void {
  const { state } = ctx;
  state.fenError = '';
  try {
    const parsed = parseFen(fen);
    state.fen = parsed.fen;
    state.sideToMove = parsed.sideToMove;
    const fresh: SolutionLineDraft = { id: makeLineId(), moves: [] };
    state.lines = [fresh];
    state.activeLineId = fresh.id;
    state.saved = false;
    ctx.rebuildBoard();
  } catch (e) {
    state.fenError = (e as Error).message;
  }
}

export function toggleTheme(state: PuzzleEditorState, id: string): void {
  state.saved = false;
  const idx = state.themes.indexOf(id);
  if (idx >= 0) state.themes.splice(idx, 1);
  else state.themes.push(id);
}

export function clearActiveLine(ctx: LinesCtx): void {
  const idx = findActiveIndex(ctx.state);
  if (idx < 0) return;
  const current = ctx.state.lines[idx];
  if (!current) return;
  ctx.state.lines[idx] = { id: current.id, moves: [] };
  ctx.state.saved = false;
  ctx.rebuildBoard();
}

export function addLine(ctx: LinesCtx): void {
  const fresh: SolutionLineDraft = { id: makeLineId(), moves: [] };
  ctx.state.lines.push(fresh);
  ctx.state.activeLineId = fresh.id;
  ctx.state.saved = false;
  ctx.rebuildBoard();
}

export function selectLine(ctx: LinesCtx, lineId: string): void {
  if (ctx.state.activeLineId === lineId) return;
  if (!ctx.state.lines.some((l) => l.id === lineId)) return;
  ctx.state.activeLineId = lineId;
  ctx.rebuildBoard();
}

export function deleteLine(ctx: LinesCtx, lineId: string): void {
  if (ctx.state.lines.length <= 1) return;
  const idx = ctx.state.lines.findIndex((l) => l.id === lineId);
  if (idx < 0) return;
  ctx.state.lines.splice(idx, 1);
  ctx.state.saved = false;
  if (ctx.state.activeLineId === lineId) {
    const fallback = ctx.state.lines[Math.max(0, idx - 1)];
    if (fallback) ctx.state.activeLineId = fallback.id;
  }
  ctx.rebuildBoard();
}
