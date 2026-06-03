import {
  PUZZLE_SOLVE_MAX_DEPTH,
  PUZZLE_SOLVE_MAX_TIME_MS,
} from '@app/features/puzzles/config/puzzle-solver.config.js';
import { useEngineService } from '@app/stores/services/engine.js';
import {
  type PuzzleObjective,
  replayPv,
  type SnapshotHandle,
  SolvePuzzleUseCase,
} from '@modules/game/application';
import { parseUci } from '@modules/game/application/uci.js';
import type { Square } from '@modules/game/domain/game';
import type {
  PuzzleBoardController,
} from '@modules/game/ui/canvas/PuzzleBoardController.js';
import { computed, type ComputedRef, reactive, ref, type Ref } from 'vue';

export type PuzzleAiSolverPhase =
  | 'idle'
  | 'thinking'
  | 'ready'
  | 'visualizing';

export interface PuzzleAiSolverUi {
  phase: PuzzleAiSolverPhase;
  progressDepth: number;
  /** Принципиальный вариант — UCI-строки. */
  pvUci: readonly string[];
  scoreCp: number;
  mateIn: number | null;
  /**
   * Удовлетворяет ли найденное движком решение цели задачи:
   * null — нет objective, true — справился, false — нашёл вариант, но цель не
   * достижима.
   */
  achieved: boolean | null;
  /** Индекс следующего полухода для визуализации (0..pv.length). */
  visIndex: number;
}

export interface UsePuzzleAiSolverOptions {
  /** Доступ к контроллеру доски — для рендера PV-кадров. */
  readonly controller: () => PuzzleBoardController | null;
  /** FEN текущей задачи (стартовая позиция для анализа). */
  readonly puzzleFen: () => string | null;
  /** Цель задачи — ограничивает длину видимого PV (best-move=1, mate=2N-1). */
  readonly objective: () => PuzzleObjective | null;
}

export interface UsePuzzleAiSolver {
  readonly ui: PuzzleAiSolverUi;
  readonly canVisualize: ComputedRef<boolean>;
  readonly canStepNext: ComputedRef<boolean>;
  readonly isVisualizing: ComputedRef<boolean>;
  /** Запросить анализ. Если уже идёт — no-op. */
  solveWithAi(): Promise<void>;
  /** Показать следующий полуход варианта. */
  nextVisualizationMove(): void;
  /** Сбросить визуализацию (вернуть позицию задачи). */
  resetVisualization(): void;
  /** Полный сброс состояния (вызывать при загрузке другой задачи). */
  reset(): void;
}

export function usePuzzleAiSolver(opts: UsePuzzleAiSolverOptions): UsePuzzleAiSolver {
  const engineSvc = useEngineService();

  const ui = reactive<PuzzleAiSolverUi>({
    phase: 'idle',
    progressDepth: 0,
    pvUci: [],
    scoreCp: 0,
    mateIn: null,
    achieved: null,
    visIndex: 0,
  });

  // Снапшоты для пошаговой визуализации (включая стартовый).
  const snapshots: Ref<readonly SnapshotHandle[]> = ref([]);

  const canVisualize = computed(() => ui.phase === 'ready' || ui.phase === 'visualizing');
  const isVisualizing = computed(() => ui.phase === 'visualizing');
  const canStepNext = computed(() => canVisualize.value && ui.visIndex < ui.pvUci.length);

  async function solveWithAi(): Promise<void> {
    if (ui.phase === 'thinking') return;
    const fen = opts.puzzleFen();
    if (!fen) return;

    ui.phase = 'thinking';
    ui.progressDepth = 0;
    ui.pvUci = [];
    ui.scoreCp = 0;
    ui.mateIn = null;
    ui.achieved = null;
    ui.visIndex = 0;
    snapshots.value = [];

    const useCase = new SolvePuzzleUseCase(engineSvc.engine());
    const objective = opts.objective() ?? undefined;
    try {
      const result = await useCase.execute(
        {
          fen,
          maxDepth: PUZZLE_SOLVE_MAX_DEPTH,
          maxTimeMs: PUZZLE_SOLVE_MAX_TIME_MS,
          ...(objective ? { objective } : {}),
        },
        (info) => { ui.progressDepth = info.depth; },
      );
      ui.pvUci = result.pv;
      ui.scoreCp = result.scoreCp;
      ui.mateIn = result.mateIn;
      ui.achieved = result.achieved;
      snapshots.value = replayPv(fen, result.pv);
      ui.phase = 'ready';
    } catch (e) {
      console.error('SolvePuzzle failed', e);
      ui.phase = 'idle';
    }
  }

  function nextVisualizationMove(): void {
    if (!canStepNext.value) return;
    const controller = opts.controller();
    if (!controller) return;

    ui.phase = 'visualizing';
    ui.visIndex++;
    const snap = snapshots.value[ui.visIndex];
    if (!snap) return;

    // Подсветка последнего хода — пара from/to из предыдущего → текущего снапшота
    // строится самим BoardView из preview-поля; вычислим её из UCI хода.
    const uci = ui.pvUci[ui.visIndex - 1];
    const lastSquares = uci ? uciToSquares(uci) : null;
    controller.renderSnapshot(snap, lastSquares);
  }

  function resetVisualization(): void {
    const controller = opts.controller();
    controller?.renderSnapshot(null);
    ui.visIndex = 0;
    if (ui.pvUci.length > 0) ui.phase = 'ready';
  }

  function reset(): void {
    const controller = opts.controller();
    controller?.renderSnapshot(null);
    ui.phase = 'idle';
    ui.progressDepth = 0;
    ui.pvUci = [];
    ui.scoreCp = 0;
    ui.mateIn = null;
    ui.achieved = null;
    ui.visIndex = 0;
    snapshots.value = [];
  }

  return {
    ui,
    canVisualize,
    canStepNext,
    isVisualizing,
    solveWithAi,
    nextVisualizationMove,
    resetVisualization,
    reset,
  };
}

// ──────────────────────────────────────────────────────────────────────────────

/** UCI "e2e4" / "e7e8q" → {from, to} как пара объектов Square (для controller.renderSnapshot). */
function uciToSquares(uci: string): { from: Square; to: Square } | null {
  if (uci.length < 4) return null;
  const m = parseUci(uci);
  return { from: m.from, to: m.to };
}
