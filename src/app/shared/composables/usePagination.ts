import { computed, type ComputedRef, ref, type Ref, watch } from 'vue';

const DEFAULT_PAGE_SIZE = 12;

export interface UsePagination<T> {
  page: Ref<number>;
  pageCount: ComputedRef<number>;
  pageItems: ComputedRef<T[]>;
}

/**
 * Постраничная нарезка реактивного списка. Страница автоматически
 * прижимается к допустимому диапазону, когда исходный список меняется
 * (фильтры, удаление элемента).
 */
export function usePagination<T>(
  items: Ref<readonly T[]> | ComputedRef<readonly T[]>,
  pageSize: number = DEFAULT_PAGE_SIZE,
): UsePagination<T> {
  const page = ref(1);

  const pageCount = computed<number>(() =>
    Math.max(1, Math.ceil(items.value.length / pageSize)),
  );

  const pageItems = computed<T[]>(() => {
    const start = (page.value - 1) * pageSize;
    return items.value.slice(start, start + pageSize);
  });

  watch(pageCount, (count) => {
    if (page.value > count) page.value = count;
  });

  return { page, pageCount, pageItems };
}
