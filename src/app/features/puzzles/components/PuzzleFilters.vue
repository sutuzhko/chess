<template>
  <section class="puzzle-filters">
    <div class="puzzle-filters__row">
      <div class="puzzle-filters__field">
        <span class="puzzle-filters__label">{{ s.filters.search }}</span>
        <SearchInput
          v-model="modelQuery"
          :placeholder="s.filters.searchPlaceholder"
        />
      </div>
      <div class="puzzle-filters__field">
        <span class="puzzle-filters__label">{{ s.filters.elo }}</span>
        <BaseSelect
          v-model="modelElo"
          :options="eloOptions"
        />
      </div>
      <BaseButton
        variant="ghost"
        class="puzzle-filters__reset"
        @click="$emit('reset')"
      >
        {{ s.filters.reset }}
      </BaseButton>
    </div>
    <div class="puzzle-filters__themes">
      <span class="puzzle-filters__label">{{ s.filters.themes }}</span>
      <div class="puzzle-filters__chips">
        <BaseChip
          v-for="t in PUZZLE_THEMES"
          :key="t.id"
          :active="filters.themes.includes(t.id)"
          @click="onThemeToggle(t.id)"
        >
          {{ t.label }}
        </BaseChip>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  PUZZLE_ELO_RANGES,
  type PuzzleEloRangeId,
} from '@app/features/puzzles/config/puzzle-elo-ranges.js';
import { PUZZLE_STRINGS } from '@app/features/puzzles/config/puzzle-strings.js';
import { PUZZLE_THEMES } from '@app/features/puzzles/config/puzzle-themes.js';
import type {
  PuzzleFilterState,
} from '@app/features/puzzles/types/puzzle-ui.types.js';
import BaseButton from '@app/shared/ui/BaseButton/BaseButton.vue';
import BaseChip from '@app/shared/ui/BaseChip/BaseChip.vue';
import BaseSelect, {
  type SelectOption,
} from '@app/shared/ui/BaseSelect/BaseSelect.vue';
import SearchInput from '@app/shared/ui/SearchInput/SearchInput.vue';
import { computed } from 'vue';

const props = defineProps<{ filters: PuzzleFilterState }>();
const emit = defineEmits<{
  (e: 'update:filters', value: PuzzleFilterState): void;
  (e: 'reset'): void;
}>();

const s = PUZZLE_STRINGS;

const modelQuery = computed<string>({
  get: () => props.filters.query,
  set: (v) => { emit('update:filters', { ...props.filters, query: v }); },
});

const modelElo = computed<string | number>({
  get: () => props.filters.elo,
  set: (v) => { emit('update:filters', { ...props.filters, elo: v as PuzzleEloRangeId }); },
});

const eloOptions = computed<SelectOption[]>(() =>
  PUZZLE_ELO_RANGES.map((r) => ({ value: r.id, label: r.label })),
);

function onThemeToggle(id: string): void {
  const themes = props.filters.themes.includes(id)
    ? props.filters.themes.filter((t) => t !== id)
    : [...props.filters.themes, id];
  emit('update:filters', { ...props.filters, themes });
}
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.puzzle-filters {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  background: var(--surface);
  padding: var(--sp-4);
  border-radius: var(--r-lg);
  border: 1px solid var(--border);
}

.puzzle-filters__row {
  display: grid;
  grid-template-columns: 2fr 1fr auto;
  gap: var(--sp-3);
  align-items: end;

  @include m.mobile {
    grid-template-columns: 1fr;
  }
}

.puzzle-filters__field {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}

.puzzle-filters__label {
  font-size: var(--fs-sm);
  color: var(--text);
  font-weight: 500;
}

.puzzle-filters__reset { white-space: nowrap; }

.puzzle-filters__themes {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.puzzle-filters__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}
</style>
