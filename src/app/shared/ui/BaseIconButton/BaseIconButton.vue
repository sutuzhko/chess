<template>
  <button
    type="button"
    class="icon-btn"
    :class="classes"
    :disabled="disabled"
    :aria-label="ariaLabel"
    :title="title"
    @click="onClick"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type Variant = 'outline' | 'ghost' | 'danger' | 'accent';
type Size = 'sm' | 'md' | 'lg';

const props = withDefaults(defineProps<{
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  ariaLabel?: string;
  title?: string;
}>(), {
  variant: 'outline',
  size: 'md',
  disabled: false,
  ariaLabel: '',
  title: '',
});

const emit = defineEmits<{ click: [event: MouseEvent] }>();

const classes = computed<string[]>(() => [
  `icon-btn--${props.variant}`,
  `icon-btn--${props.size}`,
]);

function onClick(event: MouseEvent): void {
  if (props.disabled) return;
  emit('click', event);
}
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  padding: 0;
  background: transparent;
  color: var(--text-muted);
  border: 1px solid transparent;
  border-radius: var(--r-sm);
  cursor: pointer;
  transition: border-color var(--dur-base), color var(--dur-base), background var(--dur-base);

  @include m.focus-ring;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.icon-btn--sm {
  width: 28px;
  height: 28px;
}

.icon-btn--md {
  width: 32px;
  height: 32px;
}

.icon-btn--lg {
  width: 36px;
  height: 36px;
}

.icon-btn :slotted(svg) {
  width: 16px;
  height: 16px;
}

.icon-btn--lg :slotted(svg) {
  width: 18px;
  height: 18px;
}

.icon-btn--outline {
  border-color: var(--border);

  &:hover:not(:disabled) {
    background: var(--surface-hover);
    color: var(--text);
    border-color: var(--border-strong);
  }
}

.icon-btn--ghost {
  &:hover:not(:disabled) {
    background: var(--surface-hover);
    color: var(--text);
  }
}

.icon-btn--danger {
  border-color: var(--border);

  &:hover:not(:disabled) {
    color: var(--danger);
    border-color: var(--danger);
  }
}

.icon-btn--accent {
  border-color: var(--border);

  &:hover:not(:disabled) {
    color: var(--accent);
    border-color: var(--accent);
  }
}
</style>
