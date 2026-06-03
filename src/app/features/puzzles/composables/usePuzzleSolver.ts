import { useBoardTheme } from '@app/features/game/composables/useBoardTheme.js';
import { getAiProfile } from '@app/features/game/config/ai-config.js';
import {
  currentSessionFen,
  makeAttempt,
  preFenBeforeLastMove,
  type PuzzleAttempt,
} from '@app/features/puzzles/composables/usePuzzleAttempts.js';
import { PUZZLE_STRINGS } from '@app/features/puzzles/config/puzzle-strings.js';
import { useEngineService } from '@app/stores/services/engine.js';
import { useSettingsStore } from '@app/stores/settings.js';
import {
  GetPuzzleHintUseCase,
  OPPONENT_MODE,
  type OpponentMode,
  PUZZLE_STATUS,
  type PuzzleStatus,
  StartPuzzleSessionUseCase,
  SubmitPuzzleMoveUseCase,
} from '@modules/game/application';
import type {
  EngineAdapter,
} from '@modules/game/application/ports/EngineAdapter.js';
import type {
  PuzzleObjective,
  SolvingSession,
} from '@modules/game/domain/puzzles';
import {
  LocalStoragePuzzleRepository,
} from '@modules/game/infrastructure/puzzles/LocalStoragePuzzleRepository.js';
import {
  BoardView,
  preloadPieceImages,
} from '@modules/game/ui/canvas/BoardView.js';
import { InputController } from '@modules/game/ui/canvas/InputController.js';
import { PromotionDialog } from '@modules/game/ui/canvas/PromotionDialog.js';
import {
  PuzzleBoardController,
} from '@modules/game/ui/canvas/PuzzleBoardController.js';
import { InMemoryEventBus } from '@shared/lib/event-bus/InMemoryEventBus.js';
import { nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';

const AI_LEVEL_MAX = 20;

export type { PuzzleAttempt } from '@app/features/puzzles/composables/usePuzzleAttempts.js';

export interface PuzzleSolverUiState {
  status: PuzzleStatus;
  feedback: string;
  hintsUsed: number;
  progress: { current: number; total: number };
  puzzleId: string | null;
  puzzleTitle: string;
  themes: readonly string[];
  elo: number;
  sideToMove: 'white' | 'black';
  opponentMode: OpponentMode;
  aiThinking: boolean;
  /** Цель задачи (если есть). */
  objective: PuzzleObjective | null;
  /** Стартовый FEN задачи. */
  startFen: string;
  /** Текущая FEN сессии (после ходов игрока) — для «Продолжить с этой позиции». */
  currentFen: string;
  /** История попыток игрока — для side-panel истории ходов. */
  attempts: PuzzleAttempt[];
}

export interface UsePuzzleSolverOptions {
  onSolved?: () => void;
  onFailed?: () => void;
}

export interface UsePuzzleSolver {
  boardCanvas: ReturnType<typeof ref<HTMLCanvasElement | null>>;
  promotionEl: ReturnType<typeof ref<HTMLElement | null>>;
  ui: PuzzleSolverUiState;
  loadPuzzle: (puzzleId: string) => void;
  retry: () => void;
  hint: () => void;
  setOpponentMode: (mode: OpponentMode) => void;
  /** Доступ к контроллеру доски — для пошаговой визуализации PV. */
  controller: () => PuzzleBoardController | null;
}

export function usePuzzleSolver(opts: UsePuzzleSolverOptions = {}): UsePuzzleSolver {
  const settings = useSettingsStore();
  const engineSvc = useEngineService();

  const boardCanvas = ref<HTMLCanvasElement | null>(null);
  const promotionEl = ref<HTMLElement | null>(null);

  const ui = reactive<PuzzleSolverUiState>({
    status: PUZZLE_STATUS.solving,
    feedback: PUZZLE_STRINGS.solver.yourMove,
    hintsUsed: 0,
    progress: { current: 0, total: 0 },
    puzzleId: null,
    puzzleTitle: '',
    themes: [],
    elo: 0,
    sideToMove: 'white',
    opponentMode: OPPONENT_MODE.scripted,
    aiThinking: false,
    objective: null,
    startFen: '',
    currentFen: '',
    attempts: [],
  });

  let repo: LocalStoragePuzzleRepository | null = null;
  let bus: InMemoryEventBus | null = null;
  let startSession: StartPuzzleSessionUseCase | null = null;
  let submit: SubmitPuzzleMoveUseCase | null = null;
  let hintUC: GetPuzzleHintUseCase | null = null;
  let controller: PuzzleBoardController | null = null;
  let session: SolvingSession | null = null;
  let pendingId: string | null = null;
  let engine: EngineAdapter | null = null;

  function syncUi(): void {
    if (!session) return;
    const obj = session.objective;
    ui.status = session.status;
    ui.hintsUsed = session.hintsRevealed;
    ui.progress = obj
      ? { current: session.solverMoves, total: obj.moves }
      : { current: Math.ceil(session.solutionIndex / 2), total: Math.ceil(session.totalPlies / 2) };
    ui.puzzleId = session.puzzle.id;
    ui.puzzleTitle = session.puzzle.title ?? session.puzzle.id;
    ui.themes = session.puzzle.themes;
    ui.elo = session.puzzle.elo;
    ui.sideToMove = session.puzzle.sideToMove;
    ui.opponentMode = session.opponentMode;
    ui.startFen = session.puzzle.fen;
    ui.currentFen = session.currentFen;
    ui.objective = obj ?? null;
    if (session.status === PUZZLE_STATUS.solved) ui.feedback = PUZZLE_STRINGS.solver.solved;
    else if (session.status === PUZZLE_STATUS.failed) ui.feedback = PUZZLE_STRINGS.solver.failed;
    else ui.feedback = session.currentSnapshot.sideToMove === session.puzzle.sideToMove
      ? PUZZLE_STRINGS.solver.yourMove
      : PUZZLE_STRINGS.solver.waiting;
  }

  function loadPuzzle(puzzleId: string): void {
    if (!startSession) {
      pendingId = puzzleId;
      return;
    }
    session = startSession.execute({
      puzzleId,
      sessionId: `${puzzleId}-${String(Date.now())}`,
    });
    session.setOpponentMode(ui.opponentMode);
    controller?.reset();
    ui.attempts = [];
    syncUi();
  }

  /** Записывает попытку игрока в историю. preFen — позиция ДО хода. */
  function recordAttempt(uci: string, ok: boolean, preFen: string): void {
    ui.attempts.push(makeAttempt(ui.attempts, uci, ok, preFen));
  }


  function retry(): void {
    if (session) loadPuzzle(session.puzzle.id);
  }

  function hint(): void {
    if (!hintUC || !session) return;
    hintUC.execute(session);
    syncUi();
  }

  function setOpponentMode(mode: OpponentMode): void {
    ui.opponentMode = mode;
    session?.setOpponentMode(mode);
  }

  async function runAiReply(): Promise<void> {
    if (!session || !engine) return;
    if (session.opponentMode !== OPPONENT_MODE.ai) return;
    if (session.status !== PUZZLE_STATUS.solving) return;
    ui.aiThinking = true;
    syncUi();
    try {
      const profile = getAiProfile(AI_LEVEL_MAX);
      const result = await engine.analyze({
        fen: session.currentSnapshot.toFen(),
        maxDepth: profile.depth,
        multiPV: profile.multiPV,
        temperature: profile.temperature,
        noiseCP: profile.noiseCP,
        blunderProb: profile.blunderProb,
      });
      const replyEvents = session.applyOpponentReply(result.bestMoveUci);
      if (bus) for (const e of replyEvents) bus.publish(e);
    } catch (e) {
      console.error('Puzzle AI error', e);
    } finally {
      ui.aiThinking = false;
      syncUi();
    }
  }

  onMounted(async () => {
    await nextTick();
    const canvas = boardCanvas.value;
    const promoNode = promotionEl.value;
    if (!canvas || !promoNode) return;

    repo = new LocalStoragePuzzleRepository(window.localStorage);
    bus = new InMemoryEventBus();
    startSession = new StartPuzzleSessionUseCase(repo);
    submit = new SubmitPuzzleMoveUseCase(bus);
    hintUC = new GetPuzzleHintUseCase(bus);
    engine = engineSvc.engine();

    const view = new BoardView(canvas);
    const input = new InputController(canvas, view, () => orientation());
    const promo = new PromotionDialog(promoNode);

    controller = new PuzzleBoardController({
      boardView: view,
      input,
      bus,
      submit,
      promo,
      canvas,
      orientation: () => orientation(),
      displayOptions: () => ({
        showCoordinates: settings.gameplay.coordinates,
        showLastMove: settings.gameplay.highlightLastMove,
        showHints: settings.gameplay.hints,
      }),
      getSession: () => session,
    });
    controller.mount();
    preloadPieceImages(() => { controller?.rerender(); });

    bus.subscribe('PuzzleMoveAccepted', (e) => {
      if (session) recordAttempt(e.uci, true, preFenBeforeLastMove(session));
      syncUi();
    });
    bus.subscribe('PuzzleOpponentReplied', () => { syncUi(); });
    bus.subscribe('PuzzleAwaitingOpponent', () => { void runAiReply(); });
    bus.subscribe('PuzzleSolved', () => {
      syncUi();
      opts.onSolved?.();
    });
    bus.subscribe('PuzzleFailed', (e) => {
      if (session && e.attemptedUci) {
        const pre = session.objective
          ? preFenBeforeLastMove(session)
          : currentSessionFen(session);
        recordAttempt(e.attemptedUci, false, pre);
      }
      syncUi();
      opts.onFailed?.();
    });
    bus.subscribe('PuzzleMoveRejected', (e) => {
      if (session) recordAttempt(e.attemptedUci, false, currentSessionFen(session));
      ui.feedback = PUZZLE_STRINGS.solver.wrong;
    });
    bus.subscribe('PuzzleHintRevealed', () => { syncUi(); });

    watch(() => ({ ...settings.gameplay }), () => { controller?.rerender(); }, { deep: true });
    useBoardTheme(() => controller);

    if (pendingId) {
      loadPuzzle(pendingId);
      pendingId = null;
    }
  });

  onUnmounted(() => {
    controller?.detach();
    controller = null;
    engine?.cancel();
    engine = null;
  });

  function orientation(): 'white' | 'black' {
    return session?.puzzle.sideToMove ?? 'white';
  }

  return {
    boardCanvas,
    promotionEl,
    ui,
    loadPuzzle,
    retry,
    hint,
    setOpponentMode,
    controller: () => controller,
  };
}
