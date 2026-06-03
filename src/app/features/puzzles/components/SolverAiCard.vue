<template>
  <BaseCard
    padding="md"
    class="solver-ai"
  >
    <header class="solver-ai__head">
      <div class="solver-ai__title">
        <span class="solver-ai__title-icon">
          <AppIcon
            name="brain"
            :size="16"
          />
        </span>
        <span class="solver-ai__eyebrow">{{ s.aiSolveEyebrow }}</span>
      </div>
      <BaseBadge
        v-if="phase === 'visualizing'"
        tone="accent"
        mono
      >
        {{ s.aiSolveBadgeVis }}
      </BaseBadge>
      <BaseBadge
        v-else-if="phase === 'ready' && achieved === false"
        tone="danger"
        mono
      >
        {{ s.aiSolveBadgeMissed }}
      </BaseBadge>
      <BaseBadge
        v-else-if="phase === 'ready'"
        tone="success"
        mono
      >
        {{ s.aiSolveBadgeReady }}
      </BaseBadge>
    </header>

    <template v-if="phase === 'idle'">
      <p class="solver-ai__lead">
        {{ s.aiSolveLead }}
      </p>
      <BaseButton
        variant="primary"
        size="sm"
        block
        :disabled="!canSolve"
        @click="$emit('solve')"
      >
        <AppIcon
          name="brain"
          :size="14"
        />
        <span>{{ s.aiSolveStart }}</span>
      </BaseButton>
    </template>

    <div
      v-else-if="phase === 'thinking'"
      class="solver-ai__thinking"
    >
      <span class="solver-ai__spinner" />
      <div class="solver-ai__thinking-text">
        <div class="solver-ai__thinking-title">
          {{ s.aiSolveThinking }}
        </div>
        <div class="solver-ai__thinking-sub">
          {{ s.aiSolveDepth(progressDepth, maxDepth) }}
        </div>
      </div>
    </div>

    <SolverAiPv
      v-else
      :score-label="scoreLabel"
      :pv="pv"
      :vis-index="visIndex"
      :is-visualizing="isVisualizing"
      :can-step-next="canStepNext"
      @next="$emit('next')"
      @reset="$emit('reset')"
    />
  </BaseCard>
</template>

<script setup lang="ts">
import SolverAiPv from '@app/features/puzzles/components/SolverAiPv.vue';
import type {
  PuzzleAiSolverPhase,
} from '@app/features/puzzles/composables/usePuzzleAiSolver.js';
import { PUZZLE_STRINGS } from '@app/features/puzzles/config/puzzle-strings.js';
import type { PvDisplayItem } from '@app/features/puzzles/utils/pv-display.js';
import AppIcon from '@app/shared/ui/AppIcon/AppIcon.vue';
import BaseBadge from '@app/shared/ui/BaseBadge/BaseBadge.vue';
import BaseButton from '@app/shared/ui/BaseButton/BaseButton.vue';
import BaseCard from '@app/shared/ui/BaseCard/BaseCard.vue';

defineProps<{
  phase: PuzzleAiSolverPhase;
  progressDepth: number;
  maxDepth: number;
  scoreLabel: string;
  pv: readonly PvDisplayItem[];
  visIndex: number;
  isVisualizing: boolean;
  canSolve: boolean;
  canStepNext: boolean;
  /** null — нет цели, true — справился, false — нашёл, но не уложился в бюджет. */
  achieved: boolean | null;
}>();

defineEmits<{
  solve: [];
  next: [];
  reset: [];
}>();

const s = PUZZLE_STRINGS.solver;
</script>

<style scoped lang="scss">
.solver-ai {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.solver-ai__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.solver-ai__title {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
}

.solver-ai__title-icon {
  color: var(--accent);
  display: inline-flex;

}

.solver-ai__eyebrow {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--text-muted);
  text-transform: uppercase;
}

.solver-ai__lead {
  margin: 0;
  font-size: var(--fs-xs);
  color: var(--text-muted);
  line-height: 1.5;
}

.solver-ai__thinking {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3);
  background: var(--surface-2);
  border-radius: var(--r-md);
}

.solver-ai__thinking-text { flex: 1; }

.solver-ai__thinking-title {
  font-size: var(--fs-sm);
  font-weight: 600;
}

.solver-ai__thinking-sub {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  color: var(--text-faint);
  margin-top: 2px;
}

.solver-ai__spinner {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--border-strong);
  border-top-color: var(--accent);
  animation: solver-ai-spin 800ms linear infinite;
  flex-shrink: 0;
}

@keyframes solver-ai-spin {
  to { transform: rotate(360deg); }
}

</style>
