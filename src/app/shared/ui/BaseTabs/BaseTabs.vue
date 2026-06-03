<template>
  <nav
    class="base-tabs"
    role="tablist"
  >
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      role="tab"
      class="base-tabs__item"
      :class="{ 'is-active': tab.key === modelValue }"
      :aria-selected="tab.key === modelValue"
      @click="onSelect(tab.key)"
    >
      <span>{{ tab.label }}</span>
      <span
        v-if="tab.count !== undefined"
        class="base-tabs__count"
      >{{ tab.count }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
export interface TabItem {
  key: string;
  label: string;
  count?: number;
}

defineProps<{
  modelValue: string;
  tabs: readonly TabItem[];
}>();

const emit = defineEmits<{ 'update:modelValue': [key: string] }>();

function onSelect(key: string): void {
  emit('update:modelValue', key);
}
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.base-tabs {
  display: flex;
  gap: var(--sp-5);
  border-bottom: 1px solid var(--border);
}

.base-tabs__item {
  background: transparent;
  border: 0;
  padding: var(--sp-3) 0;
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: var(--fs-base);
  font-weight: 500;
  color: var(--text-muted);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: color var(--dur-base), border-color var(--dur-base);

  @include m.focus-ring;
}

.base-tabs__item:hover {
  color: var(--text);
}

.base-tabs__item.is-active {
  color: var(--text);
  border-bottom-color: var(--accent);
}

.base-tabs__count {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  font-weight: 500;
  padding: 0 6px;
  height: 18px;
  line-height: 18px;
  border-radius: var(--r-pill);
  background: var(--surface-2);
  color: var(--text-muted);
}

.base-tabs__item.is-active .base-tabs__count {
  background: var(--accent-soft);
  color: var(--accent);
}

@media (pointer: coarse) {
  .base-tabs__item {
    min-height: 44px;
  }
}
</style>
