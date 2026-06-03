<template>
  <div class="sp-card">
    <div class="sp-card__header">
      <span class="sp-card__title">{{ $t('game.sidebar.setupTitle') }}</span>
    </div>
    <div class="sp-card__body">
      <div class="sp-info-row">
        <span class="sp-label">{{ $t('game.sidebar.mode') }}</span>
        <span class="sp-value">{{ modeLabel }}</span>
      </div>
      <div
        v-if="timeControlRowVisible"
        class="sp-info-row"
      >
        <span class="sp-label">{{ $t('game.sidebar.timeControl') }}</span>
        <span class="sp-value">{{ timeLabel }}</span>
      </div>
      <div class="sp-info-row">
        <span class="sp-label">{{ $t('game.sidebar.ai') }}</span>
        <span class="sp-value">{{ aiLabel }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  TIME_CONTROL_OPTIONS,
} from '@app/features/game/config/time-controls.js';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  gameMode: string;
  selectedTimeControl: string;
  aiSide: string;
  aiDepth: number;
  timeControlRowVisible: boolean;
}>();

const { t } = useI18n();

const modeLabel = computed(() =>
  props.gameMode === 'shvedki' ? t('game.modes.shvedki') : t('game.modes.standard'),
);
const timeLabel = computed(() =>
  TIME_CONTROL_OPTIONS.find((o) => o.value === props.selectedTimeControl)?.label ?? '∞',
);
const aiLabel = computed(() => {
  if (props.aiSide === 'off') return t('game.sidebar.aiOff');
  const side = props.aiSide === 'white' ? t('game.sidebar.sideWhite') : t('game.sidebar.sideBlack');
  return t('game.sidebar.aiPlays', { side, level: props.aiDepth });
});
</script>

<style scoped lang="scss">
.sp-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  overflow: hidden;
  min-height: 140px;
}

.sp-card__header {
  padding: var(--sp-3) var(--sp-4);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
}

.sp-card__title {
  font-family: var(--font-mono), sans-serif;
  font-size: var(--fs-xs);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--text-muted);
  font-weight: 600;
}

.sp-card__body {
  padding: var(--sp-4);
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.sp-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--sp-3);
}

.sp-label {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  font-weight: 500;
}

.sp-value {
  font-family: var(--font-mono), sans-serif;
  font-size: var(--fs-sm);
  color: var(--text);
}
</style>
