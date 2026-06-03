<template>
  <div
    class="eval-bar"
    :aria-label="$t('game.eval.label')"
    role="img"
  >
    <div
      class="eval-bar__white"
      :style="{ height: `${whitePct}%` }"
    >
      <span
        v-if="showLabel && whitePct >= 50"
        class="eval-bar__label eval-bar__label--white"
      >{{ scoreLabel }}</span>
    </div>
    <div
      class="eval-bar__black"
      :style="{ height: `${100 - whitePct}%` }"
    >
      <span
        v-if="showLabel && whitePct < 50"
        class="eval-bar__label eval-bar__label--black"
      >{{ scoreLabel }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  /** Оценка в сентипешках, положительные — перевес белых. */
  scoreCp: number;
  showLabel?: boolean;
}>(), {
  showLabel: true,
});

/** Сигмоид: ±300сп → ~88%, мат — клампим в ±100%. */
const whitePct = computed<number>(() => {
  const cp = Math.max(-1000, Math.min(1000, props.scoreCp));
  const pct = 50 + 50 * Math.tanh(cp / 300);
  return Math.max(2, Math.min(98, pct));
});

const scoreLabel = computed<string>(() => {
  const cp = props.scoreCp;
  const abs = Math.abs(cp) / 100;
  const sign = cp >= 0 ? '+' : '−';
  return `${sign}${abs.toFixed(1)}`;
});
</script>

<style scoped lang="scss">
.eval-bar {
  width: var(--advantage-width, 16.5px);
  height: 100%;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  border-radius: var(--r-sm);
  overflow: hidden;
  border: 1px solid var(--border);
}

.eval-bar__white {
  width: 100%;
  background: var(--eval-white);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  transition: height var(--dur-slow) var(--ease-out);
  order: 2;
}

.eval-bar__black {
  width: 100%;
  background: var(--eval-black);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  transition: height var(--dur-slow) var(--ease-out);
  order: 1;
}

.eval-bar__label {
  font-family: var(--font-mono);
  font-feature-settings: "tnum";
  font-size: 9px;
  font-weight: 600;
  padding: 2px;
}

.eval-bar__label--white { color: var(--eval-white-text); }
.eval-bar__label--black { color: var(--eval-black-text); }
</style>
