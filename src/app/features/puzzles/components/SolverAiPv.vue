<template>
  <div class="solver-pv">
    <header class="solver-pv__head">
      <span class="solver-pv__eval">{{ scoreLabel }}</span>
      <span class="solver-pv__meta">{{ s.pvHead(pv.length) }}</span>
    </header>
    <div class="solver-pv__line">
      <span
        v-for="(m, i) in pv"
        :key="i"
        class="solver-pv__move"
        :class="{
          'solver-pv__move--current': isVisualizing && i === visIndex - 1,
          'solver-pv__move--done': isVisualizing && i < visIndex - 1,
        }"
      >
        <span
          v-if="m.showNumber"
          class="solver-pv__num"
        >{{ m.numberLabel }}</span>
        <span class="solver-pv__san">{{ m.san }}</span>
      </span>
    </div>
    <BaseButton
      v-if="!isVisualizing"
      variant="primary"
      size="sm"
      block
      @click="$emit('next')"
    >
      <span>{{ s.aiSolveShowFirst }}</span>
      <IconArrowRight />
    </BaseButton>
    <div
      v-else
      class="solver-pv__actions"
    >
      <BaseButton
        variant="tertiary"
        size="sm"
        block
        @click="$emit('reset')"
      >
        {{ s.aiSolveRestart }}
      </BaseButton>
      <BaseButton
        variant="primary"
        size="sm"
        block
        :disabled="!canStepNext"
        @click="$emit('next')"
      >
        <span>{{ s.aiSolveNext }}</span>
        <AppIcon
          name="arrow-right"
          :size="14"
        />
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PUZZLE_STRINGS } from '@app/features/puzzles/config/puzzle-strings.js';
import type { PvDisplayItem } from '@app/features/puzzles/utils/pv-display.js';
import AppIcon from '@app/shared/ui/AppIcon/AppIcon.vue';
import BaseButton from '@app/shared/ui/BaseButton/BaseButton.vue';

defineProps<{
  scoreLabel: string;
  pv: readonly PvDisplayItem[];
  visIndex: number;
  isVisualizing: boolean;
  canStepNext: boolean;
}>();
defineEmits<{
  next: [];
  reset: [];
}>();

const s = PUZZLE_STRINGS.solver;
</script>

<style scoped lang="scss">
.solver-pv {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  padding: var(--sp-3);
  background: var(--surface-2);
  border-radius: var(--r-md);
}

.solver-pv__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.solver-pv__eval {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: var(--fs-md);
  color: var(--success);
  letter-spacing: -0.02em;
}

.solver-pv__meta {
  font-family: var(--font-mono);
  color: var(--text-muted);
  font-size: var(--fs-xs);
}

.solver-pv__line {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 8px;
  padding: var(--sp-2) var(--sp-3);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  min-height: 36px;
  line-height: 1.5;
}

.solver-pv__move {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  font-size: var(--fs-sm);
  color: var(--text-muted);
  padding: 1px 4px;
  border-radius: 3px;

  &--done {
    color: var(--text-faint);
    text-decoration: line-through;
  }

  &--current {
    color: var(--accent);
    background: var(--accent-soft);
    font-weight: 600;
  }
}

.solver-pv__num {
  font-family: var(--font-mono);
  color: var(--text-faint);
  font-size: var(--fs-xs);
  margin-right: 2px;
}

.solver-pv__san {
  font-family: var(--font-mono);
}

.solver-pv__actions {
  display: flex;
  gap: var(--sp-2);
}

</style>
