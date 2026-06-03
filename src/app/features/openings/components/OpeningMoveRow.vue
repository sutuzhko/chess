<template>
  <button
    type="button"
    class="op-row"
    :class="{ 'is-active': active }"
    @click="emit('play', move.uci, move.san)"
    @mouseenter="emit('hover', move.uci)"
    @mouseleave="emit('hover-end')"
    @focus="emit('hover', move.uci)"
    @blur="emit('hover-end')"
  >
    <span class="op-row__line1">
      <span class="op-row__san t-mono">
        {{ movePrefix }}{{ move.san }}
        <span
          v-if="inRepertoire || move.main"
          class="op-row__star"
          :class="{ 'is-filled': inRepertoire }"
          :title="inRepertoire ? $t('openings.inRepertoire') : $t('openings.mainLine')"
        ><AppIcon
          name="star"
          :size="12"
        /></span>
      </span>
      <span class="op-row__eco t-mono">{{ move.eco ?? '' }}</span>
      <span class="op-row__name">{{ move.nameKey ? $t(move.nameKey) : '' }}</span>
      <span class="op-row__rating t-mono">{{ move.rating ? `Ø${move.rating}` : '' }}</span>
    </span>

    <span class="op-row__line2">
      <span class="op-freq">
        <span
          class="op-freq__fill"
          :style="{ width: `${move.freqPct}%` }"
        />
      </span>
      <span class="op-row__freqval t-mono">{{ freqLabel }}</span>
    </span>

    <span
      v-if="move.wdl"
      class="op-mini"
      :title="wdlTitle"
    >
      <span
        class="op-mini__w"
        :style="{ flexGrow: move.wdl[0] }"
      />
      <span
        class="op-mini__d"
        :style="{ flexGrow: move.wdl[1] }"
      />
      <span
        class="op-mini__b"
        :style="{ flexGrow: move.wdl[2] }"
      />
    </span>
  </button>
</template>

<script setup lang="ts">
import type {
  ExplorerRow,
} from '@app/features/openings/utils/openings-stats.js';
import AppIcon from '@app/shared/ui/AppIcon/AppIcon.vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  move: ExplorerRow;
  movePrefix: string;
  active: boolean;
  inRepertoire: boolean;
}>();

const emit = defineEmits<{
  play: [uci: string, san: string];
  hover: [uci: string];
  'hover-end': [];
}>();

const { t } = useI18n();

const freqLabel = computed(() => {
  const pct = props.move.freqPct;
  return pct >= 1 ? `${pct.toFixed(0)}%` : `${pct.toFixed(1)}%`;
});

const wdlTitle = computed(() => {
  const [white, draw, black] = props.move.wdl ?? [0, 0, 0];
  return t('openings.statsTooltip', {
    white,
    draw,
    black,
    games: props.move.games ?? 0,
  });
});
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;
@include m.typography-helpers;

.op-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  padding: 8px 10px;
  border: 0;
  background: transparent;
  border-radius: var(--r-sm);
  cursor: pointer;
  text-align: left;
  transition: background var(--dur-base);

  &:hover { background: var(--surface-hover); }

  &.is-active { background: var(--accent-soft); }
}

.op-row__line1 {
  display: grid;
  grid-template-columns: minmax(54px, max-content) 34px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: baseline;
}

.op-row__san {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--text);
}

.op-row__star {
  display: inline-flex;
  color: var(--accent);

  &.is-filled .app-icon {
    fill: currentcolor;
  }
}

.op-row__eco {
  font-size: var(--fs-xs);
  color: var(--text-faint);
}

.op-row__rating {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  text-align: right;
}

.op-row__name {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.op-row__line2 {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 38px;
  gap: 8px;
  align-items: center;
}

.op-row__freqval {
  font-size: var(--fs-xs);
  font-weight: 600;
  color: var(--text);
  text-align: right;
}

.op-freq {
  display: block;
  width: 100%;
  height: 6px;
  background: var(--surface-sunk);
  border-radius: 3px;
  overflow: hidden;
}

.op-freq__fill {
  display: block;
  height: 100%;
  min-width: 2px;
  background: var(--accent);
  border-radius: 3px;
}

.op-mini {
  display: flex;
  height: 5px;
  width: 100%;
  border-radius: 2px;
  overflow: hidden;
}

.op-mini__w { background: var(--eval-white); }
.op-mini__d { background: var(--text-faint); }
.op-mini__b { background: var(--eval-black); }
</style>
