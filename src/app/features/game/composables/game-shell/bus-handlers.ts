import { buildGameOverMessage } from '@app/features/game/config/game-status.js';
import { i18n } from '@app/shared/i18n';
import { TOAST_DURATION_MS } from '@shared/config/notification-durations.js';
import {
  NotificationOverlay,
} from '@shared/ui/notifications/NotificationOverlay.js';
import { saveClockStandard } from './persistence.js';
import { maybeRunAi } from './standard-ai.js';
import type { ShellCtx } from './types.js';
import {
  playGameSound,
  renderStatus,
  updateEngineCard,
  updateUi,
} from './ui-display.js';

const t = i18n.global.t.bind(i18n.global);

export function setupBusSubscriptions(ctx: ShellCtx): void {
  const { infra, mut, ui } = ctx;
  infra.bus.subscribe('MoveMade', (event) => {
    if (!infra.repo.has(mut.matchId)) return;
    const match = infra.repo.get(mut.matchId);
    const newSide = match.currentSnapshot.sideToMove;
    const movedSide: 'white' | 'black' = newSide === 'white' ? 'black' : 'white';
    if (!mut.clockStarted) { mut.clockStarted = true; infra.clock.startFor(newSide); }
    else infra.clock.switchTurn(movedSide);
    mut.inCheck = false;
    updateUi(ctx);
    saveClockStandard(ctx);
    // Звуки шах/мат проиграют свои подписчики ниже; здесь только взятие/обычный ход.
    playGameSound(ctx, event.move.isCapture ? 'capture' : 'move');
    void maybeRunAi(ctx);
  });

  infra.bus.subscribe('CheckDeclared', () => {
    mut.inCheck = true;
    NotificationOverlay.showToast(t('game.toast.check'), TOAST_DURATION_MS.check);
    renderStatus(ctx);
    playGameSound(ctx, 'check');
  });

  infra.bus.subscribe('MatchEnded', () => {
    infra.clock.stop();
    if (!infra.repo.has(mut.matchId)) return;
    const match = infra.repo.get(mut.matchId);
    const status = match.status;
    const winner = 'winner' in status ? status.winner : undefined;
    const msg = buildGameOverMessage(status.kind, winner);
    if (msg) setTimeout(() => { infra.notification.show(msg); }, 300);
    renderStatus(ctx);
    if (status.kind === 'checkmate') playGameSound(ctx, 'mate');
  });

  infra.bus.subscribe('UndoMoveMade', () => {
    mut.inCheck = false;
    infra.clock.stop();
    mut.clockStarted = false;
    updateUi(ctx);
  });

  infra.bus.subscribe('EvaluationUpdated', (e) => {
    mut.lastEngineInfo = {
      depth: e.depth, score: e.score, bestMoveUci: e.bestMoveUci,
      pv: [...e.pv], nodes: e.nodes, elapsedMs: 0,
    };
    updateEngineCard(ctx);
  });
  infra.bus.subscribe('AnalysisCompleted', (e) => {
    mut.lastEngineInfo = {
      depth: e.depth, score: e.score, bestMoveUci: e.bestMoveUci,
      pv: [...e.pv], nodes: e.nodes, elapsedMs: e.elapsedMs,
    };
    updateEngineCard(ctx);
  });

  infra.bus.subscribeAll((event) => {
    infra.overlay.recordEvent(event);
    const line = `[${event.type}] ${new Date(event.occurredAt).toLocaleTimeString()}`;
    ui.logText = `${line}\n${ui.logText}`.split('\n').slice(0, 50).join('\n');
  });
}
