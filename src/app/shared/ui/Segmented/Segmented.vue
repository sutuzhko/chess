<template>
  <div
    class="segmented"
    :class="[`segmented--${size}`]"
    role="radiogroup"
  >
    <button
      v-for="opt in options"
      :key="String(opt.value)"
      type="button"
      role="radio"
      class="segmented__opt"
      :class="{ 'is-active': opt.value === modelValue }"
      :aria-checked="opt.value === modelValue"
      :disabled="opt.disabled"
      :data-value="String(opt.value)"
      @click="onSelect(opt.value)"
    >
      <span
        v-if="opt.marker"
        class="segmented__marker"
        aria-hidden="true"
      >{{ opt.marker }}</span>
      <span>{{ opt.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts" generic="T extends string | number">
import type { SegmentedOption } from './types.js';

withDefaults(defineProps<{
  modelValue: T;
  options: readonly SegmentedOption<T>[];
  size?: 'md' | 'lg';
}>(), {
  size: 'md',
});

const emit = defineEmits<{ 'update:modelValue': [value: T] }>();

function onSelect(value: T): void {
  emit('update:modelValue', value);
}
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.segmented {
  display: inline-flex;
  padding: 3px;
  gap: 2px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
}

.segmented__opt {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  padding: 0 var(--sp-3);
  font-family: var(--font-sans);
  font-size: var(--fs-sm);
  font-weight: 500;
  color: var(--text-muted);
  background: transparent;
  border: 0;
  border-radius: var(--r-sm);
  cursor: pointer;
  white-space: nowrap;
  transition:
    background var(--dur-base) var(--ease-out),
    color var(--dur-base) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out);

  @include m.focus-ring;
}

.segmented__opt:hover:not(:disabled, .is-active) {
  color: var(--text);
}

.segmented__opt:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.segmented__opt.is-active {
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow-xs);
}

.segmented--lg .segmented__opt {
  height: 38px;
  font-size: var(--fs-base);
  padding: 0 var(--sp-4);
}

@media (pointer: coarse) {
  .segmented__opt {
    min-height: 44px;
  }
}
</style>
