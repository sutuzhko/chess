<template>
  <div class="slider-wrap">
    <div class="slider-wrap__row">
      <span
        v-if="showBounds"
        class="slider-wrap__bound t-mono"
      >{{ min }}</span>
      <input
        type="range"
        class="slider"
        :style="{ '--fill-pct': fillPct }"
        :min="min"
        :max="max"
        :step="step"
        :value="modelValue"
        :disabled="disabled"
        :aria-label="ariaLabel"
        @input="onInput"
      >
      <span
        v-if="showBounds"
        class="slider-wrap__bound t-mono"
      >{{ max }}</span>
    </div>
    <div
      v-if="showMarks"
      class="slider-wrap__marks"
    >
      <span
        v-for="i in marksCount"
        :key="i"
        class="slider-wrap__mark"
        :class="{ 'is-on': i <= modelValue }"
      />
    </div>
    <div
      v-if="$slots.caption"
      class="slider-wrap__caption"
    >
      <slot name="caption" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  modelValue: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  showBounds?: boolean;
  showMarks?: boolean;
  ariaLabel?: string;
}>(), {
  min: 0,
  max: 100,
  step: 1,
  disabled: false,
  showBounds: false,
  showMarks: false,
  ariaLabel: '',
});

const emit = defineEmits<{ 'update:modelValue': [value: number] }>();

const marksCount = computed<number>(() => props.max - props.min + 1);

/** Ширина закрашенной части трека (0–100%), задаёт градиент `--slider-track`. */
const fillPct = computed<string>(() => {
  const span = props.max - props.min;
  if (span <= 0) return '0%';
  const ratio = (props.modelValue - props.min) / span;
  const clamped = Math.min(1, Math.max(0, ratio));
  return `${(clamped * 100).toString()}%`;
});

function onInput(e: Event): void {
  emit('update:modelValue', Number((e.target as HTMLInputElement).value));
}
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;
@include m.typography-helpers;

.slider-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  width: 100%;
}

.slider-wrap__row {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}

.slider-wrap__bound {
  color: var(--text-faint);
  font-size: var(--fs-xs);
}

.slider {
  flex: 1;
  width: 100%;
  height: 4px;
  background: linear-gradient(
    to right,
    var(--accent) var(--fill-pct, 0%),
    var(--slider-track) var(--fill-pct, 0%)
  );
  border-radius: var(--r-pill);
  appearance: none;
  /* stylelint-disable-next-line property-no-vendor-prefix */
  -webkit-appearance: none;
  cursor: pointer;
}

.slider:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.slider::-webkit-slider-thumb {
  appearance: none;
  /* stylelint-disable-next-line property-no-vendor-prefix */
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid var(--surface);
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid var(--surface);
  cursor: pointer;
}

.slider-wrap__marks {
  display: flex;
  gap: 3px;
}

.slider-wrap__mark {
  flex: 1;
  height: 3px;
  background: var(--surface-sunk);
  border-radius: 1.5px;
}

.slider-wrap__mark.is-on {
  background: var(--accent);
}

.slider-wrap__caption {
  display: flex;
  justify-content: space-between;
  font-size: var(--fs-xs);
  color: var(--text-faint);
  font-family: var(--font-mono), monospace;
}
</style>
