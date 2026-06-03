import {
  buildStatusFromMatch,
  buildStatusText,
} from '@app/features/game/config/game-status.js';
import {
  formatTimeControlBadge,
} from '@app/features/game/config/time-controls.js';
import {
  buildCapturedDisplay,
  computeAdvantage,
  getCaptured,
} from '@app/features/game/utils/capture-utils.js';
import { formatTime } from '@modules/game/ui/clock/GameClock.js';
import { assetUrl } from '@shared/config/asset-path.js';
import type { ShellCtx } from './types.js';

export function clockClassFor(ms: number, isActive: boolean, unlimited: boolean): string {
  if (unlimited) return 'clock';
  return [
    'clock',
    isActive ? 'clock--active' : '',
    ms > 0 && ms < 10_000 ? 'clock--low' : '',
    ms > 0 && ms < 5_000 ? 'clock--critical' : '',
  ].filter(Boolean).join(' ');
}

export function updateShvedkiClockDisplay(ctx: ShellCtx): void {
  const { ui, mut } = ctx;
  const { clockA, clockB } = mut;
  if (!clockA || !clockB) {
    ui.clockWhiteA = '∞'; ui.clockBlackA = '∞';
    ui.clockWhiteB = '∞'; ui.clockBlackB = '∞';
    ui.clockWhiteAClass = 'clock'; ui.clockBlackAClass = 'clock';
    ui.clockWhiteBClass = 'clock'; ui.clockBlackBClass = 'clock';
    return;
  }
  const aUnlimited = clockA.isUnlimited;
  const bUnlimited = clockB.isUnlimited;
  const aWhite = clockA.getWhiteMs();
  const aBlack = clockA.getBlackMs();
  const bWhite = clockB.getWhiteMs();
  const bBlack = clockB.getBlackMs();
  const aActive = ui.reserveATurn;
  const bActive = ui.reserveBTurn;
  ui.clockWhiteA = aUnlimited ? '∞' : formatTime(aWhite);
  ui.clockBlackA = aUnlimited ? '∞' : formatTime(aBlack);
  ui.clockWhiteB = bUnlimited ? '∞' : formatTime(bWhite);
  ui.clockBlackB = bUnlimited ? '∞' : formatTime(bBlack);
  ui.clockWhiteAClass = clockClassFor(aWhite, clockA.isRunning && aActive === 'white', aUnlimited);
  ui.clockBlackAClass = clockClassFor(aBlack, clockA.isRunning && aActive === 'black', aUnlimited);
  ui.clockWhiteBClass = clockClassFor(bWhite, clockB.isRunning && bActive === 'white', bUnlimited);
  ui.clockBlackBClass = clockClassFor(bBlack, clockB.isRunning && bActive === 'black', bUnlimited);
}

export function updateClockDisplay(
  ctx: ShellCtx,
  whiteMs?: number,
  blackMs?: number,
): void {
  const { ui, infra, mut } = ctx;
  const { clock, repo } = infra;
  const w = whiteMs ?? clock.getWhiteMs();
  const b = blackMs ?? clock.getBlackMs();
  if (clock.isUnlimited) {
    ui.clockWhite = '∞';
    ui.clockBlack = '∞';
    ui.clockWhiteClass = 'clock';
    ui.clockBlackClass = 'clock';
  } else {
    const match = repo.has(mut.matchId) ? repo.get(mut.matchId) : null;
    const active = match?.currentSnapshot.sideToMove ?? null;
    ui.clockWhite = formatTime(w);
    ui.clockBlack = formatTime(b);
    ui.clockWhiteClass = clockClassFor(w, clock.isRunning && active === 'white', false);
    ui.clockBlackClass = clockClassFor(b, clock.isRunning && active === 'black', false);
  }
  updateShvedkiClockDisplay(ctx);
}

export function updatePlayerCards(ctx: ShellCtx): void {
  const { ui, infra, mut } = ctx;
  if (!infra.repo.has(mut.matchId)) return;
  const match = infra.repo.get(mut.matchId);
  const side = match.currentSnapshot.sideToMove;
  const isOver = match.status.kind !== 'in-progress';
  ui.playerWhiteActive = side === 'white' && !isOver;
  ui.playerBlackActive = side === 'black' && !isOver;
  ui.dotWhiteVisible = side === 'white' && !isOver;
  ui.dotBlackVisible = side === 'black' && !isOver;

  const { byWhite, byBlack } = getCaptured(match);
  const wVal = computeAdvantage(byWhite);
  const bVal = computeAdvantage(byBlack);
  ui.capturedWhite = buildCapturedDisplay(byWhite, 'white', Math.max(0, wVal - bVal));
  ui.capturedBlack = buildCapturedDisplay(byBlack, 'black', Math.max(0, bVal - wVal));
}

export function updateEngineCard(ctx: ShellCtx): void {
  const { ui, mut } = ctx;
  ui.engineBusy = mut.aiBusy;
  if (!mut.lastEngineInfo) { ui.engineData = null; return; }
  const e = mut.lastEngineInfo;
  ui.engineData = {
    depth: e.depth,
    score: e.score,
    bestMoveUci: e.bestMoveUci,
    nodes: e.nodes,
    elapsedMs: e.elapsedMs,
  };
}

export function updateTopBadges(ctx: ShellCtx): void {
  const { ui, infra, mut, form } = ctx;
  if (!infra.repo.has(mut.matchId)) return;
  const match = infra.repo.get(mut.matchId);
  const idx = match.timeline.currentIndex;
  ui.moveCountBadge = idx > 0 ? String(Math.ceil(idx / 2)) : '—';
  ui.timeBadge = formatTimeControlBadge(form.selectedTimeControl.value);
}

export function renderStatus(ctx: ShellCtx): void {
  const { ui, infra, mut } = ctx;
  if (!infra.repo.has(mut.matchId)) return;
  const match = infra.repo.get(mut.matchId);
  const snap = match.currentSnapshot;
  const status = match.status;
  if (status.kind === 'in-progress') {
    ui.status = buildStatusText(snap.sideToMove, mut.inCheck, mut.aiBusy);
  } else {
    const winner = 'winner' in status ? status.winner : undefined;
    ui.status = buildStatusFromMatch(status.kind, winner);
  }
  ui.fen = snap.toFen();
}

export function syncMobileList(ctx: ShellCtx): void {
  const { moveListMobileEl, moveListEl } = ctx.refs;
  if (moveListMobileEl.value && moveListEl.value) {
    moveListMobileEl.value.innerHTML = moveListEl.value.innerHTML;
    const container = moveListMobileEl.value;
    const current = container.querySelector<HTMLElement>('.is-current');
    if (current) {
      // Прокрутить только сам контейнер списка — иначе scrollIntoView
      // утянет всю страницу к списку ходов (баг на мобильных).
      const cRect = container.getBoundingClientRect();
      const tRect = current.getBoundingClientRect();
      if (tRect.top < cRect.top) container.scrollTop -= cRect.top - tRect.top;
      else if (tRect.bottom > cRect.bottom) container.scrollTop += tRect.bottom - cRect.bottom;
    }
  }
}

export function updateUi(ctx: ShellCtx): void {
  renderStatus(ctx);
  updatePlayerCards(ctx);
  updateTopBadges(ctx);
  updateClockDisplay(ctx);
  updateEngineCard(ctx);
  if (ctx.infra.repo.has(ctx.mut.matchId)) {
    ctx.infra.moveList.render(ctx.infra.repo.get(ctx.mut.matchId));
    syncMobileList(ctx);
    ctx.infra.overlay.render(ctx.infra.repo.get(ctx.mut.matchId));
  }
}

export function recomputePlayerColor(ctx: ShellCtx): void {
  const { ui, form } = ctx;
  if (form.aiSideValue.value === 'off') {
    ui.playerColor = ui.orientation;
  } else {
    ui.playerColor = form.aiSideValue.value === 'white' ? 'black' : 'white';
  }
  ui.opponentColor = ui.playerColor === 'white' ? 'black' : 'white';
}

export function flash(ctx: ShellCtx, msg: string): void {
  const prev = ctx.ui.status;
  ctx.ui.status = msg;
  setTimeout(() => {
    if (ctx.ui.status === msg && ctx.infra.repo.has(ctx.mut.matchId)) renderStatus(ctx);
    void prev;
  }, 1200);
}

export type GameSoundKind = 'move' | 'capture' | 'check' | 'mate';

function getAudioContext(ctx: ShellCtx): AudioContext | null {
  if (ctx.mut.audioContext) return ctx.mut.audioContext;
  if (typeof window.AudioContext === 'undefined') return null;
  ctx.mut.audioContext = new window.AudioContext();
  return ctx.mut.audioContext;
}

function tone(
  actx: AudioContext,
  freq: number,
  durMs: number,
  type: OscillatorType = 'sine',
  vol = 0.15,
  delayMs = 0,
): void {
  const start = actx.currentTime + delayMs / 1000;
  const end = start + durMs / 1000;
  const o = actx.createOscillator();
  const g = actx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  // Короткая атака + экспоненциальный спад — чтобы не было щелчка.
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, end);
  o.connect(g);
  g.connect(actx.destination);
  o.start(start);
  o.stop(end);
}

export function playGameSound(ctx: ShellCtx, kind: GameSoundKind): void {
  if (!ctx.stores.settings.gameplay.sound) return;
  try {
    if (kind === 'move') {
      ctx.mut.moveAudio ??= new Audio(assetUrl('sounds/move.mp3'));
      ctx.mut.moveAudio.currentTime = 0;
      void ctx.mut.moveAudio.play();
      return;
    }
    const actx = getAudioContext(ctx);
    if (!actx) return;
    if (actx.state === 'suspended') void actx.resume();
    if (kind === 'capture') {
      tone(actx, 200, 90, 'square', 0.18);
      tone(actx, 110, 130, 'square', 0.14, 55);
    } else if (kind === 'check') {
      tone(actx, 660, 110, 'triangle', 0.22);
      tone(actx, 990, 150, 'triangle', 0.22, 120);
    } else {
      // 'mate' — минорное трезвучие с длинным затуханием.
      tone(actx, 440, 380, 'sine', 0.18);
      tone(actx, 523, 380, 'sine', 0.18, 70);
      tone(actx, 622, 520, 'sine', 0.18, 140);
    }
  } catch { /* silent */ }
}

