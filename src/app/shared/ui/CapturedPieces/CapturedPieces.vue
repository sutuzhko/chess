<template>
  <div
    v-if="pieces.length > 0"
    class="captured"
    :aria-label="$t('game.captured.label', { color: colorLabel })"
  >
    <img
      v-for="(p, i) in pieces"
      :key="`${p.color}-${p.piece}-${i}`"
      :src="pieceSrc(p)"
      :alt="p.piece"
      class="captured__piece"
      draggable="false"
    >
    <span
      v-if="advantage && advantage > 0"
      class="captured__advantage"
    >+{{ advantage }}</span>
  </div>
</template>

<script setup lang="ts">
import { figureUrl } from '@shared/config/asset-path.js';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CapturedMark } from './types.js';

const props = withDefaults(defineProps<{
  pieces: readonly CapturedMark[];
  advantage?: number;
  forColor?: 'white' | 'black';
}>(), {
  advantage: 0,
  forColor: 'white',
});

const { t } = useI18n();

const colorLabel = computed<string>(() =>
  props.forColor === 'white' ? t('game.color.white') : t('game.color.black'),
);

function pieceSrc(p: CapturedMark): string {
  return figureUrl(`${p.piece}-${p.color}`);
}
</script>

<style scoped lang="scss">
.captured {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-wrap: wrap;
}

.captured__piece {
  display: block;
  width: 16px;
  height: 16px;
  object-fit: contain;
  user-select: none;
}

.captured__advantage {
  font-family: var(--font-mono), sans-serif;
  font-size: var(--fs-xs);
  color: var(--text-faint);
  margin-left: var(--sp-1);
}
</style>
