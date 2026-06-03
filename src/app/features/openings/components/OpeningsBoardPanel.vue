<template>
  <section class="op-board">
    <div class="op-board__board">
      <div class="op-board__board-inner">
        <canvas
          ref="boardCanvas"
          class="op-board__canvas"
          width="600"
          height="600"
          :aria-label="$t('openings.startPosition')"
        />
        <div
          ref="promoEl"
          class="op-board__promo"
        />
      </div>
    </div>

    <BaseCard
      padding="sm"
      class="op-board__nav"
    >
      <div class="op-board__nav-row">
        <BaseIconButton
          size="sm"
          :aria-label="$t('openings.back')"
          :title="$t('openings.back')"
          :disabled="!canBack"
          @click="emit('back')"
        >
          <AppIcon
            name="arrow-left"
            :size="16"
          />
        </BaseIconButton>
        <span class="op-board__status t-mono t-muted">
          {{ $t('openings.toMove', { side: sideLabel }) }}
        </span>
        <BaseIconButton
          size="sm"
          :aria-label="$t('openings.forward')"
          :title="$t('openings.forward')"
          :disabled="!canForward"
          @click="emit('forward')"
        >
          <AppIcon
            name="arrow-right"
            :size="16"
          />
        </BaseIconButton>
        <span class="op-board__nav-gap" />
        <BaseIconButton
          size="sm"
          :aria-label="$t('openings.flip')"
          :title="$t('openings.flip')"
          @click="emit('flip')"
        >
          <AppIcon
            name="flip"
            :size="16"
          />
        </BaseIconButton>
      </div>
    </BaseCard>
  </section>
</template>

<script setup lang="ts">
import {
  useOpeningsBoard,
} from '@app/features/openings/composables/useOpeningsBoard.js';
import AppIcon from '@app/shared/ui/AppIcon/AppIcon.vue';
import BaseCard from '@app/shared/ui/BaseCard/BaseCard.vue';
import BaseIconButton from '@app/shared/ui/BaseIconButton/BaseIconButton.vue';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  boardMoves: readonly string[];
  flipped: boolean;
  sideToMove: 'white' | 'black';
  canBack: boolean;
  canForward: boolean;
  previewUci: string | null;
}>();

const emit = defineEmits<{
  back: [];
  forward: [];
  flip: [];
  play: [uci: string, san: string];
}>();

const { t } = useI18n();

const sideLabel = computed(() =>
  props.sideToMove === 'white' ? t('openings.sideWhite') : t('openings.sideBlack'),
);

const boardCanvas = ref<HTMLCanvasElement | null>(null);
const promoEl = ref<HTMLElement | null>(null);

useOpeningsBoard({
  canvas: boardCanvas,
  promo: promoEl,
  moves: () => props.boardMoves,
  flipped: () => props.flipped,
  preview: () => props.previewUci,
  onUserMove: (uci) => { emit('play', uci, ''); },
});
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;
@include m.typography-helpers;

.op-board {
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  gap: var(--sp-3);
  min-height: 0;
  min-width: 0;
}

.op-board__board {
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.op-board__board-inner {
  position: relative;
  height: 100%;
  max-width: 100%;
  max-height: fit-content;
  aspect-ratio: 1 / 1;
  display: flex;
}

@include m.mobile {
  .op-board__board {
    flex: none;
    width: 100%;
    height: auto;
  }

  .op-board__board-inner {
    width: 100%;
    height: auto;
    max-height: none;
  }
}

.op-board__canvas {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: var(--r-sm);
  user-select: none;
  touch-action: none;
}

.op-board__promo {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.op-board__nav {
  flex-shrink: 0;
}

.op-board__nav-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-1);
}

.op-board__status {
  font-size: var(--fs-sm);
  padding: 0 10px;
}

.op-board__nav-gap {
  width: 12px;
}

</style>
