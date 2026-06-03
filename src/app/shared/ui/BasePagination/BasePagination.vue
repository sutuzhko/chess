<template>
  <nav
    v-if="pageCount > 1"
    class="base-pagination"
    role="navigation"
    :aria-label="ariaLabel"
  >
    <button
      type="button"
      class="base-pagination__nav"
      :disabled="modelValue <= 1"
      :aria-label="prevLabel"
      @click="goTo(modelValue - 1)"
    >
      <AppIcon
        name="arrow-left"
        :size="18"
      />
    </button>

    <ul class="base-pagination__list">
      <li
        v-for="(item, idx) in items"
        :key="`${item.type}-${idx}`"
        class="base-pagination__item"
      >
        <span
          v-if="item.type === 'gap'"
          class="base-pagination__gap"
          aria-hidden="true"
        >…</span>
        <button
          v-else
          type="button"
          class="base-pagination__page"
          :class="{ 'is-active': item.page === modelValue }"
          :aria-current="item.page === modelValue ? 'page' : undefined"
          @click="goTo(item.page)"
        >
          {{ item.page }}
        </button>
      </li>
    </ul>

    <button
      type="button"
      class="base-pagination__nav"
      :disabled="modelValue >= pageCount"
      :aria-label="nextLabel"
      @click="goTo(modelValue + 1)"
    >
      <AppIcon
        name="arrow-right"
        :size="18"
      />
    </button>
  </nav>
</template>

<script setup lang="ts">
import AppIcon from '@app/shared/ui/AppIcon/AppIcon.vue';
import { computed } from 'vue';

interface PageItem {
  type: 'page' | 'gap';
  page: number;
}

const props = withDefaults(defineProps<{
  modelValue: number;
  pageCount: number;
  siblingCount?: number;
  ariaLabel?: string;
  prevLabel?: string;
  nextLabel?: string;
}>(), {
  siblingCount: 1,
  ariaLabel: 'Постраничная навигация',
  prevLabel: 'Назад',
  nextLabel: 'Вперёд',
});

const emit = defineEmits<{ 'update:modelValue': [page: number] }>();

const items = computed<readonly PageItem[]>(() => {
  const total = props.pageCount;
  const current = props.modelValue;
  const sib = props.siblingCount;
  const pages = new Set<number>([1, total]);

  for (let p = current - sib; p <= current + sib; p++) {
    if (p >= 1 && p <= total) pages.add(p);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: PageItem[] = [];
  let prev = 0;
  for (const page of sorted) {
    if (page - prev > 1) result.push({ type: 'gap', page: -1 });
    result.push({ type: 'page', page });
    prev = page;
  }
  return result;
});

function goTo(page: number): void {
  const clamped = Math.min(Math.max(page, 1), props.pageCount);
  if (clamped !== props.modelValue) emit('update:modelValue', clamped);
}
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.base-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
}

.base-pagination__list {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  list-style: none;
  margin: 0;
  padding: 0;
}

.base-pagination__nav,
.base-pagination__page {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  padding: 0 var(--sp-2);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  font-family: var(--font-sans);
  font-size: var(--fs-sm);
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  transition: color var(--dur-base), border-color var(--dur-base), background var(--dur-base);

  @include m.focus-ring;
}

.base-pagination__nav:hover:not(:disabled),
.base-pagination__page:hover {
  color: var(--text);
  border-color: var(--border-strong);
}

.base-pagination__nav:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.base-pagination__page.is-active {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--accent);
}


.base-pagination__gap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 36px;
  color: var(--text-faint);
}

@media (pointer: coarse) {
  .base-pagination__nav,
  .base-pagination__page {
    min-width: 44px;
    height: 44px;
  }
}
</style>
