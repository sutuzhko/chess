<template>
  <div class="op-catalog-list scroll">
    <div
      v-if="showRepertoire"
      class="op-catalog-list__section"
    >
      <div class="op-catalog-list__section-head">
        <span class="op-catalog-list__section-title op-catalog-list__section-title--rep">
          ★ {{ $t('openings.repertoireSection') }}
        </span>
        <span class="t-mono t-faint op-catalog-list__section-count">{{ repertoire.length }}</span>
      </div>
      <div class="op-catalog-list__items">
        <div
          v-for="entry in repertoire"
          :key="entry.fen"
          class="op-catalog-list__rep-row"
        >
          <button
            type="button"
            class="op-catalog-list__item"
            @click="emit('selectRepertoire', entry)"
          >
            <span class="op-catalog-list__code t-mono">{{ entry.eco }}</span>
            <span class="op-catalog-list__name">{{ entryName(entry) }}</span>
          </button>
          <button
            type="button"
            class="op-catalog-list__rep-remove"
            :aria-label="$t('openings.repertoireRemove')"
            @click="emit('removeRepertoire', entry.fen)"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <p
      v-if="empty"
      class="op-catalog-list__empty t-faint"
    >
      {{ $t('openings.searchEmpty') }}
    </p>
    <div
      v-for="section in sections"
      :key="section.letter"
      class="op-catalog-list__section"
    >
      <div class="op-catalog-list__section-head">
        <span class="op-catalog-list__section-title">
          {{ $t('openings.catalogGroup', { group: section.letter }) }}
        </span>
        <span class="t-mono t-faint op-catalog-list__section-count">{{ section.items.length }}</span>
      </div>
      <div class="op-catalog-list__items">
        <button
          v-for="entry in section.items"
          :key="`${entry.eco ?? ''}-${entry.name}`"
          type="button"
          class="op-catalog-list__item"
          :class="{ 'is-active': entry.name === activeName }"
          @click="emit('select', entry)"
        >
          <span class="op-catalog-list__code t-mono">{{ entry.eco }}</span>
          <span class="op-catalog-list__name">{{ $t(entry.name) }}</span>
        </button>
      </div>
    </div>
    <p
      v-if="truncated"
      class="op-catalog-list__more t-faint"
    >
      {{ $t('openings.catalogMore', { count: maxVisible }) }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type {
  RepertoireEntry,
} from '@app/features/openings/composables/useOpeningsRepertoire.js';
import type { OpeningDef } from '@modules/game/application';

defineProps<{
  sections: readonly { letter: string; items: OpeningDef[] }[];
  repertoire: readonly RepertoireEntry[];
  showRepertoire: boolean;
  activeName: string;
  empty: boolean;
  truncated: boolean;
  maxVisible: number;
  entryName: (entry: RepertoireEntry) => string;
}>();

const emit = defineEmits<{
  select: [entry: OpeningDef];
  selectRepertoire: [entry: RepertoireEntry];
  removeRepertoire: [fen: string];
}>();
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;
@include m.typography-helpers;

.op-catalog-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  background: var(--surface);
  max-width: 1100px;
  width: 100%;
}

.op-catalog-list__empty {
  margin: 0;
  padding: var(--sp-4);
  font-size: var(--fs-sm);
}

.op-catalog-list__section { padding: 6px 0; }

.op-catalog-list__section-head {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 8px 14px 6px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.op-catalog-list__section-title {
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
  font-weight: 600;

  &--rep { color: var(--accent); }
}

.op-catalog-list__rep-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;

  .op-catalog-list__item { min-width: 0; }
}

.op-catalog-list__rep-remove {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 0;
  border-radius: var(--r-sm);
  color: var(--text-faint);
  cursor: pointer;
  transition: background var(--dur-base), color var(--dur-base);

  &:hover {
    background: var(--surface-hover);
    color: var(--text);
  }
}

.op-catalog-list__section-count { font-size: var(--fs-xs); }

.op-catalog-list__items {
  padding: 4px;
  display: flex;
  flex-direction: column;
}

.op-catalog-list__item {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 0;
  background: transparent;
  border-radius: var(--r-sm);
  cursor: pointer;
  text-align: left;
  transition: background var(--dur-base);

  &:hover { background: var(--surface-hover); }

  &.is-active {
    background: var(--accent-soft);

    .op-catalog-list__code { color: var(--accent); }
  }
}

.op-catalog-list__code {
  font-size: var(--fs-xs);
  color: var(--text-faint);
  font-weight: 600;
}

.op-catalog-list__name {
  font-size: var(--fs-sm);
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.op-catalog-list__more {
  margin: 0;
  padding: var(--sp-3) var(--sp-4);
  font-size: var(--fs-xs);
  text-align: center;
}
</style>
