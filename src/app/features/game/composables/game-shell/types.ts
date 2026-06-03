import type { EngineData } from '@app/features/game/types/engine.types.js';
import type {
  CapturedDisplay,
} from '@app/features/game/utils/capture-utils.js';
import type { useGameStore } from '@app/stores/game.js';
import type { useHeaderStore } from '@app/stores/header.js';
import type { AiSide, useSettingsStore } from '@app/stores/settings.js';
import type {
  GetLegalMovesUseCase,
  MakeMoveUseCase,
  RedoMoveUseCase,
  StartMatchUseCase,
  UndoMoveUseCase,
} from '@modules/game/application';
import type {
  EngineAdapter,
} from '@modules/game/application/ports/EngineAdapter.js';
import type {
  MatchRepository,
} from '@modules/game/application/ports/MatchRepository.js';
import type {
  ForfeitMatchUseCase,
} from '@modules/game/application/use-cases/ForfeitMatch.js';
import type {
  RequestBestMoveUseCase,
} from '@modules/game/application/use-cases/RequestBestMove.js';
import type {
  ResignMatchUseCase,
} from '@modules/game/application/use-cases/ResignMatch.js';
import type {
  ClockStateStore,
} from '@modules/game/infrastructure/persistence/ClockStateStore.js';
import type {
  MatchConfigStore,
} from '@modules/game/infrastructure/persistence/MatchConfigStore.js';
import type {
  ShvedkiStateStore,
} from '@modules/game/infrastructure/persistence/ShvedkiStateStore.js';
import type {
  BoardController,
} from '@modules/game/ui/canvas/BoardController.js';
import type { BoardView } from '@modules/game/ui/canvas/BoardView.js';
import type {
  InputController,
} from '@modules/game/ui/canvas/InputController.js';
import type {
  ShvedkiBoardController,
} from '@modules/game/ui/canvas/ShvedkiBoardController.js';
import type { GameClock } from '@modules/game/ui/clock/GameClock.js';
import type {
  DevOverlay,
  EngineSnapshot,
} from '@modules/game/ui/dev-mode/DevOverlay.js';
import type { MoveListView } from '@modules/game/ui/MoveListView.js';
import type { EventBus } from '@shared/types/EventBus.js';
import type {
  NotificationOverlay,
} from '@shared/ui/notifications/NotificationOverlay.js';
import type { Ref } from 'vue';
import type { useRouter } from 'vue-router';

/**
 * Презентационное состояние страницы партии. Исторически плоский объект ~35
 * полей; сейчас разнесён по категориям-интерфейсам ниже. Финальный split на
 * focused stores запланирован одновременно с рестайлом, чтобы шаблоны
 * переписывались один раз.
 */
export interface GameStatusUi {
  status: string;
  modeBadge: string;
  timeBadge: string;
  moveCountBadge: string;
  gameMode: string;
  /**
   * Тренировка дебютов играется на стандартной доске (`gameMode ===
   * 'standard'`), но конфиг матча помечается отдельным режимом; флаг переносит
   * эту идентичность.
   */
  isTraining: boolean;
  /** i18n-ключ изучаемого дебюта, либо null. */
  openingName: string | null;
  /** Начальный FEN для тренировки ('' для обычной партии). */
  startFen: string;
}

export interface GameClocksUi {
  clockWhite: string;
  clockBlack: string;
  clockWhiteClass: string;
  clockBlackClass: string;
  clockWhiteA: string;
  clockBlackA: string;
  clockWhiteB: string;
  clockBlackB: string;
  clockWhiteAClass: string;
  clockBlackAClass: string;
  clockWhiteBClass: string;
  clockBlackBClass: string;
}

export interface GameCapturedUi {
  capturedWhite: CapturedDisplay;
  capturedBlack: CapturedDisplay;
  capturedWhiteA: CapturedDisplay;
  capturedBlackA: CapturedDisplay;
  capturedWhiteB: CapturedDisplay;
  capturedBlackB: CapturedDisplay;
}

export interface GameEngineUi {
  engineData: EngineData | null;
  engineBusy: boolean;
}

export interface GamePlayersUi {
  playerWhiteActive: boolean;
  playerBlackActive: boolean;
  dotWhiteVisible: boolean;
  dotBlackVisible: boolean;
  orientation: 'white' | 'black';
  playerColor: 'white' | 'black';
  opponentColor: 'white' | 'black';
}

export interface GameLayoutUi {
  boardColBVisible: boolean;
  timeControlRowVisible: boolean;
  reserveATurn: string;
  reserveBTurn: string;
}

export interface GameDevUi {
  devPanelVisible: boolean;
  logText: string;
}

export interface GameNotationUi {
  fen: string;
  pgn: string;
}

export type GameUiState =
  & GameStatusUi
  & GameClocksUi
  & GameCapturedUi
  & GameEngineUi
  & GamePlayersUi
  & GameLayoutUi
  & GameDevUi
  & GameNotationUi;

export interface ShellRefs {
  boardCanvasA: Ref<HTMLCanvasElement | null>;
  boardCanvasB: Ref<HTMLCanvasElement | null>;
  moveListEl: Ref<HTMLElement | null>;
  moveListMobileEl: Ref<HTMLElement | null>;
  devOverlayEl: Ref<HTMLElement | null>;
  promotionEl: Ref<HTMLElement | null>;
  notificationEl: Ref<HTMLElement | null>;
  reserveAWhiteEl: Ref<HTMLElement | null>;
  reserveABlackEl: Ref<HTMLElement | null>;
  reserveBWhiteEl: Ref<HTMLElement | null>;
  reserveBBlackEl: Ref<HTMLElement | null>;
  moveListBEl: Ref<HTMLElement | null>;
}

export interface ShellForm {
  selectedTimeControl: Ref<string>;
  aiSideValue: Ref<AiSide>;
  aiDepthValue: Ref<number>;
}

export interface ShellInfra {
  repo: MatchRepository;
  configStore: MatchConfigStore;
  shvedkiStore: ShvedkiStateStore;
  clockStore: ClockStateStore;
  bus: EventBus;
  engine: EngineAdapter;
  startMatch: StartMatchUseCase;
  makeMove: MakeMoveUseCase;
  undoMove: UndoMoveUseCase;
  redoMove: RedoMoveUseCase;
  requestBest: RequestBestMoveUseCase;
  forfeitMatch: ForfeitMatchUseCase;
  resignMatch: ResignMatchUseCase;
  getLegalMoves: GetLegalMovesUseCase;
  boardView: BoardView;
  inputA: InputController;
  notification: NotificationOverlay;
  moveList: MoveListView;
  clock: GameClock;
  overlay: DevOverlay;
}

export interface ShellMutable {
  matchId: string;
  boardController: BoardController | undefined;
  shvedkiController: ShvedkiBoardController | null;
  clockA: GameClock | null;
  clockB: GameClock | null;
  clockAStarted: boolean;
  clockBStarted: boolean;
  pageHideHandler: (() => void) | null;
  aiBusy: boolean;
  shvedkiAiBusy: boolean;
  inCheck: boolean;
  clockStarted: boolean;
  lastEngineInfo: EngineSnapshot | null;
  moveAudio: HTMLAudioElement | null;
  audioContext: AudioContext | null;
}

export interface ShellStores {
  settings: ReturnType<typeof useSettingsStore>;
  gameStore: ReturnType<typeof useGameStore>;
  headerStore: ReturnType<typeof useHeaderStore>;
  router: ReturnType<typeof useRouter>;
}

export interface ShellCtx {
  ui: GameUiState;
  refs: ShellRefs;
  form: ShellForm;
  infra: ShellInfra;
  mut: ShellMutable;
  stores: ShellStores;
}

export function generateMatchId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `m-${String(Date.now())}-${Math.random().toString(36).slice(2, 8)}`;
}
