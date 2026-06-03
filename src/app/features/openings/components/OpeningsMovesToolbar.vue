<template>
  <div class="op-toolbar">
    <div class="op-toolbar__group">
      <span class="t-eyebrow op-toolbar__lbl">{{ $t('openings.sortLabel') }}</span>
      <Segmented
        :model-value="sort"
        :options="sortOptions"
        @update:model-value="emit('update:sort', $event)"
      />
    </div>

    <label
      v-if="maxGames > 0"
      class="op-toolbar__group op-toolbar__filter"
    >
      <span class="t-eyebrow op-toolbar__lbl">
        {{ $t('openings.minGames', { count: minGamesLabel }) }}
      </span>
      <Slider
        :model-value="minGames"
        :min="0"
        :max="OPENINGS_MIN_GAMES_MAX"
        :step="step"
        :aria-label="$t('openings.minGames', { count: minGamesLabel })"
        @update:model-value="emit('update:minGames', $event)"
      />
    </label>
  </div>
</template>

<script setup lang="ts">
import {
  OPENINGS_MIN_GAMES_MAX,
  OPENINGS_MIN_GAMES_STEP,
  OPENINGS_SORT_OPTIONS,
  type OpeningsSort,
} from '@app/features/openings/config/openings-constants.js';
import Segmented from '@app/shared/ui/Segmented/Segmented.vue';
import type { SegmentedOption } from '@app/shared/ui/Segmented/types.js';
import Slider from '@app/shared/ui/Slider/Slider.vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  sort: OpeningsSort;
  minGames: number;
  maxGames: number;
}>();

const emit = defineEmits<{
  'update:sort': [value: OpeningsSort];
  'update:minGames': [value: number];
}>();

const { t, locale } = useI18n();

const step = OPENINGS_MIN_GAMES_STEP;

const sortOptions = computed<readonly SegmentedOption<OpeningsSort>[]>(() =>
  OPENINGS_SORT_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
);

const minGamesLabel = computed(() =>
  new Intl.NumberFormat(locale.value).format(props.minGames),
);
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;
@include m.typography-helpers;

.op-toolbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px var(--sp-3);
  border-bottom: 1px solid var(--border);
  background: var(--surface-sunk);
}

.op-toolbar__group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.op-toolbar__lbl {
  font-size: 10px;
  color: var(--text-faint);
}

.op-toolbar__filter {
  width: 100%;
}
</style>
