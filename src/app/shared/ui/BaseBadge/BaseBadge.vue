<template>
  <span :class="classes">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type Tone = 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'solid';
type Size = 'sm' | 'md' | 'lg';

const props = withDefaults(defineProps<{
  tone?: Tone;
  size?: Size;
  mono?: boolean;
  dot?: boolean;
  paddingZero?: boolean;
}>(), {
  tone: 'default',
  size: 'md',
  mono: false,
  dot: false,
  paddingZero: false,
});

const classes = computed<string[]>(() => {
  const list = ['base-badge', `base-badge--${props.tone}`, `base-badge--${props.size}`];
  if (props.mono) list.push('base-badge--mono');
  if (props.dot) list.push('base-badge--dot');
  if (props.paddingZero) list.push('base-badge--padding-zero');
  return list;
});
</script>

<style scoped lang="scss">
.base-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 22px;
  padding: 0 8px;
  font-family: var(--font-sans), sans-serif;
  font-size: var(--fs-xs);
  font-weight: 500;
  border-radius: var(--r-pill);
  background: var(--surface-2);
  color: var(--text-muted);
  border: 1px solid var(--border);
  white-space: nowrap;
}

.base-badge--default {
  background: var(--surface-2);
  color: var(--text-muted);
  border-color: var(--border);
}

.base-badge--accent {
  background: var(--accent-soft);
  color: var(--accent);
  border-color: transparent;
}

.base-badge--success {
  background: var(--success-soft);
  color: var(--success);
  border-color: transparent;
}

.base-badge--warning {
  background: var(--warning-soft);
  color: var(--warning);
  border-color: transparent;
}

.base-badge--danger {
  background: var(--danger-soft);
  color: var(--danger);
  border-color: transparent;
}

.base-badge--info {
  background: var(--info-soft);
  color: var(--info);
  border-color: transparent;
}

.base-badge--solid {
  background: transparent;
  color: var(--accent-fg);
  border-color: transparent;
}

[data-theme="dark"] .base-badge--solid {
  color: #fff;
}

.base-badge--sm {
  height: 18px;
  padding: 0 6px;
  font-size: var(--fs-2xs);
}

.base-badge--md {
  height: 22px;
}

.base-badge--lg {
  height: 26px;
  padding: 0 10px;
  font-size: var(--fs-sm);
}

.base-badge--mono {
  font-family: var(--font-mono), sans-serif;
  font-feature-settings: "tnum";
  letter-spacing: 0.02em;
}

.base-badge--dot::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentcolor;
}

.base-badge--padding-zero {
  padding: 0;
}
</style>
