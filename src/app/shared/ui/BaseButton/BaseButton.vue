<template>
  <button
    :type="type"
    :class="classes"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    @click="onClick"
  >
    <span
      v-if="loading"
      class="base-btn__spinner"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger' | 'danger-outline' | 'success';
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const props = withDefaults(defineProps<{
  variant?: Variant;
  size?: Size;
  type?: 'button' | 'submit' | 'reset';
  block?: boolean;
  disabled?: boolean;
  loading?: boolean;
  iconOnly?: boolean;
}>(), {
  variant: 'tertiary',
  size: 'md',
  type: 'button',
  block: false,
  disabled: false,
  loading: false,
  iconOnly: false,
});

const emit = defineEmits<{ click: [event: MouseEvent] }>();

const classes = computed<string[]>(() => {
  const list = ['base-btn', `base-btn--${props.variant}`, `base-btn--${props.size}`];
  if (props.block) list.push('base-btn--block');
  if (props.iconOnly) list.push('base-btn--icon');
  return list;
});

function onClick(event: MouseEvent): void {
  if (props.disabled || props.loading) return;
  emit('click', event);
}
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

/*
 * Konyom Hodi v3 — Button.
 * Источник: docs/design/v3-source/ui.css (`.btn`).
 */
.base-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: var(--fs-sm);
  letter-spacing: -0.005em;
  line-height: 1;
  border: 1px solid transparent;
  border-radius: var(--r-pill);
  padding: 0 var(--sp-4);
  height: 36px;
  white-space: nowrap;
  user-select: none;
  cursor: pointer;
  transition:
    background var(--dur-base) var(--ease-out),
    border-color var(--dur-base) var(--ease-out),
    color var(--dur-base) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out),
    transform var(--dur-fast) var(--ease-out);

  @include m.focus-ring;
}

.base-btn:active:not(:disabled) {
  transform: translateY(0.5px);
}

.base-btn:disabled,
.base-btn[aria-disabled="true"] {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Sizes */
.base-btn--xs {
  height: 28px;
  font-size: var(--fs-xs);
  padding: 0 var(--sp-3);
}

.base-btn--sm {
  height: 32px;
  font-size: var(--fs-sm);
  padding: 0 var(--sp-3);
}

.base-btn--md {
  height: 36px;
}

.base-btn--lg {
  height: 44px;
  font-size: var(--fs-base);
  padding: 0 var(--sp-5);
}

.base-btn--xl {
  height: 52px;
  font-size: var(--fs-md);
  padding: 0 var(--sp-6);
}

.base-btn--block {
  width: 100%;
}

/* На touch — гарантируем 44×44 даже для xs/sm. */
@media (pointer: coarse) {
  .base-btn--xs,
  .base-btn--sm {
    min-height: 44px;
  }
}

/* Variants */
.base-btn--primary {
  background: var(--accent);
  color: var(--accent-fg);
  border-color: var(--accent);
}

.base-btn--primary:hover:not(:disabled) {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

.base-btn--secondary {
  background: transparent;
  color: var(--accent);
  border-color: var(--accent);
}

.base-btn--secondary:hover:not(:disabled) {
  background: var(--accent-soft);
}

.base-btn--tertiary {
  background: var(--surface);
  color: var(--text);
  border-color: var(--border-strong);
}

.base-btn--tertiary:hover:not(:disabled) {
  background: var(--surface-hover);
}

.base-btn--ghost {
  background: transparent;
  color: var(--text-muted);
  border-color: transparent;
}

.base-btn--ghost:hover:not(:disabled) {
  background: var(--surface-hover);
  color: var(--text);
}

.base-btn--danger {
  background: var(--danger);
  color: #fff;
  border-color: var(--danger);
}

.base-btn--danger:hover:not(:disabled) {
  filter: brightness(1.08);
}

.base-btn--danger-outline {
  background: transparent;
  color: var(--danger);
  border-color: var(--danger);
}

.base-btn--danger-outline:hover:not(:disabled) {
  background: var(--danger);
  color: #fff;
}

.base-btn--success {
  background: var(--success);
  color: #fff;
  border-color: var(--success);
}

.base-btn--icon {
  padding: 0;
  width: 36px;
}

.base-btn__spinner {
  width: 12px;
  height: 12px;
  border: 2px solid currentcolor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: base-btn-spin 0.7s linear infinite;
}

@keyframes base-btn-spin {
  to { transform: rotate(360deg); }
}
</style>
