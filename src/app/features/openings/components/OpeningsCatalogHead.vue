<template>
  <div class="op-catalog-head">
    <div
      ref="searchWrap"
      class="op-catalog-head__search"
    >
      <SearchInput
        :model-value="search"
        :placeholder="$t('openings.catalogSearch')"
        @update:model-value="emit('update:search', $event)"
      />
      <span class="op-catalog-head__kbd t-mono">esc</span>
    </div>
    <div class="op-catalog-head__filters">
      <div class="op-catalog-head__groups">
        <BaseChip
          v-for="g in groups"
          :key="g"
          :active="group === g"
          @click="emit('update:group', g)"
        >
          {{ g === ALL ? $t('openings.catalogAll') : g }}
        </BaseChip>
      </div>
      <span class="op-catalog-head__count t-mono t-faint">
        {{ $t('openings.catalogCount', { shown: filteredLabel, total: totalLabel }) }}
      </span>
      <button
        type="button"
        class="op-catalog-head__close"
        :aria-label="$t('openings.catalogClose')"
        @click="emit('close')"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  OPENINGS_ECO_GROUP_ALL,
  type OpeningsCatalogFilter,
} from '@app/features/openings/config/openings-constants.js';
import BaseChip from '@app/shared/ui/BaseChip/BaseChip.vue';
import SearchInput from '@app/shared/ui/SearchInput/SearchInput.vue';
import { nextTick, onMounted, ref } from 'vue';

defineProps<{
  search: string;
  group: OpeningsCatalogFilter;
  groups: readonly OpeningsCatalogFilter[];
  filteredLabel: string;
  totalLabel: string;
}>();

const emit = defineEmits<{
  'update:search': [value: string];
  'update:group': [value: OpeningsCatalogFilter];
  close: [];
}>();

const ALL = OPENINGS_ECO_GROUP_ALL;
const searchWrap = ref<HTMLElement | null>(null);

onMounted(async () => {
  await nextTick();
  searchWrap.value?.querySelector('input')?.focus();
});
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;
@include m.typography-helpers;

.op-catalog-head {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
  width: 100%;
}

.op-catalog-head__search {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
}

.op-catalog-head__kbd {
  font-size: 11px;
  color: var(--text-faint);
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid var(--border);
  background: var(--surface-sunk);
}

.op-catalog-head__filters {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  flex-wrap: wrap;
}

.op-catalog-head__groups {
  display: flex;
  gap: var(--sp-1);
}

.op-catalog-head__count {
  font-size: var(--fs-xs);
  white-space: nowrap;
}

.op-catalog-head__close {
  margin-left: auto;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  color: var(--text);
  cursor: pointer;

  &:hover { background: var(--surface-hover); }
}
</style>
