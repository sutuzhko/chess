import { parseUci } from '@modules/game/application/uci.js';
import type { PuzzleData } from '@modules/game/domain/puzzles';
import { computed, type ComputedRef, onMounted, onUnmounted, ref } from 'vue';
import {
  EDITOR_MATCH_ID,
  type EditorRuntime,
  mountEditorBoard,
} from './puzzle-editor/board-mount.js';
import { buildPuzzle as buildPuzzleImpl } from './puzzle-editor/build.js';
import {
  addLine as addLineImpl,
  applyFen as applyFenImpl,
  clearActiveLine as clearActiveLineImpl,
  deleteLine as deleteLineImpl,
  selectLine as selectLineImpl,
  toggleTheme as toggleThemeImpl,
} from './puzzle-editor/lines.js';
import {
  createInitialState,
  generatePuzzleId,
  type PuzzleEditorOptions,
  type PuzzleEditorState,
} from './puzzle-editor/state.js';

export type { PuzzleEditorState, SolutionLineDraft } from './puzzle-editor/state.js';

export interface UsePuzzleEditor {
  boardCanvas: ReturnType<typeof ref<HTMLCanvasElement | null>>;
  promotionEl: ReturnType<typeof ref<HTMLElement | null>>;
  state: PuzzleEditorState;
  activeMoves: ComputedRef<readonly string[]>;
  isEditing: ComputedRef<boolean>;
  applyFen: (fen: string) => void;
  toggleTheme: (id: string) => void;
  clearActiveLine: () => void;
  addLine: () => void;
  selectLine: (lineId: string) => void;
  deleteLine: (lineId: string) => void;
  buildPuzzle: () => PuzzleData | null;
  generateId: () => string;
  resetSaved: () => void;
}

export function usePuzzleEditor(options?: PuzzleEditorOptions): UsePuzzleEditor {
  const boardCanvas = ref<HTMLCanvasElement | null>(null);
  const promotionEl = ref<HTMLElement | null>(null);

  const state = createInitialState(options);
  const isEditing = computed<boolean>(() => state.editingId.length > 0);
  const activeMoves = computed<readonly string[]>(() => {
    const line = state.lines.find((l) => l.id === state.activeLineId);
    return line?.moves ?? [];
  });

  let runtime: EditorRuntime | null = null;

  function rebuildBoardFromActive(): void {
    if (!runtime) return;
    const { repo, startMatch, makeMove, controller, setSuppressRecording } = runtime;
    if (repo.has(EDITOR_MATCH_ID)) repo.delete(EDITOR_MATCH_ID);
    startMatch.execute({ matchId: EDITOR_MATCH_ID, fen: state.fen });
    setSuppressRecording(true);
    try {
      for (const uci of activeMoves.value) {
        const m = parseUci(uci);
        makeMove.execute({
          matchId: EDITOR_MATCH_ID,
          from: m.from,
          to: m.to,
          ...(m.promotion ? { promotion: m.promotion } : {}),
        });
      }
    } finally {
      setSuppressRecording(false);
    }
    controller.reset();
  }

  const linesCtx = { state, rebuildBoard: rebuildBoardFromActive };

  onMounted(async () => {
    runtime = await mountEditorBoard({
      state,
      boardCanvas,
      promotionEl,
      activeMoves: () => activeMoves.value,
      rebuildBoardAfterMount: rebuildBoardFromActive,
    });
  });

  onUnmounted(() => {
    runtime?.controller.detach();
    runtime = null;
  });

  return {
    boardCanvas,
    promotionEl,
    state,
    activeMoves,
    isEditing,
    applyFen: (fen) => { applyFenImpl(linesCtx, fen); },
    toggleTheme: (id) => { toggleThemeImpl(state, id); },
    clearActiveLine: () => { clearActiveLineImpl(linesCtx); },
    addLine: () => { addLineImpl(linesCtx); },
    selectLine: (id) => { selectLineImpl(linesCtx, id); },
    deleteLine: (id) => { deleteLineImpl(linesCtx, id); },
    buildPuzzle: () => buildPuzzleImpl(state),
    generateId: generatePuzzleId,
    resetSaved: () => { state.saved = false; },
  };
}
