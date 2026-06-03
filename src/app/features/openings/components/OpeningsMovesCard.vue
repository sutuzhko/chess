<template>
  <BaseCard
    padding="none"
    class="op-moves"
  >
    <template #header>
      <span class="base-card__title">{{ title }}</span>
    </template>
    <template #header-actions>
      <span class="t-mono t-faint op-moves__count">
        {{ $t('openings.movesCount', { count: responses.length }) }}
      </span>
    </template>

    <OpeningsMovesToolbar
      :sort="sort"
      :min-games="minGames"
      :max-games="maxGames"
      @update:sort="emit('update:sort', $event)"
      @update:min-games="emit('update:minGames', $event)"
    />

    <div class="op-moves__list scroll">
      <p
        v-if="loading && responses.length === 0"
        class="op-moves__hint t-faint"
      >
        {{ $t('openings.loading') }}
      </p>
      <p
        v-else-if="responses.length === 0"
        class="op-moves__hint t-faint"
      >
        {{ $t('openings.endOfLine') }}
      </p>
      <OpeningMoveRow
        v-for="m in responses"
        :key="m.uci"
        :move="m"
        :move-prefix="movePrefix"
        :active="m.uci === activeUci"
        :in-repertoire="repertoireFens.has(m.afterFen ?? '')"
        @play="(uci, san) => emit('play', uci, san)"
        @hover="emit('hover', $event)"
        @hover-end="emit('hover-end')"
      />
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import type {
  OpeningsSort,
} from '@app/features/openings/config/openings-constants.js';
import type {
  ExplorerRow,
} from '@app/features/openings/utils/openings-stats.js';
import BaseCard from '@app/shared/ui/BaseCard/BaseCard.vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import OpeningMoveRow from './OpeningMoveRow.vue';
import OpeningsMovesToolbar from './OpeningsMovesToolbar.vue';

const props = defineProps<{
  responses: readonly ExplorerRow[];
  loading: boolean;
  movePrefix: string;
  sideToMove: 'white' | 'black';
  repertoireFens: ReadonlySet<string>;
  sort: OpeningsSort;
  minGames: number;
  maxGames: number;
  activeUci: string | null;
}>();

const emit = defineEmits<{
  'update:sort': [value: OpeningsSort];
  'update:minGames': [value: number];
  play: [uci: string, san: string];
  hover: [uci: string];
  'hover-end': [];
}>();

const { t } = useI18n();

const title = computed(() =>
  props.sideToMove === 'white'
    ? t('openings.responsesWhite')
    : t('openings.responsesBlack'),
);
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;
@include m.typography-helpers;
@include m.scroll;

.op-moves {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}

.op-moves :deep(.base-card__body) {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.op-moves__count {
  font-size: var(--fs-xs);
}

.op-moves__list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 4px;
}

@include m.tablet {
  .op-moves { flex: none; }

  .op-moves :deep(.base-card__body) { flex: none; }

  .op-moves__list {
    flex: none;
    max-height: 45dvh;
  }
}

.op-moves__hint {
  margin: 0;
  padding: var(--sp-2) var(--sp-3);
  font-size: var(--fs-sm);
}
</style>
