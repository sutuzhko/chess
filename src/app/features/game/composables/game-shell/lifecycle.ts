import { useBoardTheme } from '@app/features/game/composables/useBoardTheme.js';
import { parseTimeControl } from '@app/features/game/config/time-controls.js';
import { BoardController } from '@modules/game/ui/canvas/BoardController.js';
import { preloadPieceImages } from '@modules/game/ui/canvas/BoardView.js';
import { PromotionDialog } from '@modules/game/ui/canvas/PromotionDialog.js';
import { watch } from 'vue';
import { doReset } from './actions.js';
import { setupBusSubscriptions } from './bus-handlers.js';
import { initializeInfra } from './infra-init.js';
import {
  applyConfigToUi,
  persistMatchConfig,
  saveClockStandard,
  saveShvedkiClocks,
  saveShvedkiState,
  TRAINING_MODE_BADGE,
} from './persistence.js';
import { enterShvedkiMode, tryRestoreShvedki } from './shvedki-mode.js';
import { aiSide, maybeRunAi } from './standard-ai.js';
import type { ShellCtx } from './types.js';
import { recomputePlayerColor, updateUi } from './ui-display.js';

interface MountOptions {
  routeMatchId: string | null;
}

function applyLobbyConfig(ctx: ShellCtx): void {
  const { stores, infra, mut, ui, form } = ctx;
  if (stores.gameStore.newGamePending) {
    const cfg = stores.gameStore.lobbyConfig;
    if (cfg.opponent === 'hotseat') {
      form.aiSideValue.value = 'off';
    } else {
      form.aiSideValue.value = cfg.side === 'white' ? 'black' : 'white';
      ui.orientation = cfg.side === 'black' ? 'black' : 'white';
    }
    recomputePlayerColor(ctx);
    form.aiDepthValue.value = cfg.aiLevel;
    if (cfg.mode === 'opening_training') {
      // Тренировка дебютов играется на стандартной доске; отличается только идентичность конфига.
      ui.gameMode = 'standard';
      ui.isTraining = true;
      ui.startFen = cfg.startFen ?? '';
      ui.openingName = cfg.openingName ?? null;
      ui.modeBadge = TRAINING_MODE_BADGE;
    } else {
      ui.gameMode = cfg.mode;
      ui.isTraining = false;
      ui.startFen = cfg.mode === 'standard' ? (cfg.startFen ?? '') : '';
      ui.openingName = null;
    }
    const { initialSeconds, incrementSeconds } = cfg.time;
    form.selectedTimeControl.value = initialSeconds === 0
      ? '0_0'
      : `${String(initialSeconds)}_${String(incrementSeconds)}`;
    if (infra.repo.has(mut.matchId)) infra.repo.delete(mut.matchId);
    infra.configStore.delete(mut.matchId);
    infra.shvedkiStore.delete(mut.matchId);
    infra.clockStore.delete(mut.matchId);
    stores.gameStore.setNewGamePending(false);
    persistMatchConfig(ctx);
  } else {
    const saved = infra.configStore.load(mut.matchId);
    if (saved) applyConfigToUi(ctx, saved);
  }
  infra.clock.reset(parseTimeControl(form.selectedTimeControl.value));
}

function createBoardController(ctx: ShellCtx, canvasA: HTMLCanvasElement, promo: PromotionDialog): BoardController {
  const { infra, mut, ui, stores } = ctx;
  return new BoardController({
    boardView: infra.boardView,
    input: infra.inputA,
    bus: infra.bus,
    repo: infra.repo,
    makeMove: infra.makeMove,
    getLegalMoves: infra.getLegalMoves,
    promo,
    matchId: () => mut.matchId,
    canvas: canvasA,
    orientation: () => ui.orientation,
    canInteract: () => !mut.aiBusy,
    aiSide: () => aiSide(ctx),
    displayOptions: () => ({
      showCoordinates: stores.settings.gameplay.coordinates,
      showLastMove: stores.settings.gameplay.highlightLastMove,
      showHints: stores.settings.gameplay.hints,
    }),
  });
}

export function mountShell(ctx: ShellCtx, opts: MountOptions): void {
  const { refs, stores, infra, mut, ui } = ctx;
  if (!opts.routeMatchId) {
    void stores.router.replace(`/game/${mut.matchId}`);
  }
  const canvasA = refs.boardCanvasA.value;
  const promoNode = refs.promotionEl.value;
  const overlayNode = refs.devOverlayEl.value;
  const notifNode = refs.notificationEl.value;
  const listNode = refs.moveListEl.value;
  if (!canvasA || !promoNode || !overlayNode || !notifNode || !listNode) {
    throw new Error('Required DOM refs are missing on mount — check template bindings');
  }

  initializeInfra(ctx, canvasA, overlayNode, notifNode, listNode);
  applyLobbyConfig(ctx);

  if (!infra.repo.has(mut.matchId)) {
    infra.startMatch.execute({
      matchId: mut.matchId,
      ...(ui.startFen ? { fen: ui.startFen } : {}),
    });
  }

  const promo = new PromotionDialog(promoNode);
  const savedStdClock = infra.clockStore.loadStandard(mut.matchId);
  if (savedStdClock && !infra.clock.isUnlimited) {
    infra.clock.restore(savedStdClock);
    if (savedStdClock.active) mut.clockStarted = true;
  }

  const ctrl = createBoardController(ctx, canvasA, promo);
  mut.boardController = ctrl;

  // Гранулярные watch-и: перерисовываем только при изменениях, влияющих на отрисовку
  // (тема, координаты, подсветка, подсказки). sound/animations redraw не дёргают.
  const rerenderBoard = (): void => {
    mut.boardController?.rerender();
    mut.shvedkiController?.rerender();
  };
  watch(() => stores.settings.gameplay.coordinates, rerenderBoard);
  watch(() => stores.settings.gameplay.highlightLastMove, rerenderBoard);
  watch(() => stores.settings.gameplay.hints, rerenderBoard);
  useBoardTheme(() => ({
    rerender: (): void => {
      mut.boardController?.rerender();
      mut.shvedkiController?.rerender();
    },
  }));

  setupBusSubscriptions(ctx);

  infra.notification.onNewGame(() => {
    // В шведках кнопка модалки должна полностью переинициализировать партию,
    // как «+ Новая» в сайдбаре. Иначе resetMatch (стандарт) ничего не делает
    // с shvedkiController.
    doReset(ctx);
  });

  ctrl.mount();
  preloadPieceImages(() => {
    if (mut.shvedkiController) mut.shvedkiController.rerender();
    else ctrl.rerender();
  });

  recomputePlayerColor(ctx);

  if (ui.gameMode === 'shvedki') {
    void enterShvedkiMode(ctx).then(() => { tryRestoreShvedki(ctx); });
  }

  mut.pageHideHandler = (): void => {
    if (ui.gameMode === 'shvedki') {
      saveShvedkiState(ctx);
      saveShvedkiClocks(ctx);
    } else {
      saveClockStandard(ctx);
    }
  };
  window.addEventListener('pagehide', mut.pageHideHandler);

  watch(
    () => ({ status: ui.status, modeBadge: ui.modeBadge, timeBadge: ui.timeBadge }),
    (v) => { stores.headerStore.setGameInfo(v); },
    { immediate: true },
  );

  updateUi(ctx);
  void maybeRunAi(ctx);
}

export function unmountShell(ctx: ShellCtx): void {
  const { stores, infra, mut, ui } = ctx;
  stores.headerStore.clearGameInfo();
  if (ui.gameMode === 'shvedki') {
    saveShvedkiState(ctx);
    saveShvedkiClocks(ctx);
  } else {
    saveClockStandard(ctx);
  }
  infra.clock.stop();
  mut.clockA?.stop();
  mut.clockB?.stop();
  infra.engine.cancel();
  mut.boardController?.detach();
  mut.shvedkiController?.detach();
  if (mut.pageHideHandler) {
    window.removeEventListener('pagehide', mut.pageHideHandler);
    mut.pageHideHandler = null;
  }
}
