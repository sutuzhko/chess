<template>
  <button
    type="button"
    class="swatch"
    :class="{ 'is-active': active }"
    :style="cssVars"
    :aria-label="ariaLabel"
    :aria-pressed="active"
    @click="$emit('click')"
  >
    <span class="swatch__dot" />
    <span
      v-if="label"
      class="swatch__label"
    >{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  color: string;
  active?: boolean;
  label?: string;
  ariaLabel?: string;
}>(), {
  active: false,
  label: '',
  ariaLabel: 'palette swatch',
});

defineEmits<{ click: [] }>();

const cssVars = computed<Record<string, string>>(() => ({
  '--swatch-color': props.color,
}));
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.swatch {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: var(--sp-2);
  background: transparent;
  border: 0;
  border-radius: var(--r-md);
  cursor: pointer;
  transition: background var(--dur-base) var(--ease-out);

  @include m.focus-ring;
}

.swatch:hover {
  background: var(--surface-hover);
}

.swatch__dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--swatch-color);
  border: 2px solid var(--border);
  transition: border-color var(--dur-base), transform var(--dur-fast);
}

.swatch:hover .swatch__dot {
  border-color: var(--border-strong);
}

.swatch.is-active .swatch__dot {
  border-color: var(--accent);
  transform: scale(1.05);
  box-shadow: var(--shadow-sm);
}

.swatch__label {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  font-weight: 500;
}

.swatch.is-active .swatch__label {
  color: var(--text);
}
</style>
