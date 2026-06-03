<template>
  <BaseCard
    padding="none"
    class="solver-history"
  >
    <header class="solver-history__head">
      <div class="solver-history__title">
        {{ s.historyTitle }}
      </div>
      <span class="solver-history__counter">
        {{ attempts.length }} / {{ totalBudget }}
      </span>
    </header>
    <div class="solver-history__list">
      <div
        v-for="a in attempts"
        :key="a.index"
        class="solver-history__row"
        :class="a.ok ? 'solver-history__row--ok' : 'solver-history__row--bad'"
      >
        <span class="solver-history__num">{{ a.index }}.</span>
        <span class="solver-history__san">{{ a.san }}</span>
        <span class="solver-history__lbl">{{ a.ok ? s.historyOk : s.historyBad }}</span>
        <span class="solver-history__icon">
          <AppIcon
            v-if="a.ok"
            name="check"
            :size="12"
          />
          <AppIcon
            v-else
            name="cross"
            :size="12"
          />
        </span>
      </div>
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

defineProps<{
  attempts: readonly PuzzleAttempt[];
  totalBudget: number;
}>();

const s = PUZZLE_STRINGS.solver;
</script>

<style scoped lang="scss">
.solver-history__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--sp-3) var(--sp-3) var(--sp-2);
}

.solver-history__title {
  font-weight: 600;
  font-size: var(--fs-sm);
}

.solver-history__counter {
  font-family: var(--font-mono);
  color: var(--text-faint);
  font-size: var(--fs-xs);
}

.solver-history__list {
  display: flex;
  flex-direction: column;
}

.solver-history__row {
  display: grid;
  grid-template-columns: 28px auto 1fr auto;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  border-top: 1px solid var(--divider);
  font-size: var(--fs-sm);

  &:first-child { border-top: 0; }
}

.solver-history__num {
  font-family: var(--font-mono);
  color: var(--text-faint);
  font-size: var(--fs-xs);
}

.solver-history__san {
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: var(--fs-sm);
}

.solver-history__lbl {
  color: var(--text-muted);
  font-size: var(--fs-xs);
}

.solver-history__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;

}

.solver-history__row--ok {
  .solver-history__san { color: var(--success); }

  .solver-history__icon {
    background: var(--success-soft);
    color: var(--success);
  }
}

.solver-history__row--bad {
  .solver-history__san { color: var(--danger); }

  .solver-history__icon {
    background: var(--danger-soft);
    color: var(--danger);
  }
}
</style>
