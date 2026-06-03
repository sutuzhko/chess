<template>
  <BaseCard
    padding="md"
    class="solver-objective"
  >
    <div class="solver-objective__row">
      <span class="solver-objective__icon">
        <AppIcon
          name="target"
          :size="16"
        />
      </span>
      <div class="solver-objective__text">
        <div class="solver-objective__eyebrow">
          {{ s.objectiveEyebrow }}
        </div>
        <div class="solver-objective__main">
          {{ main }}
        </div>
        <div
          v-if="sub"
          class="solver-objective__sub"
        >
          {{ sub }}
        </div>
      </div>
    </div>

    <div class="solver-objective__budget">
      <span
        v-for="i in totalBudget"
        :key="i"
        class="solver-objective__dot"
        :class="dotClass(i - 1)"
      />
      <span class="solver-objective__counter">
        {{ s.budgetMade(progress, totalBudget) }}
      </span>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import type {
  PuzzleAttempt,
} from '@app/features/puzzles/composables/usePuzzleAttempts.js';
import { PUZZLE_STRINGS } from '@app/features/puzzles/config/puzzle-strings.js';
import AppIcon from '@app/shared/ui/AppIcon/AppIcon.vue';
import BaseCard from '@app/shared/ui/BaseCard/BaseCard.vue';

const props = defineProps<{
  main: string;
  sub: string;
  totalBudget: number;
  progress: number;
  attempts: readonly PuzzleAttempt[];
}>();

const s = PUZZLE_STRINGS.solver;

function dotClass(i: number): string {
  const att = props.attempts[i];
  if (!att) return 'solver-objective__dot--empty';
  return att.ok ? 'solver-objective__dot--ok' : 'solver-objective__dot--bad';
}
</script>

<style scoped lang="scss">
.solver-objective {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.solver-objective__row {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-3);
}

.solver-objective__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--r-md);
  background: var(--accent-soft);
  color: var(--accent);
  flex-shrink: 0;

}

.solver-objective__text {
  flex: 1;
  min-width: 0;
}

.solver-objective__eyebrow {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--text-muted);
  text-transform: uppercase;
}

.solver-objective__main {
  font-size: var(--fs-lg);
  font-weight: 600;
  line-height: 1.3;
  margin-top: 2px;
  letter-spacing: var(--tracking-tight);
}

.solver-objective__sub {
  font-family: var(--font-mono);
  color: var(--text-muted);
  font-size: var(--fs-xs);
  margin-top: 4px;
}

.solver-objective__budget {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: var(--sp-2);
  border-top: 1px dashed var(--divider);
}

.solver-objective__counter {
  font-family: var(--font-mono);
  color: var(--text-faint);
  font-size: var(--fs-xs);
  margin-left: 8px;
}

.solver-objective__dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1.5px solid var(--border-strong);
  display: inline-block;
  background: transparent;

  &--ok {
    background: var(--success);
    border-color: var(--success);
  }

  &--bad {
    background: var(--danger);
    border-color: var(--danger);
  }
}
</style>
