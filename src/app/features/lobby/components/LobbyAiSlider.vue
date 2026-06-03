<template>
  <div class="lobby__slider">
    <input
      :value="modelValue"
      type="range"
      :min="AI_LEVEL_MIN"
      :max="AI_LEVEL_MAX"
      class="range"
      @input="onInput"
    >
    <div class="lobby__slider-marks">
      <span
        v-for="i in AI_LEVEL_MAX"
        :key="i"
        class="mark"
        :class="{ 'is-on': i <= modelValue }"
      />
    </div>
    <div class="lobby__slider-row">
      <span class="t-mono t-faint">{{ $t('lobby.ai.level', { n: modelValue }) }}</span>
      <span class="t-mono t-faint">~ELO {{ getAiLevelElo(modelValue) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AI_LEVEL_MAX,
  AI_LEVEL_MIN,
  getAiLevelElo,
} from '@app/features/game/config/ai-config.js';

defineProps<{ modelValue: number }>();
const emit = defineEmits<{ 'update:modelValue': [number] }>();

function onInput(e: Event): void {
  const v = Number((e.target as HTMLInputElement).value);
  emit('update:modelValue', v);
}
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;
@include m.typography-helpers;

.lobby__slider { padding: var(--sp-3) 0; }

.range {
  width: 100%;
  appearance: none;
  background: transparent;
  height: 24px;

  &::-webkit-slider-runnable-track {
    height: 4px;
    background: var(--surface-3);
    border-radius: 2px;
  }

  &::-moz-range-track {
    height: 4px;
    background: var(--surface-3);
    border-radius: 2px;
  }

  &::-webkit-slider-thumb {
    appearance: none;
    height: 18px;
    width: 18px;
    border-radius: 9px;
    background: var(--accent);
    margin-top: -7px;
    cursor: pointer;
  }

  &::-moz-range-thumb {
    height: 18px;
    width: 18px;
    border-radius: 9px;
    background: var(--accent);
    cursor: pointer;
    border: 0;
  }
}

.lobby__slider-marks {
  display: flex;
  gap: 3px;
  margin: var(--sp-2) 0;
}

.mark {
  flex: 1;
  height: 4px;
  background: var(--surface-3);
  border-radius: 2px;

  &.is-on { background: var(--accent); }
}

.lobby__slider-row {
  display: flex;
  justify-content: space-between;
  font-size: var(--fs-xs);
}
</style>
