<template>
  <BaseCard
    padding="md"
    class="op-summary"
  >
    <div class="op-summary__head">
      <span class="t-eyebrow">{{ $t('openings.positionTotal') }}</span>
      <span
        v-if="summary"
        class="t-mono t-faint op-summary__games"
      >{{ gamesLabel }}</span>
    </div>
    <div
      v-if="summary"
      class="op-wdb"
    >
      <span
        class="op-wdb__seg op-wdb__seg--w"
        :style="{ flexGrow: summary.white }"
      >{{ summary.white }}%</span>
      <span
        class="op-wdb__seg op-wdb__seg--d"
        :style="{ flexGrow: summary.draw }"
      >{{ summary.draw }}%</span>
      <span
        class="op-wdb__seg op-wdb__seg--b"
        :style="{ flexGrow: summary.black }"
      >{{ summary.black }}%</span>
    </div>
    <p
      v-else
      class="op-summary__empty t-faint"
    >
      {{ $t('openings.noStats') }}
    </p>
  </BaseCard>
</template>

<script setup lang="ts">
import type {
  PositionSummary,
} from '@app/features/openings/utils/openings-stats.js';
import BaseCard from '@app/shared/ui/BaseCard/BaseCard.vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{ summary: PositionSummary | null }>();

const { locale } = useI18n();

const gamesLabel = computed(() =>
  props.summary
    ? new Intl.NumberFormat(locale.value).format(props.summary.games)
    : '',
);
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;
@include m.typography-helpers;

.op-summary__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sp-3) var(--sp-3) 0;
}

.op-summary__games {
  font-size: var(--fs-xs);
}

.op-wdb {
  display: flex;
  height: 28px;
  border-radius: var(--r-sm);
  overflow: hidden;
  font-family: var(--font-mono), monospace;
  font-size: var(--fs-xs);
  font-weight: 600;
}

.op-wdb__seg {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  flex-basis: 0;
  overflow: hidden;
  white-space: nowrap;
}

.op-wdb__seg--w {
  background: var(--eval-white);
  color: var(--eval-white-text);
}

.op-wdb__seg--d {
  background: var(--text-faint);
  color: var(--surface);
}

.op-wdb__seg--b {
  background: var(--eval-black);
  color: var(--eval-black-text);
}

.op-summary__empty {
  margin: 0;
  font-size: var(--fs-sm);
}
</style>
