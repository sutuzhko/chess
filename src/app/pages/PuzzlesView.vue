<template>
  <main class="puzzles-view">
    <header class="puzzles-view__header">
      <div class="t-eyebrow">
        {{ s.eyebrow }}
      </div>
      <h1 class="puzzles-view__title">
        {{ s.pageTitle }}
      </h1>
      <p class="puzzles-view__sub">
        {{ s.pageSub }}
      </p>
    </header>

    <BaseTabs
      v-model="activeTab"
      class="puzzles-view__tabs"
      :tabs="tabs"
    />

    <section
      v-if="activeTab === 'library'"
      class="puzzles-view__panel"
    >
      <PuzzleFilters
        :filters="library.filters.value"
        @update:filters="(v) => library.filters.value = v"
        @reset="library.resetFilters"
      />
      <PuzzleGrid
        :puzzles="libraryItems"
        :empty-message="s.filters.empty"
        @open="(id) => openPuzzle(id, 'library')"
        @delete="onDelete"
        @edit="onEdit"
      />
      <BasePagination
        v-model="libraryPage"
        :page-count="libraryPageCount"
      />
    </section>

    <section
      v-else-if="activeTab === 'custom'"
      class="puzzles-view__panel"
    >
      <PuzzleGrid
        :puzzles="customItems"
        :empty-message="s.empty.custom"
        @open="(id) => openPuzzle(id, 'custom')"
        @delete="onDelete"
        @edit="onEdit"
      />
      <BasePagination
        v-model="customPage"
        :page-count="customPageCount"
      />
    </section>

    <section
      v-else
      class="puzzles-view__panel"
    >
      <PuzzleEditor
        :key="editorKey"
        v-bind="editorBinds"
        @save="onPuzzleCreated"
      />
    </section>
  </main>
</template>

<script setup lang="ts">
import PuzzleEditor from '@app/features/puzzles/components/PuzzleEditor.vue';
import PuzzleFilters from '@app/features/puzzles/components/PuzzleFilters.vue';
import PuzzleGrid from '@app/features/puzzles/components/PuzzleGrid.vue';
import {
  usePuzzleLibrary,
} from '@app/features/puzzles/composables/usePuzzleLibrary.js';
import { PUZZLE_STRINGS } from '@app/features/puzzles/config/puzzle-strings.js';
import { usePagination } from '@app/shared/composables/usePagination.js';
import BasePagination from '@app/shared/ui/BasePagination/BasePagination.vue';
import BaseTabs, { type TabItem } from '@app/shared/ui/BaseTabs/BaseTabs.vue';
import type { PuzzleData } from '@modules/game/domain/puzzles';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const s = { ...PUZZLE_STRINGS, eyebrow: 'ЗАДАЧИ · ТРЕНИРОВКА' };
const library = usePuzzleLibrary();
const route = useRoute();
const router = useRouter();

const {
  page: libraryPage,
  pageCount: libraryPageCount,
  pageItems: libraryItems,
} = usePagination(library.filteredPuzzles);

const {
  page: customPage,
  pageCount: customPageCount,
  pageItems: customItems,
} = usePagination(library.customPuzzles);

watch(library.filters, () => { libraryPage.value = 1; }, { deep: true });

const queryTab = typeof route.query.tab === 'string' ? route.query.tab : '';
const queryEditId = typeof route.query.edit === 'string' ? route.query.edit : '';
const initialActiveTab: 'library' | 'custom' | 'create' =
  queryEditId
    ? 'create'
    : queryTab === 'create' || queryTab === 'custom'
      ? queryTab
      : 'library';
const initialFen = typeof route.query.fen === 'string' ? route.query.fen : undefined;

const activeTab = ref<'library' | 'custom' | 'create'>(initialActiveTab);
const editingId = ref<string>(queryEditId);

const editingPuzzle = computed<PuzzleData | null>(
  () => (editingId.value ? library.getCustom(editingId.value) : null),
);

const editorKey = computed<string>(() => editingId.value || 'new');

const editorBinds = computed<Record<string, unknown>>(() => {
  if (editingPuzzle.value) return { initialPuzzle: editingPuzzle.value };
  if (initialFen) return { initialFen };
  return {};
});

const tabs = computed<TabItem[]>(() => [
  { key: 'library', label: s.tabs.library, count: library.bundledPuzzles.value.length },
  { key: 'custom', label: s.tabs.custom, count: library.customPuzzles.value.length },
  { key: 'create', label: s.tabs.create },
]);

watch(activeTab, (tab) => {
  if (tab !== 'create' && editingId.value) {
    editingId.value = '';
    void router.replace({ query: { ...route.query, edit: undefined } });
  }
});

function openPuzzle(id: string, from: 'library' | 'custom'): void {
  void router.push({
    name: 'puzzle-solve',
    params: { id },
    query: from === 'custom' ? { from: 'custom' } : {},
  });
}

function onDelete(id: string): void {
  library.deleteCustom(id);
}

function onEdit(id: string): void {
  editingId.value = id;
  activeTab.value = 'create';
  void router.replace({ query: { ...route.query, tab: 'create', edit: id } });
}

function onPuzzleCreated(data: PuzzleData): void {
  library.saveCustom(data);
}
</script>

<style scoped lang="scss">
@use '../assets/mixins' as m;
@include m.typography-helpers;

.puzzles-view {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: var(--sp-6) var(--sp-5) calc(var(--sp-8) + 80px);
  display: flex;
  flex-direction: column;
  gap: var(--sp-6);
}

.puzzles-view__header {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}

.puzzles-view__title {
  font-family: var(--font-display), sans-serif;
  font-size: var(--fs-3xl);
  font-weight: 700;
  letter-spacing: var(--tracking-tighter);
  margin: 0;
  color: var(--text);
}

.puzzles-view__sub {
  margin: 0;
  font-size: var(--fs-md);
  color: var(--text-muted);
}

.puzzles-view__panel {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.puzzles-view__tabs {
  /* tabs already use border-bottom */
}
</style>
