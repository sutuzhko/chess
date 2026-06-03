import { parseTimeControl } from '@app/features/game/config/time-controls.js';
import {
  buildCapturedDisplay,
  EMPTY_CAPTURED,
} from '@app/features/game/utils/capture-utils.js';
import { i18n } from '@app/shared/i18n';
import type { Color } from '@modules/game/domain/game';
import { BoardView } from '@modules/game/ui/canvas/BoardView.js';
import { InputController } from '@modules/game/ui/canvas/InputController.js';
import type {
  ShvedkiEndReason,
  ShvedkiGameResult,
} from '@modules/game/ui/canvas/ShvedkiBoardController.js';
import {
  ShvedkiBoardController,
} from '@modules/game/ui/canvas/ShvedkiBoardController.js';
import { GameClock } from '@modules/game/ui/clock/GameClock.js';
import { TOAST_DURATION_MS } from '@shared/config/notification-durations.js';
import {
  NotificationOverlay,
} from '@shared/ui/notifications/NotificationOverlay.js';
import { nextTick } from 'vue';
import { saveShvedkiClocks, saveShvedkiState } from './persistence.js';
import { aiColorOnBoard, maybeRunShvedkiAiForBoard } from './shvedki-ai.js';
import type { ShellCtx } from './types.js';
import {
  playGameSound,
  updateClockDisplay,
  updateShvedkiClockDisplay,
  updateUi,
} from './ui-display.js';

const t = i18n.global.t.bind(i18n.global);

/** Заголовок и тело модалки «Конец игры» для шведок. */
function buildShvedkiGameOverMessage(
  result: ShvedkiGameResult,
  reason: ShvedkiEndReason,
): { title: string; body: string } {
  const title =
    result === 'team-1-wins' ? t('game.shvedki.team1Won')
    : result === 'team-2-wins' ? t('game.shvedki.team2Won')
    : t('game.shvedki.drawTitle');
  // Проигравшая команда — для resign/time.
  const losingTeam: 1 | 2 = result === 'team-1-wins' ? 2 : 1;
  const body =
    reason === 'mate' ? t('game.shvedki.reasonMate')
    : reason === 'resign' ? t('game.shvedki.reasonResign', { team: losingTeam })
    : reason === 'time' ? t('game.shvedki.reasonTime', { team: losingTeam })
    : t('game.shvedki.reasonDraw');
  return { title, body };
}

function showShvedkiGameOver(
  ctx: ShellCtx,
  result: ShvedkiGameResult,
  reason: ShvedkiEndReason,
): void {
  const msg = buildShvedkiGameOverMessage(result, reason);
  ctx.ui.status = msg.title;
  if (reason === 'mate') playGameSound(ctx, 'mate');
  // Лёгкая задержка, чтобы анимация последнего хода успела показаться.
  setTimeout(() => { ctx.infra.notification.show(msg); }, 300);
}

function renderShvedkiMoveListInto(
  el: HTMLElement | null,
  moves: { color: Color; san: string }[],
): void {
  if (!el) return;
  interface Row { num: number; w: string; b: string }
  const rows: Row[] = [];
  let cur: Row | null = null;
  for (const m of moves) {
    if (m.color === 'white') {
      cur = { num: rows.length + 1, w: m.san, b: '' };
      rows.push(cur);
    } else if (cur && !cur.b) {
      cur.b = m.san;
    } else {
      cur = { num: rows.length + 1, w: '', b: m.san };
      rows.push(cur);
    }
  }
  el.innerHTML = rows.map((r) =>
    `<div class="moves__row">`
    + `<div class="moves__num">${String(r.num)}.</div>`
    + `<div class="moves__ply">${r.w}</div>`
    + `<div class="moves__ply">${r.b}</div>`
    + `</div>`,
  ).join('');
}

export function renderShvedkiMoveLists(
  ctx: ShellCtx,
  a: { color: Color; san: string }[],
  b: { color: Color; san: string }[],
): void {
  renderShvedkiMoveListInto(ctx.refs.moveListEl.value, a);
  renderShvedkiMoveListInto(ctx.refs.moveListBEl.value, b);
  if (ctx.refs.moveListMobileEl.value && ctx.refs.moveListEl.value) {
    ctx.refs.moveListMobileEl.value.innerHTML = ctx.refs.moveListEl.value.innerHTML;
  }
}

export function ensureShvedkiClocks(ctx: ShellCtx): void {
  const { mut, ui, form } = ctx;
  const tc = parseTimeControl(form.selectedTimeControl.value);
  if (!mut.clockA) {
    mut.clockA = new GameClock(tc);
    mut.clockA.onTick = () => { updateShvedkiClockDisplay(ctx); };
    mut.clockA.onForfeit = (loser) => {
      if (ui.gameMode !== 'shvedki' || !mut.shvedkiController) return;
      // Доска A: white = Команда 1, black = Команда 2.
      const losingTeam: 1 | 2 = loser === 'white' ? 1 : 2;
      mut.shvedkiController.loseOnTime(losingTeam);
      mut.clockB?.stop();
    };
  } else {
    mut.clockA.reset(tc);
  }
  if (!mut.clockB) {
    mut.clockB = new GameClock(tc);
    mut.clockB.onTick = () => { updateShvedkiClockDisplay(ctx); };
    mut.clockB.onForfeit = (loser) => {
      if (ui.gameMode !== 'shvedki' || !mut.shvedkiController) return;
      // Доска B: white = Команда 2, black = Команда 1.
      const losingTeam: 1 | 2 = loser === 'white' ? 2 : 1;
      mut.shvedkiController.loseOnTime(losingTeam);
      mut.clockA?.stop();
    };
  } else {
    mut.clockB.reset(tc);
  }
  mut.clockAStarted = false;
  mut.clockBStarted = false;
  updateShvedkiClockDisplay(ctx);
}

export function onShvedkiMoveMade(ctx: ShellCtx, boardId: 'A' | 'B', movedColor: Color): void {
  const c = boardId === 'A' ? ctx.mut.clockA : ctx.mut.clockB;
  if (!c) return;
  const phase = ctx.mut.shvedkiController?.getPhase();

  // Партия уже завершена (onGameEnd прозвонил и остановил часы) — не запускать их обратно.
  if (phase?.kind === 'finished') {
    updateShvedkiClockDisplay(ctx);
    saveShvedkiState(ctx);
    saveShvedkiClocks(ctx);
    playGameSound(ctx, 'move');
    return;
  }

  // В фазе спасения ход на «матованной» доске больше ничего не меняет:
  // часы этой доски замораживаются, очередь хода не переключается.
  if (phase?.kind === 'last-move' && phase.boardId !== boardId) {
    c.stop();
    updateShvedkiClockDisplay(ctx);
    saveShvedkiState(ctx);
    saveShvedkiClocks(ctx);
    playGameSound(ctx, 'move');
    return;
  }

  if (boardId === 'A') {
    if (!ctx.mut.clockAStarted) { ctx.mut.clockAStarted = true; c.startFor(movedColor === 'white' ? 'black' : 'white'); }
    else c.switchTurn(movedColor);
  } else if (!ctx.mut.clockBStarted) {
    ctx.mut.clockBStarted = true; c.startFor(movedColor === 'white' ? 'black' : 'white');
  } else {
    c.switchTurn(movedColor);
  }
  updateShvedkiClockDisplay(ctx);
  saveShvedkiState(ctx);
  saveShvedkiClocks(ctx);
  playGameSound(ctx, 'move');
  maybeRunShvedkiAiForBoard(ctx, boardId);
}

export function tryRestoreShvedki(ctx: ShellCtx): void {
  if (!ctx.mut.shvedkiController) return;
  const saved = ctx.infra.shvedkiStore.load(ctx.mut.matchId);
  if (saved) ctx.mut.shvedkiController.restore(saved);
  const savedClocks = ctx.infra.clockStore.loadShvedki(ctx.mut.matchId);
  if (savedClocks && ctx.mut.clockA && ctx.mut.clockB) {
    ctx.mut.clockA.restore(savedClocks.clockA);
    ctx.mut.clockB.restore(savedClocks.clockB);
    ctx.mut.clockAStarted = savedClocks.aStarted;
    ctx.mut.clockBStarted = savedClocks.bStarted;
    updateShvedkiClockDisplay(ctx);
  }
}

export async function enterShvedkiMode(ctx: ShellCtx): Promise<void> {
  const { ui, infra, mut, refs, stores } = ctx;
  infra.clock.stop();
  ui.boardColBVisible = true;
  ui.timeControlRowVisible = true;
  ui.modeBadge = 'ШВЕДКИ';
  ensureShvedkiClocks(ctx);
  updateClockDisplay(ctx);

  if (mut.shvedkiController) {
    mut.shvedkiController.reset();
  } else {
    await nextTick();
    if (!refs.boardCanvasB.value || !refs.boardCanvasA.value) return;
    infra.inputA.detach();
    const inputAShvedki = new InputController(refs.boardCanvasA.value, infra.boardView, () => 'white' as const);
    const viewB = new BoardView(refs.boardCanvasB.value);
    const inputB = new InputController(refs.boardCanvasB.value, viewB, () => 'black' as const);
    mut.shvedkiController = new ShvedkiBoardController({
      viewA: infra.boardView,
      viewB,
      inputA: inputAShvedki,
      inputB,
      canvasA: refs.boardCanvasA.value,
      orientation: () => ui.orientation,
      displayOptions: () => ({
        showCoordinates: stores.settings.gameplay.coordinates,
        showLastMove: stores.settings.gameplay.highlightLastMove,
        showHints: stores.settings.gameplay.hints,
      }),
      reserveAWhiteEl: () => refs.reserveAWhiteEl.value,
      reserveABlackEl: () => refs.reserveABlackEl.value,
      reserveBWhiteEl: () => refs.reserveBWhiteEl.value,
      reserveBBlackEl: () => refs.reserveBBlackEl.value,
      onStatusUpdate: (s) => { ui.status = s; },
      formatMateStatus: (moved, other, team) =>
        t('game.shvedki.mateOnBoard', { moved, other, team }),
      formatPlayingStatus: (aSide, bSide) => {
        const side = (c: Color): string =>
          c === 'white' ? t('game.status.whiteToMove') : t('game.status.blackToMove');
        return t('game.shvedki.playingStatus', { a: side(aSide), b: side(bSide) });
      },
      onIllegalDrop: (reason) => {
        NotificationOverlay.showToast(
          t('game.toast.illegalDrop', { reason }),
          TOAST_DURATION_MS.default,
        );
      },
      onTurnUpdate: (a, b) => {
        ui.reserveATurn = a;
        ui.reserveBTurn = b;
        updateShvedkiClockDisplay(ctx);
      },
      onMoveMade: (boardId, movedColor) => { onShvedkiMoveMade(ctx, boardId, movedColor); },
      onCapturesChanged: (caps) => {
        ui.capturedWhiteA = buildCapturedDisplay(caps.whiteA, 'white', 0);
        ui.capturedBlackA = buildCapturedDisplay(caps.blackA, 'black', 0);
        ui.capturedWhiteB = buildCapturedDisplay(caps.whiteB, 'white', 0);
        ui.capturedBlackB = buildCapturedDisplay(caps.blackB, 'black', 0);
      },
      onMovesChanged: (a, b) => { renderShvedkiMoveLists(ctx, a, b); },
      aiColorOnBoard: (boardId) => aiColorOnBoard(ctx, boardId),
      onGameEnd: (result, reason) => {
        showShvedkiGameOver(ctx, result, reason);
        mut.clockA?.stop();
        mut.clockB?.stop();
        // Финальная phase должна попасть в localStorage, иначе главная страница
        // увидит match в repo и предложит «продолжить».
        saveShvedkiState(ctx);
        saveShvedkiClocks(ctx);
      },
    });
    mut.shvedkiController.mount();
  }
  maybeRunShvedkiAiForBoard(ctx, 'A');
  maybeRunShvedkiAiForBoard(ctx, 'B');
}

export function enterStandardMode(ctx: ShellCtx): void {
  const { ui, infra, mut, refs, form } = ctx;
  mut.shvedkiController?.detach();
  mut.shvedkiController = null;
  ui.capturedWhiteA = EMPTY_CAPTURED;
  ui.capturedBlackA = EMPTY_CAPTURED;
  ui.capturedWhiteB = EMPTY_CAPTURED;
  ui.capturedBlackB = EMPTY_CAPTURED;
  if (refs.moveListBEl.value) refs.moveListBEl.value.innerHTML = '';
  mut.clockA?.stop();
  mut.clockB?.stop();
  if (mut.shvedkiAiBusy) { infra.engine.cancel(); mut.shvedkiAiBusy = false; ui.engineBusy = false; }
  ui.boardColBVisible = false;
  ui.timeControlRowVisible = true;
  ui.modeBadge = 'СТАНДАРТ';
  ui.isTraining = false;
  ui.startFen = '';
  ui.openingName = null;

  if (mut.aiBusy) { infra.engine.cancel(); mut.aiBusy = false; }
  infra.repo.delete(mut.matchId);
  infra.shvedkiStore.delete(mut.matchId);
  infra.clockStore.delete(mut.matchId);
  infra.startMatch.execute({ matchId: mut.matchId });
  mut.clockStarted = false;
  infra.clock.reset(parseTimeControl(form.selectedTimeControl.value));

  mut.boardController?.reattachInput();
  mut.boardController?.reset();
  updateUi(ctx);
}
