<template>
  <div class="lobby__time">
    <button
      v-for="t in TIME_CONTROL_OPTIONS"
      :key="t.value"
      class="tcard"
      :class="{ 'is-active': modelValue === t.value }"
      @click="emit('update:modelValue', t.value)"
    >
      <span class="tcard__main">{{ t.label }}</span>
      <span class="tcard__sub">{{ t.sub }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import {
  TIME_CONTROL_OPTIONS,
} from '@app/features/game/config/time-controls.js';

defineProps<{ modelValue: string }>();
const emit = defineEmits<{ 'update:modelValue': [string] }>();
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.lobby__time {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--sp-2);

  @include m.mobile { grid-template-columns: repeat(2, 1fr); }
}

.tcard {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: var(--sp-3);
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: var(--r-md);
  cursor: pointer;
  transition: all var(--dur-base);
  text-align: left;

  &:hover { border-color: var(--border-strong); }

  &.is-active {
    border-color: var(--accent);
    background: var(--accent-soft);
    color: var(--accent-ink);
  }
}

.tcard__main {
  font-family: var(--font-display);
  font-size: var(--fs-lg);
  font-weight: 600;
  color: var(--text);

  .is-active & { color: var(--accent); }
}

.tcard__sub {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  color: var(--text-faint);
}
</style>
