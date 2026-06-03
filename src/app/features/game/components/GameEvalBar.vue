<template>
  <div class="eval-bar-col">
    <div
      class="eval-bar"
      :class="`eval-bar--${orientation}`"
    >
      <div
        class="eval-bar__white"
        :style="{ height: `${whitePct}%` }"
      />
      <div
        class="eval-bar__black"
        :style="{ height: `${100 - whitePct}%` }"
      />
    </div>
    <span class="eval-bar__score">{{ score }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  /** Оценка в сантипешках, относительно белых (положительная — преимущество белых). */
  scoreCp: number;
  /** Сторона, расположенная снизу доски — определяет, какой цвет лежит внизу шкалы. */
  orientation?: 'white' | 'black';
}>(), {
  orientation: 'white',
});

/** Сигмоид: ±300 сп → ~88%, ограничиваем 2..98% чтобы обе полосы были видны. */
const whitePct = computed<number>(() => {
  const cp = Math.max(-1000, Math.min(1000, props.scoreCp));
  const pct = 50 + 50 * Math.tanh(cp / 300);
  return Math.max(2, Math.min(98, pct));
});

const score = computed<string>(() => {
  const s = props.scoreCp / 100;
  return s > 0 ? `+${s.toFixed(1)}` : s.toFixed(1);
});
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.eval-bar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-2);
  flex-shrink: 0;
  padding: 20px 0;
  max-width: var(--advantage-width);
}

.eval-bar {
  width: 12px;
  flex: 1;
  background: var(--surface-3);
  border-radius: var(--r-pill);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 200px;
}

// Низ шкалы зеркалит цвет, лежащий внизу доски.
.eval-bar--white { flex-direction: column-reverse; }
.eval-bar--black { flex-direction: column; }

.eval-bar__white {
  background: #ececec;
  transition: height var(--dur-slow) var(--ease-out);
}

.eval-bar__black {
  background: var(--eval-black);
  transition: height var(--dur-slow) var(--ease-out);
}

.eval-bar__score {
  font-family: var(--font-mono), sans-serif;
  font-size: var(--fs-xs);
  color: var(--text-muted);
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
  letter-spacing: var(--tracking-wide);
}
</style>
