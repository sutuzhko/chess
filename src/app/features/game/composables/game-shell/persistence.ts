import { parseTimeControl } from '@app/features/game/config/time-controls.js';
import type {
  SerializedMatchConfig,
} from '@modules/game/infrastructure/persistence/MatchConfigStore.js';
import type { ShellCtx } from './types.js';

/** Бейдж режима для тренировки дебютов; следует тому же стилю, что 'ШВЕДКИ'/'СТАНДАРТ'. */
export const TRAINING_MODE_BADGE = 'ДЕБЮТ';

export function buildMatchConfig(ctx: ShellCtx): SerializedMatchConfig {
  const tc = parseTimeControl(ctx.form.selectedTimeControl.value);
  const playerSide: 'white' | 'black' = ctx.form.aiSideValue.value === 'white' ? 'black' : 'white';
  const mode = ctx.ui.gameMode === 'shvedki'
    ? 'shvedki'
    : ctx.ui.isTraining ? 'opening_training' : 'standard';
  return {
    version: 1,
    mode,
    opponent: ctx.form.aiSideValue.value === 'off' ? 'hotseat' : 'ai',
    aiLevel: ctx.form.aiDepthValue.value,
    side: ctx.form.aiSideValue.value === 'off' ? ctx.ui.orientation : playerSide,
    initialSeconds: tc.initialSeconds,
    incrementSeconds: tc.incrementSeconds,
    orientation: ctx.ui.orientation,
    ...(ctx.ui.isTraining
      ? { startFen: ctx.ui.startFen, openingName: ctx.ui.openingName }
      : ctx.ui.startFen
        ? { startFen: ctx.ui.startFen }
        : {}),
  };
}

export function persistMatchConfig(ctx: ShellCtx): void {
  ctx.infra.configStore.save(ctx.mut.matchId, buildMatchConfig(ctx));
}

export function saveClockStandard(ctx: ShellCtx): void {
  const { clock } = ctx.infra;
  if (clock.isUnlimited) return;
  ctx.infra.clockStore.saveStandard(ctx.mut.matchId, {
    version: 1,
    whiteMs: clock.getWhiteMs(),
    blackMs: clock.getBlackMs(),
    active: clock.getActive(),
  });
}

export function saveShvedkiState(ctx: ShellCtx): void {
  const ctrl = ctx.mut.shvedkiController;
  if (!ctrl) return;
  ctx.infra.shvedkiStore.save(ctx.mut.matchId, ctrl.serialize());
}

export function saveShvedkiClocks(ctx: ShellCtx): void {
  const { clockA, clockB } = ctx.mut;
  if (!clockA || !clockB) return;
  ctx.infra.clockStore.saveShvedki(ctx.mut.matchId, {
    version: 1,
    clockA: { version: 1, whiteMs: clockA.getWhiteMs(), blackMs: clockA.getBlackMs(), active: clockA.getActive() },
    clockB: { version: 1, whiteMs: clockB.getWhiteMs(), blackMs: clockB.getBlackMs(), active: clockB.getActive() },
    aStarted: ctx.mut.clockAStarted,
    bStarted: ctx.mut.clockBStarted,
  });
}

export function applyConfigToUi(ctx: ShellCtx, cfg: SerializedMatchConfig): void {
  if (cfg.opponent === 'hotseat') {
    ctx.form.aiSideValue.value = 'off';
  } else {
    ctx.form.aiSideValue.value = cfg.side === 'white' ? 'black' : 'white';
  }
  ctx.form.aiDepthValue.value = cfg.aiLevel;
  if (cfg.mode === 'opening_training') {
    // Тренировка дебютов играется на стандартной доске; отличается только идентичность конфига.
    ctx.ui.gameMode = 'standard';
    ctx.ui.isTraining = true;
    ctx.ui.startFen = cfg.startFen ?? '';
    ctx.ui.openingName = cfg.openingName ?? null;
    ctx.ui.modeBadge = TRAINING_MODE_BADGE;
  } else {
    ctx.ui.gameMode = cfg.mode;
    ctx.ui.isTraining = false;
    ctx.ui.startFen = cfg.mode === 'standard' ? (cfg.startFen ?? '') : '';
    ctx.ui.openingName = null;
  }
  ctx.ui.orientation = cfg.orientation;
  ctx.form.selectedTimeControl.value = cfg.initialSeconds === 0
    ? '0_0'
    : `${String(cfg.initialSeconds)}_${String(cfg.incrementSeconds)}`;
}
