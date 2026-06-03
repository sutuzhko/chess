<template>
  <span
    class="avatar"
    :class="[`avatar--${size}`, { 'avatar--brand': brand }]"
    :title="name"
  >
    <slot>{{ initial }}</slot>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  brand?: boolean;
}>(), {
  name: '',
  size: 'md',
  brand: false,
});

const initial = computed<string>(() => {
  if (!props.name) return '·';
  const trimmed = props.name.trim();
  return trimmed.charAt(0).toUpperCase();
});
</script>

<style scoped lang="scss">
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--surface-2);
  color: var(--text-muted);
  font-weight: 600;
  font-size: var(--fs-sm);
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid var(--border);
}

.avatar--sm {
  width: 28px;
  height: 28px;
  font-size: var(--fs-xs);
}

.avatar--md {
  width: 36px;
  height: 36px;
}

.avatar--lg {
  width: 48px;
  height: 48px;
  font-size: var(--fs-base);
}

.avatar--xl {
  width: 64px;
  height: 64px;
  font-size: var(--fs-lg);
}

.avatar--brand {
  background: var(--accent);
  color: var(--accent-fg);
  border-color: var(--accent);
}
</style>
