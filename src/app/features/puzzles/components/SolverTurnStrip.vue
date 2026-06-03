<template>
  <BaseCard
    padding="sm"
    class="solver-turn"
  >
    <div class="solver-turn__row">
      <div class="solver-turn__main">
        <span
          v-if="status === 'solved'"
          class="solver-turn__feedback solver-turn__feedback--solved"
        >{{ s.solved }}</span>
        <span
          v-else-if="status === 'failed'"
          class="solver-turn__feedback solver-turn__feedback--failed"
        >{{ s.failed }}</span>
        <span
          v-else-if="aiReady"
          class="solver-turn__feedback solver-turn__feedback--accent"
        >{{ s.aiSolveReady }}</span>
        <span v-else>{{ fallback }}</span>
      </div>
      <div class="solver-turn__counter">
        {{ s.progress(progressCurrent, progressTotal) }}
      </div>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import { PUZZLE_STRINGS } from '@app/features/puzzles/config/puzzle-strings.js';
import BaseCard from '@app/shared/ui/BaseCard/BaseCard.vue';
import type { PuzzleStatus } from '@modules/game/application';

defineProps<{
  status: PuzzleStatus;
  aiReady: boolean;
  fallback: string;
  progressCurrent: number;
  progressTotal: number;
}>();

const s = PUZZLE_STRINGS.solver;
</script>

<style scoped lang="scss">
.solver-turn { padding: var(--sp-2) var(--sp-3); }

.solver-turn__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  min-height: 36px;
}

.solver-turn__main { font-size: var(--fs-sm); }

.solver-turn__counter {
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  color: var(--text-muted);
}

.solver-turn__feedback {
  font-weight: 600;

  &--solved { color: var(--success); }
  &--failed { color: var(--danger); }
  &--accent { color: var(--accent); }
}
</style>
