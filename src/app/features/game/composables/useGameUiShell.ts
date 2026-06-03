import {
  DEFAULT_TIME_CONTROL,
} from '@app/features/game/config/time-controls.js';
import { EMPTY_CAPTURED } from '@app/features/game/utils/capture-utils.js';
import { useGameStore } from '@app/stores/game.js';
import { useHeaderStore } from '@app/stores/header.js';
import type { AiSide } from '@app/stores/settings.js';
import { useSettingsStore } from '@app/stores/settings.js';
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  canFlip,
  doApplyFen,
  doCopyFen,
  doExportPgn,
  doFlip,
  doImportPgn,
  doLoad,
  doRedo,
  doReset,
  doResign,
  doSave,
  doUndo,
  onAiChange,
  onModeChange,
  onTimeChange,
  toggleDev,
} from './game-shell/actions.js';
import { mountShell, unmountShell } from './game-shell/lifecycle.js';
import {
  type GameUiState,
  generateMatchId,
  type ShellCtx,
  type ShellInfra,
  type ShellMutable,
} from './game-shell/types.js';

export type { GameUiState } from './game-shell/types.js';

interface ShellApi {
  boardCanvasA: ShellCtx['refs']['boardCanvasA'];
  boardCanvasB: ShellCtx['refs']['boardCanvasB'];
  moveListEl: ShellCtx['refs']['moveListEl'];
  moveListBEl: ShellCtx['refs']['moveListBEl'];
  moveListMobileEl: ShellCtx['refs']['moveListMobileEl'];
  devOverlayEl: ShellCtx['refs']['devOverlayEl'];
  promotionEl: ShellCtx['refs']['promotionEl'];
  notificationEl: ShellCtx['refs']['notificationEl'];
  reserveAWhiteEl: ShellCtx['refs']['reserveAWhiteEl'];
  reserveABlackEl: ShellCtx['refs']['reserveABlackEl'];
  reserveBWhiteEl: ShellCtx['refs']['reserveBWhiteEl'];
  reserveBBlackEl: ShellCtx['refs']['reserveBBlackEl'];
  ui: GameUiState;
  selectedTimeControl: ShellCtx['form']['selectedTimeControl'];
  aiSideValue: ShellCtx['form']['aiSideValue'];
  aiDepthValue: ShellCtx['form']['aiDepthValue'];
  canFlip: () => boolean;
  doUndo: () => void;
  doRedo: () => void;
  doReset: () => void;
  doFlip: () => void;
  doResign: () => void;
  doSave: () => void;
  doLoad: () => void;
  doExportPgn: () => void;
  doImportPgn: () => void;
  doApplyFen: () => void;
  doCopyFen: () => void;
  toggleDev: () => void;
  onModeChange: () => void;
  onTimeChange: () => void;
  onAiChange: () => void;
}

export function useGameUiShell(): ShellApi {
  const route = useRoute();
  const router = useRouter();
  const routeMatchId = typeof route.params.matchId === 'string' && route.params.matchId
    ? route.params.matchId
    : null;

  const refs: ShellCtx['refs'] = {
    boardCanvasA: ref<HTMLCanvasElement | null>(null),
    boardCanvasB: ref<HTMLCanvasElement | null>(null),
    moveListEl: ref<HTMLElement | null>(null),
    moveListMobileEl: ref<HTMLElement | null>(null),
    devOverlayEl: ref<HTMLElement | null>(null),
    promotionEl: ref<HTMLElement | null>(null),
    notificationEl: ref<HTMLElement | null>(null),
    reserveAWhiteEl: ref<HTMLElement | null>(null),
    reserveABlackEl: ref<HTMLElement | null>(null),
    reserveBWhiteEl: ref<HTMLElement | null>(null),
    reserveBBlackEl: ref<HTMLElement | null>(null),
    moveListBEl: ref<HTMLElement | null>(null),
  };

  const ui = reactive<GameUiState>({
    status: 'Белые ходят',
    modeBadge: 'СТАНДАРТ',
    timeBadge: '∞',
    moveCountBadge: '—',
    isTraining: false, openingName: null, startFen: '',
    clockWhite: '∞', clockBlack: '∞',
    clockWhiteClass: 'clock', clockBlackClass: 'clock',
    capturedWhite: EMPTY_CAPTURED, capturedBlack: EMPTY_CAPTURED,
    capturedWhiteA: EMPTY_CAPTURED, capturedBlackA: EMPTY_CAPTURED,
    capturedWhiteB: EMPTY_CAPTURED, capturedBlackB: EMPTY_CAPTURED,
    engineData: null, engineBusy: false,
    playerWhiteActive: true, playerBlackActive: false,
    dotWhiteVisible: true, dotBlackVisible: false,
    gameMode: 'standard', boardColBVisible: false, timeControlRowVisible: true,
    reserveATurn: 'white', reserveBTurn: 'white',
    clockWhiteA: '∞', clockBlackA: '∞', clockWhiteB: '∞', clockBlackB: '∞',
    clockWhiteAClass: 'clock', clockBlackAClass: 'clock', clockWhiteBClass: 'clock', clockBlackBClass: 'clock',
    devPanelVisible: false, logText: '',
    fen: '', pgn: '',
    orientation: 'white', playerColor: 'white', opponentColor: 'black',
  });

  const form: ShellCtx['form'] = {
    selectedTimeControl: ref(DEFAULT_TIME_CONTROL),
    aiSideValue: ref<AiSide>('black'),
    aiDepthValue: ref(4),
  };

  // Infra заполняется в onMounted. Каст вместо `!` подчёркивает, что до маунта обращаться к ней нельзя.
  const infra = {} as ShellInfra;

  const mut: ShellMutable = {
    matchId: routeMatchId ?? generateMatchId(),
    boardController: undefined,
    shvedkiController: null,
    clockA: null,
    clockB: null,
    clockAStarted: false,
    clockBStarted: false,
    pageHideHandler: null,
    aiBusy: false,
    shvedkiAiBusy: false,
    inCheck: false,
    clockStarted: false,
    lastEngineInfo: null,
    moveAudio: null,
    audioContext: null,
  };

  const ctx: ShellCtx = {
    ui,
    refs,
    form,
    infra,
    mut,
    stores: {
      settings: useSettingsStore(),
      gameStore: useGameStore(),
      headerStore: useHeaderStore(),
      router,
    },
  };

  let mounted = false;
  onMounted(() => {
    if (mounted) return; // защита от повторного маунта (HMR / suspense)
    mounted = true;
    mountShell(ctx, { routeMatchId });
  });
  onUnmounted(() => {
    if (!mounted) return;
    mounted = false;
    unmountShell(ctx);
  });

  return {
    boardCanvasA: refs.boardCanvasA,
    boardCanvasB: refs.boardCanvasB,
    moveListEl: refs.moveListEl,
    moveListBEl: refs.moveListBEl,
    moveListMobileEl: refs.moveListMobileEl,
    devOverlayEl: refs.devOverlayEl,
    promotionEl: refs.promotionEl,
    notificationEl: refs.notificationEl,
    reserveAWhiteEl: refs.reserveAWhiteEl,
    reserveABlackEl: refs.reserveABlackEl,
    reserveBWhiteEl: refs.reserveBWhiteEl,
    reserveBBlackEl: refs.reserveBBlackEl,
    ui,
    selectedTimeControl: form.selectedTimeControl,
    aiSideValue: form.aiSideValue,
    aiDepthValue: form.aiDepthValue,
    canFlip: () => canFlip(ctx),
    doUndo: () => { doUndo(ctx); },
    doRedo: () => { doRedo(ctx); },
    doReset: () => { doReset(ctx); },
    doFlip: () => { doFlip(ctx); },
    doResign: () => { doResign(ctx); },
    doSave: () => { doSave(ctx); },
    doLoad: () => { doLoad(ctx); },
    doExportPgn: () => { doExportPgn(ctx); },
    doImportPgn: () => { doImportPgn(ctx); },
    doApplyFen: () => { doApplyFen(ctx); },
    doCopyFen: () => { doCopyFen(ctx); },
    toggleDev: () => { toggleDev(ctx); },
    onModeChange: () => { onModeChange(ctx); },
    onTimeChange: () => { onTimeChange(ctx); },
    onAiChange: () => { onAiChange(ctx); },
  };
}
