<template>
  <div
    class="op-catalog"
    role="dialog"
    aria-modal="true"
  >
    <OpeningsCatalogHead
      :search="search"
      :group="group"
      :groups="groups"
      :filtered-label="filteredLabel"
      :total-label="totalLabel"
      @update:search="search = $event"
      @update:group="group = $event"
      @close="emit('close')"
    />

    <OpeningsCatalogList
      :sections="sections"
      :repertoire="repertoire"
      :show-repertoire="showRepertoire"
      :active-name="activeName"
      :empty="filtered.length === 0"
      :truncated="truncated"
      :max-visible="maxVisible"
      :entry-name="entryName"
      @select="onSelect"
      @select-repertoire="onSelectRepertoire"
      @remove-repertoire="emit('removeRepertoire', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import {
  useOpeningsCatalog,
} from '@app/features/openings/composables/useOpeningsCatalog.js';
import type {
  RepertoireEntry,
} from '@app/features/openings/composables/useOpeningsRepertoire.js';
import type { OpeningDef } from '@modules/game/application';
import { computed, onBeforeUnmount, onMounted, toRef } from 'vue';
import { useI18n } from 'vue-i18n';
import OpeningsCatalogHead from './OpeningsCatalogHead.vue';
import OpeningsCatalogList from './OpeningsCatalogList.vue';

const props = defineProps<{
  catalog: readonly OpeningDef[];
  activeName: string;
  repertoire: readonly RepertoireEntry[];
}>();

const emit = defineEmits<{
  select: [entry: OpeningDef];
  removeRepertoire: [fen: string];
  close: [];
}>();

const { t } = useI18n();

const {
  search, group, groups, maxVisible,
  filtered, sections, truncated, filteredLabel, totalLabel,
} = useOpeningsCatalog({ catalog: toRef(props, 'catalog') });

const showRepertoire = computed(
  () => props.repertoire.length > 0 && search.value.trim() === '',
);

function entryName(entry: RepertoireEntry): string {
  if (entry.name) return t(entry.name);
  return entry.eco || t('openings.startPosition');
}

function onSelect(entry: OpeningDef): void {
  emit('select', entry);
  emit('close');
}

function onSelectRepertoire(entry: RepertoireEntry): void {
  onSelect({
    name: entry.name ?? '',
    moves: entry.moves,
    ...(entry.eco ? { eco: entry.eco } : {}),
  });
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') emit('close');
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped lang="scss">
.op-catalog {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-4);
  background: var(--bg);
}
</style>
