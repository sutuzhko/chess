<template>
  <div
    ref="rootEl"
    class="op-bcrumbs"
  >
    <template v-if="breadcrumbs.length > 0">
      <span
        v-for="bc in breadcrumbs"
        :key="bc.number"
        class="op-bcrumb"
      >
        <span class="op-bcrumb__num">{{ bc.number }}.</span>
        <button
          type="button"
          class="op-bcrumb__san"
          :class="{ 'is-active': ply === bc.number * 2 - 1 }"
          @click="emit('goToPly', bc.number * 2 - 1)"
        >{{ bc.white }}</button>
        <button
          v-if="bc.black"
          type="button"
          class="op-bcrumb__san"
          :class="{ 'is-active': ply === bc.number * 2 }"
          @click="emit('goToPly', bc.number * 2)"
        >{{ bc.black }}</button>
        <span
          v-else
          class="op-bcrumb__san op-bcrumb__san--placeholder"
        >·</span>
      </span>
      <span class="op-bcrumbs__hint t-faint">{{ $t('openings.mainLine') }}</span>
    </template>
    <template v-else>
      <span class="op-bcrumbs__advice t-muted">{{ $t('openings.advice') }}</span>
      <span class="op-bcrumbs__hint t-faint">
        {{ eco ? `${eco} · ` : '' }}{{ titleKey ? $t(titleKey) : $t('openings.startPosition') }}
      </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import type {
  Breadcrumb,
} from '@app/features/openings/composables/useOpeningsExplorer.js';
import { nextTick, ref, watch } from 'vue';

const props = defineProps<{
  breadcrumbs: readonly Breadcrumb[];
  ply: number;
  eco: string;
  titleKey: string;
}>();

const emit = defineEmits<{ goToPly: [ply: number] }>();

const rootEl = ref<HTMLElement | null>(null);

watch(
  () => props.ply,
  async () => {
    await nextTick();
    const el = rootEl.value;
    if (!el) return;
    el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
  },
);
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;
@include m.typography-helpers;

.op-bcrumbs {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 12px;
  padding: 7px 14px;
  min-height: 38px;
  background: var(--surface-sunk);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  overflow: auto hidden;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
}

.op-bcrumb {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  flex-shrink: 0;
}

.op-bcrumb__num {
  font-family: var(--font-mono), monospace;
  font-size: var(--fs-xs);
  color: var(--text-faint);
}

.op-bcrumb__san {
  font-family: var(--font-mono), monospace;
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--text-muted);
  padding: 2px 6px;
  border: 0;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;

  &:hover { color: var(--text); }

  &.is-active {
    background: var(--accent-soft);
    color: var(--accent);
  }

  &--placeholder {
    color: var(--text-faint);
    font-weight: 400;
    cursor: default;
  }
}

.op-bcrumbs__advice {
  font-size: var(--fs-sm);
  flex-shrink: 0;
  white-space: nowrap;
}

.op-bcrumbs__hint {
  margin-left: auto;
  padding-left: var(--sp-3);
  font-size: var(--fs-xs);
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
