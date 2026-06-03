<template>
  <button
    type="button"
    class="base-chip"
    :class="{ 'is-active': active }"
    :aria-pressed="active"
    @click="onClick"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ active?: boolean }>(), { active: false });
const emit = defineEmits<{ click: [event: MouseEvent] }>();

function onClick(event: MouseEvent): void {
  emit('click', event);
}
// Ссылаемся на props, чтобы ESLint не помечал их как unused (используются только в template).
void props;
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.base-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 var(--sp-3);
  font-family: var(--font-sans);
  font-size: var(--fs-xs);
  font-weight: 500;
  color: var(--text-muted);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--r-pill);
  cursor: pointer;
  transition:
    background var(--dur-base) var(--ease-out),
    color var(--dur-base) var(--ease-out),
    border-color var(--dur-base) var(--ease-out);

  @include m.focus-ring;
}

.base-chip:hover {
  color: var(--text);
  background: var(--surface-hover);
}

.base-chip.is-active {
  background: var(--accent-soft);
  color: var(--accent);
  border-color: transparent;
}

@media (pointer: coarse) {
  .base-chip {
    min-height: 44px;
  }
}
</style>
