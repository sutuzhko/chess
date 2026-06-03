import { parseTimeControl } from '@app/features/game/config/time-controls.js';
import { i18n } from '@app/shared/i18n';
import {
  JsonMatchCodec,
} from '@modules/game/infrastructure/persistence/JsonMatchCodec.js';
import {
  PgnCodec,
} from '@modules/game/infrastructure/persistence/PgnCodec.js';
import { TOAST_DURATION_MS } from '@shared/config/notification-durations.js';
import {
  NotificationOverlay,
} from '@shared/ui/notifications/NotificationOverlay.js';
import {
  persistMatchConfig,
  saveShvedkiClocks,
  saveShvedkiState,
} from './persistence.js';
import { maybeRunShvedkiAiForBoard } from './shvedki-ai.js';
import {
  ensureShvedkiClocks,
  enterShvedkiMode,
  enterStandardMode,
} from './shvedki-mode.js';
import { maybeRunAi } from './standard-ai.js';
import { generateMatchId, type ShellCtx } from './types.js';
import {
  flash,
  recomputePlayerColor,
  updateClockDisplay,
  updateTopBadges,
  updateUi,
} from './ui-display.js';

const t = i18n.global.t.bind(i18n.global);

export function canFlip(ctx: ShellCtx): boolean {
  return ctx.ui.gameMode === 'standard';
}

export function resetMatch(ctx: ShellCtx): void {
  const { infra, mut, stores, ui, form } = ctx;
  if (mut.aiBusy) { infra.engine.cancel(); mut.aiBusy = false; }
  const oldId = mut.matchId;
  const newId = generateMatchId();
  infra.repo.delete(oldId);
  infra.configStore.delete(oldId);
  infra.shvedkiStore.delete(oldId);
  infra.clockStore.delete(oldId);
  mut.matchId = newId;
  infra.startMatch.execute({
    matchId: newId,
    ...(ui.startFen ? { fen: ui.startFen } : {}),
  });
  persistMatchConfig(ctx);
  void stores.router.replace(`/game/${newId}`);
  mut.inCheck = false;
  mut.clockStarted = false;
  infra.clock.reset(parseTimeControl(form.selectedTimeControl.value));
  mut.lastEngineInfo = null;
  ui.logText = '';
  infra.notification.hide();
}

export function doUndo(ctx: ShellCtx): void {
  if (ctx.mut.aiBusy || ctx.ui.gameMode !== 'standard') return;
  ctx.infra.undoMove.execute(ctx.mut.matchId);
  ctx.infra.clock.stop();
  ctx.mut.clockStarted = false;
  ctx.mut.inCheck = false;
  updateUi(ctx);
}

export function doRedo(ctx: ShellCtx): void {
  if (ctx.mut.aiBusy || ctx.ui.gameMode !== 'standard') return;
  ctx.infra.redoMove.execute(ctx.mut.matchId);
  updateUi(ctx);
}

export function doReset(ctx: ShellCtx): void {
  const { ui, infra, mut, stores } = ctx;
  if (ui.gameMode === 'shvedki') {
    if (mut.shvedkiAiBusy) { infra.engine.cancel(); mut.shvedkiAiBusy = false; ui.engineBusy = false; }
    const oldId = mut.matchId;
    const newId = generateMatchId();
    infra.configStore.delete(oldId);
    infra.shvedkiStore.delete(oldId);
    infra.clockStore.delete(oldId);
    mut.matchId = newId;
    persistMatchConfig(ctx);
    void stores.router.replace(`/game/${newId}`);
    mut.shvedkiController?.reset();
    ensureShvedkiClocks(ctx);
    maybeRunShvedkiAiForBoard(ctx, 'A');
    maybeRunShvedkiAiForBoard(ctx, 'B');
    return;
  }
  resetMatch(ctx);
  mut.boardController?.reset();
  updateUi(ctx);
  void maybeRunAi(ctx);
}

export function doFlip(ctx: ShellCtx): void {
  if (!canFlip(ctx)) return;
  ctx.ui.orientation = ctx.ui.orientation === 'white' ? 'black' : 'white';
  recomputePlayerColor(ctx);
  ctx.mut.boardController?.rerender();
  persistMatchConfig(ctx);
}

export function doResign(ctx: ShellCtx): void {
  const { ui, infra, mut } = ctx;
  if (ui.gameMode === 'shvedki') {
    // В шведках человек = Команда 1 (см. shvedki-ai.aiColorOnBoard).
    // Сдача останавливает обе доски и вызывает onGameEnd → модалка + статус.
    if (!mut.shvedkiController) return;
    mut.shvedkiController.resign(1);
    mut.clockA?.stop();
    mut.clockB?.stop();
    // Сохраняем финальное состояние (phase=finished), чтобы главная страница
    // не предлагала «продолжить» завершённую партию.
    saveShvedkiState(ctx);
    saveShvedkiClocks(ctx);
    return;
  }
  if (!infra.repo.has(mut.matchId)) return;
  const match = infra.repo.get(mut.matchId);
  if (match.status.kind !== 'in-progress') return;
  infra.resignMatch.execute(mut.matchId, ui.playerColor);
  infra.clock.stop();
  updateUi(ctx);
}

function ensureMatch(ctx: ShellCtx): ReturnType<typeof ctx.infra.repo.get> {
  const { infra, mut } = ctx;
  if (!infra.repo.has(mut.matchId)) {
    infra.startMatch.execute({ matchId: mut.matchId });
    return infra.repo.get(mut.matchId);
  }
  try {
    return infra.repo.get(mut.matchId);
  } catch {
    infra.repo.delete(mut.matchId);
    infra.startMatch.execute({ matchId: mut.matchId });
    NotificationOverlay.showToast(t('game.toast.saveCorrupted'), TOAST_DURATION_MS.default);
    return infra.repo.get(mut.matchId);
  }
}

export function doSave(ctx: ShellCtx): void {
  if (ctx.ui.gameMode !== 'standard') return;
  window.localStorage.setItem(
    'chess.match.export',
    JSON.stringify(JsonMatchCodec.serialize(ensureMatch(ctx))),
  );
  flash(ctx, t('game.toast.saved'));
}

export function doLoad(ctx: ShellCtx): void {
  const { ui, infra, mut } = ctx;
  if (ui.gameMode !== 'standard') return;
  const raw = window.localStorage.getItem('chess.match.export');
  if (!raw) { flash(ctx, t('game.toast.saveNotFound')); return; }
  try {
    const serialized = JSON.parse(raw) as Parameters<typeof JsonMatchCodec.deserialize>[0];
    const match = JsonMatchCodec.deserialize(serialized);
    infra.repo.delete(mut.matchId);
    infra.repo.save(match);
    mut.inCheck = false;
    infra.clock.stop();
    mut.clockStarted = false;
    mut.boardController?.reset();
    updateUi(ctx);
    void maybeRunAi(ctx);
    flash(ctx, t('game.toast.loaded'));
  } catch (e) { flash(ctx, t('game.toast.error', { message: (e as Error).message })); }
}

export function doExportPgn(ctx: ShellCtx): void {
  if (ctx.ui.gameMode !== 'standard') return;
  ctx.ui.pgn = PgnCodec.export(ensureMatch(ctx));
}

export function doImportPgn(ctx: ShellCtx): void {
  const { ui, infra, mut } = ctx;
  if (ui.gameMode !== 'standard') return;
  try {
    const m = PgnCodec.import(ui.pgn, mut.matchId);
    infra.repo.delete(mut.matchId);
    infra.repo.save(m);
    mut.inCheck = false;
    infra.clock.stop();
    mut.clockStarted = false;
    mut.boardController?.reset();
    updateUi(ctx);
    flash(ctx, t('game.toast.pgnImported'));
  } catch (e) { flash(ctx, t('game.toast.error', { message: (e as Error).message })); }
}

export function doApplyFen(ctx: ShellCtx): void {
  const { ui, infra, mut, form } = ctx;
  if (ui.gameMode !== 'standard') return;
  const fen = ui.fen.trim();
  if (!fen) return;
  try {
    if (mut.aiBusy) { infra.engine.cancel(); mut.aiBusy = false; }
    infra.repo.delete(mut.matchId);
    infra.startMatch.execute({ matchId: mut.matchId, fen });
    mut.inCheck = false;
    mut.lastEngineInfo = null;
    mut.clockStarted = false;
    infra.clock.reset(parseTimeControl(form.selectedTimeControl.value));
    mut.boardController?.reset();
    updateUi(ctx);
    flash(ctx, t('game.toast.fenApplied'));
  } catch (e) {
    NotificationOverlay.showToast(t('game.toast.fenInvalidReason', { reason: (e as Error).message }), TOAST_DURATION_MS.default);
  }
}

export function doCopyFen(ctx: ShellCtx): void {
  void navigator.clipboard.writeText(ctx.ui.fen).then(() => { flash(ctx, t('game.toast.fenCopied')); });
}

export function toggleDev(ctx: ShellCtx): void {
  ctx.ui.devPanelVisible = !ctx.ui.devPanelVisible;
  ctx.infra.overlay.toggle();
  if (ctx.ui.devPanelVisible && ctx.infra.repo.has(ctx.mut.matchId)) {
    ctx.infra.overlay.render(ctx.infra.repo.get(ctx.mut.matchId));
  }
}

export function onModeChange(ctx: ShellCtx): void {
  if (ctx.ui.gameMode === 'shvedki') {
    ctx.infra.shvedkiStore.delete(ctx.mut.matchId);
    ctx.infra.clockStore.delete(ctx.mut.matchId);
    void enterShvedkiMode(ctx);
  } else {
    enterStandardMode(ctx);
  }
}

export function onTimeChange(ctx: ShellCtx): void {
  const { infra, mut, form } = ctx;
  const tc = parseTimeControl(form.selectedTimeControl.value);
  infra.clock.reset(tc);
  mut.clockStarted = false;
  if (mut.clockA) { mut.clockA.reset(tc); mut.clockAStarted = false; }
  if (mut.clockB) { mut.clockB.reset(tc); mut.clockBStarted = false; }
  infra.clockStore.delete(mut.matchId);
  updateClockDisplay(ctx);
  updateTopBadges(ctx);
  persistMatchConfig(ctx);
}

export function onAiChange(ctx: ShellCtx): void {
  const { ui, infra, mut } = ctx;
  recomputePlayerColor(ctx);
  if (ui.gameMode === 'shvedki') {
    if (mut.shvedkiAiBusy) { infra.engine.cancel(); mut.shvedkiAiBusy = false; ui.engineBusy = false; }
    mut.shvedkiController?.rerender();
    maybeRunShvedkiAiForBoard(ctx, 'A');
    maybeRunShvedkiAiForBoard(ctx, 'B');
  } else {
    if (mut.aiBusy) infra.engine.cancel();
    void maybeRunAi(ctx);
  }
  persistMatchConfig(ctx);
}
