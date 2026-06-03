/** Mount-логика канваса редактора пазлов: use-cases, BoardController, подписка на ходы. */
import { useBoardTheme } from '@app/features/game/composables/useBoardTheme.js';
import { useSettingsStore } from '@app/stores/settings.js';
import {
  GetLegalMovesUseCase,
  MakeMoveUseCase,
  StartMatchUseCase,
} from '@modules/game/application';
import {
  InMemoryMatchRepository,
} from '@modules/game/infrastructure/persistence/InMemoryMatchRepository.js';
import { BoardController } from '@modules/game/ui/canvas/BoardController.js';
import {
  BoardView,
  preloadPieceImages,
} from '@modules/game/ui/canvas/BoardView.js';
import { InputController } from '@modules/game/ui/canvas/InputController.js';
import { PromotionDialog } from '@modules/game/ui/canvas/PromotionDialog.js';
import { InMemoryEventBus } from '@shared/lib/event-bus/InMemoryEventBus.js';
import { nextTick, type Ref, watch } from 'vue';
import { moveToUci } from './build.js';
import { findActiveIndex } from './lines.js';
import type { PuzzleEditorState } from './state.js';

export const EDITOR_MATCH_ID = '__puzzle_editor__';

export interface EditorRuntime {
  repo: InMemoryMatchRepository;
  bus: InMemoryEventBus;
  startMatch: StartMatchUseCase;
  makeMove: MakeMoveUseCase;
  getLegal: GetLegalMovesUseCase;
  controller: BoardController;
  /** Защита от echo: пока мы сами проигрываем ходы из state, не пишем их обратно. */
  setSuppressRecording: (value: boolean) => void;
}

interface MountArgs {
  state: PuzzleEditorState;
  boardCanvas: Ref<HTMLCanvasElement | null>;
  promotionEl: Ref<HTMLElement | null>;
  activeMoves: () => readonly string[];
  rebuildBoardAfterMount: () => void;
}

export async function mountEditorBoard(args: MountArgs): Promise<EditorRuntime | null> {
  await nextTick();
  const canvas = args.boardCanvas.value;
  const promoNode = args.promotionEl.value;
  if (!canvas || !promoNode) return null;

  const settings = useSettingsStore();

  const repo = new InMemoryMatchRepository();
  const bus = new InMemoryEventBus();
  const startMatch = new StartMatchUseCase(repo);
  const makeMove = new MakeMoveUseCase(repo, bus);
  const getLegal = new GetLegalMovesUseCase(repo);
  startMatch.execute({ matchId: EDITOR_MATCH_ID, fen: args.state.fen });

  const view = new BoardView(canvas);
  const input = new InputController(canvas, view, () => args.state.sideToMove);
  const promo = new PromotionDialog(promoNode);

  const controller = new BoardController({
    boardView: view,
    input,
    bus,
    repo,
    makeMove,
    getLegalMoves: getLegal,
    promo,
    matchId: () => EDITOR_MATCH_ID,
    canvas,
    orientation: () => args.state.sideToMove,
    displayOptions: () => ({
      showCoordinates: settings.gameplay.coordinates,
      showLastMove: settings.gameplay.highlightLastMove,
      showHints: settings.gameplay.hints,
    }),
  });
  controller.mount();
  preloadPieceImages(() => { controller.rerender(); });

  if (args.activeMoves().length > 0) args.rebuildBoardAfterMount();

  let suppressRecording = false;
  bus.subscribe('MoveMade', (event) => {
    if (suppressRecording) return;
    const idx = findActiveIndex(args.state);
    if (idx < 0) return;
    const current = args.state.lines[idx];
    if (!current) return;
    args.state.lines[idx] = {
      id: current.id,
      moves: [...current.moves, moveToUci(event.move)],
    };
    args.state.saved = false;
  });

  // Перерисовываем только при изменении visual-settings; sound/animations redraw не дёргают.
  watch(() => settings.gameplay.coordinates, () => { controller.rerender(); });
  watch(() => settings.gameplay.highlightLastMove, () => { controller.rerender(); });
  watch(() => settings.gameplay.hints, () => { controller.rerender(); });
  useBoardTheme(() => controller);

  return {
    repo, bus, startMatch, makeMove, getLegal, controller,
    setSuppressRecording: (v) => { suppressRecording = v; },
  };
}
