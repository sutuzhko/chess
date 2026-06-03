<template>
  <section class="solver">
    <SolverHeader
      :title="headerTitle"
      :side-to-move="ui.sideToMove"
      :elo="ui.elo"
      :themes-text="themesText"
      @back="$emit('back')"
    />

    <div class="solver__body">
      <div class="solver__board-col">
        <div class="solver__board">
          <EvalBar
            class="solver__evalbar"
            :score-cp="ai.ui.scoreCp"
            :show-label="ai.ui.phase !== 'idle'"
          />
          <div class="solver__board-area">
            <canvas
              ref="boardCanvas"
              class="solver__canvas"
              width="480"
              height="480"
            />
          </div>
        </div>

        <PromotionModal
          :color="ui.sideToMove"
          @mounted="onPromotionMounted"
        />

        <SolverPlaybackBar
          v-if="ai.isVisualizing.value"
          :vis-index="ai.ui.visIndex"
          :total="ai.ui.pvUci.length"
          :can-step-next="ai.canStepNext.value"
          @reset="ai.resetVisualization"
          @next="ai.nextVisualizationMove"
        />
        <SolverTurnStrip
          v-else
          :status="ui.status"
          :ai-ready="ai.ui.phase === 'ready'"
          :fallback="ui.feedback"
          :progress-current="ui.progress.current"
          :progress-total="ui.progress.total"
        />
      </div>

      <aside class="solver__side">
        <SolverObjectiveCard
          :main="objectiveMain"
          :sub="objectiveSub"
          :total-budget="totalBudget"
          :progress="ui.progress.current"
          :attempts="ui.attempts"
        />

        <BaseCard
          padding="sm"
          class="solver__opp"
        >
          <span class="solver__opp-label">{{ s.solver.opponentLabel }}</span>
          <Segmented
            :model-value="ui.opponentMode"
            :options="opponentOptions"
            @update:model-value="setOpponentMode"
          />
        </BaseCard>

        <SolverBanner
          v-if="ui.status === 'solved'"
          tone="success"
          :title="s.solver.bannerSolvedTitle"
          :body="s.solver.bannerSolvedBody(ui.progress.current)"
        />
        <SolverBanner
          v-else-if="ui.status === 'failed'"
          tone="danger"
          :title="s.solver.bannerFailedTitle"
          :body="s.solver.bannerFailedBody"
        />

        <SolverHistory
          v-if="ui.attempts.length > 0"
          :attempts="ui.attempts"
          :total-budget="totalBudget"
        />

        <SolverBanner
          v-if="aiMissedBanner"
          tone="danger"
          :title="aiMissedBanner.title"
          :body="aiMissedBanner.body"
        />

        <SolverAiCard
          :phase="ai.ui.phase"
          :progress-depth="ai.ui.progressDepth"
          :max-depth="PUZZLE_SOLVE_MAX_DEPTH"
          :score-label="aiScoreLabel"
          :pv="pvDisplay"
          :vis-index="ai.ui.visIndex"
          :is-visualizing="ai.isVisualizing.value"
          :can-solve="!!ui.puzzleId"
          :can-step-next="ai.canStepNext.value"
          :achieved="ai.ui.achieved"
          @solve="ai.solveWithAi"
          @next="ai.nextVisualizationMove"
          @reset="ai.resetVisualization"
        />

        <SolverActions
          :can-hint="ui.status === 'solving'"
          :can-continue="!!continueFen"
          @hint="hint"
          @retry="onRetry"
          @continue-from-position="continueFromPosition"
          @next="$emit('next')"
        />
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  recordPuzzleSolved,
} from '@app/features/home/composables/usePuzzleStats.js';
import SolverActions from '@app/features/puzzles/components/SolverActions.vue';
import SolverAiCard from '@app/features/puzzles/components/SolverAiCard.vue';
import SolverBanner from '@app/features/puzzles/components/SolverBanner.vue';
import SolverHeader from '@app/features/puzzles/components/SolverHeader.vue';
import SolverHistory from '@app/features/puzzles/components/SolverHistory.vue';
import SolverObjectiveCard
  from '@app/features/puzzles/components/SolverObjectiveCard.vue';
import SolverPlaybackBar
  from '@app/features/puzzles/components/SolverPlaybackBar.vue';
import SolverTurnStrip
  from '@app/features/puzzles/components/SolverTurnStrip.vue';
import {
  usePuzzleAiSolver,
} from '@app/features/puzzles/composables/usePuzzleAiSolver.js';
import {
  usePuzzleSolver,
} from '@app/features/puzzles/composables/usePuzzleSolver.js';
import {
  PUZZLE_CONTINUE_ROUTE,
  PUZZLE_SOLVE_MAX_DEPTH,
} from '@app/features/puzzles/config/puzzle-solver.config.js';
import { PUZZLE_STRINGS } from '@app/features/puzzles/config/puzzle-strings.js';
import { themeLabel } from '@app/features/puzzles/config/puzzle-themes.js';
import { buildPvDisplay } from '@app/features/puzzles/utils/pv-display.js';
import BaseCard from '@app/shared/ui/BaseCard/BaseCard.vue';
import EvalBar from '@app/shared/ui/EvalBar/EvalBar.vue';
import PromotionModal from '@app/shared/ui/PromotionModal/PromotionModal.vue';
import Segmented from '@app/shared/ui/Segmented/Segmented.vue';
import type { SegmentedOption } from '@app/shared/ui/Segmented/types.js';
import { OBJECTIVE_KIND } from '@modules/game/application';
import { computed, watch } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps<{ puzzleId: string }>();
const emit = defineEmits<(e: 'back' | 'next' | 'solved' | 'failed') => void>();

const s = PUZZLE_STRINGS;
const router = useRouter();

const {
  boardCanvas, promotionEl, ui,
  loadPuzzle, retry, hint, setOpponentMode,
  controller,
} = usePuzzleSolver({
  onSolved: () => { recordPuzzleSolved(); emit('solved'); },
  onFailed: () => { emit('failed'); },
});

function onPromotionMounted(el: HTMLElement): void { promotionEl.value = el; }

const ai = usePuzzleAiSolver({
  controller,
  puzzleFen: () => (ui.startFen.length > 0 ? ui.startFen : null),
  objective: () => ui.objective,
});

const opponentOptions = computed<readonly SegmentedOption<'scripted' | 'ai'>[]>(() => [
  { value: 'scripted', label: s.solver.opponentScripted },
  { value: 'ai', label: s.solver.opponentAi },
]);

const headerTitle = computed(() => ui.puzzleTitle || (ui.puzzleId ?? ''));

const objectiveMain = computed(() => {
  const o = ui.objective;
  if (!o) return s.solver.objectivePlayLine;
  if (o.kind === OBJECTIVE_KIND.bestMove) return s.solver.objectiveBestMove;
  return s.solver.objectiveMate(o.moves);
});

const objectiveSub = computed(() => {
  const o = ui.objective;
  return o ? s.solver.budget(o.moves) : '';
});

const totalBudget = computed(() => ui.objective?.moves ?? ui.progress.total);

const themesText = computed(() =>
  ui.themes.map((t) => themeLabel(t)).join(' · '),
);

const pvDisplay = computed(() => buildPvDisplay(ui.startFen, ai.ui.pvUci));

const aiScoreLabel = computed(() => {
  if (ai.ui.mateIn !== null) return `#${String(ai.ui.mateIn)}`;
  const pawns = ai.ui.scoreCp / 100;
  const sign = pawns >= 0 ? '+' : '';
  return `${sign}${pawns.toFixed(1)}`;
});

/**
 * Если ИИ выдал результат, но цель не достигнута — показываем тематический
 * баннер: «не уложился в бюджет мата» или общий «не нашёл решение».
 */
const aiMissedBanner = computed<{ title: string; body: string } | null>(() => {
  if (ai.ui.phase !== 'ready' && ai.ui.phase !== 'visualizing') return null;
  if (ai.ui.achieved !== false) return null;
  const obj = ui.objective;
  if (obj?.kind === 'mate' && ai.ui.mateIn !== null) {
    return {
      title: s.solver.aiSolveMissedMateTitle,
      body: s.solver.aiSolveMissedMateBody(ai.ui.mateIn, obj.moves),
    };
  }
  return {
    title: s.solver.aiSolveMissedGenericTitle,
    body: s.solver.aiSolveMissedGenericBody,
  };
});

const continueFen = computed<string | null>(() =>
  ui.currentFen.length > 0 ? ui.currentFen : null,
);

function continueFromPosition(): void {
  const fen = continueFen.value;
  if (!fen) return;
  const title = ui.puzzleTitle !== '' ? ui.puzzleTitle : (ui.puzzleId ?? '');
  void router.push({
    name: PUZZLE_CONTINUE_ROUTE.name,
    params: { mode: PUZZLE_CONTINUE_ROUTE.mode },
    query: { fen, ...(title ? { title } : {}) },
  });
}

function onRetry(): void {
  ai.reset();
  retry();
}

watch(() => props.puzzleId, (id) => {
  if (!id) return;
  ai.reset();
  loadPuzzle(id);
}, { immediate: true });
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.solver {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: var(--sp-4);
  padding: var(--sp-5) var(--sp-6) var(--sp-6);
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.solver__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: var(--sp-5);
  align-items: start;
}

.solver__board-col {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  min-width: 0;
}

.solver__board {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--sp-2);
  align-items: stretch;
}

.solver__evalbar {
  width: 12px;
  align-self: stretch;
}

.solver__board-area {
  position: relative;
  aspect-ratio: 1 / 1;
  width: 100%;
}

.solver__canvas {
  width: 100%;
  height: 100%;
  display: block;
  border-radius: var(--r-sm);
}

.solver__side {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  min-width: 0;
}

.solver__opp {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
}

.solver__opp-label {
  font-family: var(--font-mono), sans-serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--text-muted);
  text-transform: uppercase;
}

@include m.laptop {
  .solver__body { grid-template-columns: 1fr; }
}
</style>
