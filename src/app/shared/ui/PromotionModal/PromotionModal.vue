<template>
  <div
    ref="el"
    class="promotion-modal promotion-modal--hidden"
    role="dialog"
    aria-modal="true"
    :aria-label="$t('game.promotion.title')"
  >
    <div class="promotion-modal__dialog">
      <div class="promotion-modal__hero">
        <div class="promotion-modal__eyebrow">
          {{ $t('game.promotion.title') }}
        </div>
        <h2 class="promotion-modal__title">
          {{ $t('game.promotion.subtitle') }}
        </h2>
      </div>
      <div class="promotion-modal__body">
        <div class="promotion-modal__choices">
          <button
            class="promotion-modal__btn"
            data-promotion="queen"
            :aria-label="$t('game.promotion.queen')"
          >
            <img
              :src="figureUrl(`queen-${color}`)"
              :alt="$t('game.promotion.queen')"
              class="promotion-modal__piece"
            >
          </button>
          <button
            class="promotion-modal__btn"
            data-promotion="rook"
            :aria-label="$t('game.promotion.rook')"
          >
            <img
              :src="figureUrl(`rook-${color}`)"
              :alt="$t('game.promotion.rook')"
              class="promotion-modal__piece"
            >
          </button>
          <button
            class="promotion-modal__btn"
            data-promotion="bishop"
            :aria-label="$t('game.promotion.bishop')"
          >
            <img
              :src="figureUrl(`bishop-${color}`)"
              :alt="$t('game.promotion.bishop')"
              class="promotion-modal__piece"
            >
          </button>
          <button
            class="promotion-modal__btn"
            data-promotion="knight"
            :aria-label="$t('game.promotion.knight')"
          >
            <img
              :src="figureUrl(`knight-${color}`)"
              :alt="$t('game.promotion.knight')"
              class="promotion-modal__piece"
            >
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { figureUrl } from '@shared/config/asset-path.js';
import { onMounted, ref } from 'vue';

withDefaults(defineProps<{ color?: 'white' | 'black' }>(), { color: 'white' });

const emit = defineEmits<{ mounted: [HTMLElement] }>();

const el = ref<HTMLElement | null>(null);

onMounted(() => {
  if (el.value) emit('mounted', el.value);
});

defineExpose({ el });
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.promotion-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-5);
  background: var(--overlay);
  backdrop-filter: blur(3px);
}

.promotion-modal--hidden {
  display: none;
}

.promotion-modal__dialog {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-xl);
  box-shadow: var(--shadow-xl);
  max-width: min(420px, 100%);
  width: 100%;
  overflow: hidden;
}

.promotion-modal__hero {
  padding: var(--sp-5) var(--sp-5) var(--sp-3);
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  border-bottom: 1px solid var(--divider);
}

.promotion-modal__eyebrow {
  font-family: var(--font-mono), sans-serif;
  font-size: var(--fs-2xs);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--text-faint);
  font-weight: 500;
}

.promotion-modal__title {
  margin: 0;
  font-size: var(--fs-lg);
  font-weight: 600;
  letter-spacing: var(--tracking-tight);
  color: var(--text-strong);
}

.promotion-modal__body {
  padding: var(--sp-5);
}

.promotion-modal__choices {
  display: flex;
  gap: var(--sp-3);
  justify-content: center;
}

.promotion-modal__btn {
  padding: var(--sp-2);
  width: 64px;
  height: 64px;
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  background: var(--surface);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background var(--dur-base) var(--ease-out),
    border-color var(--dur-base) var(--ease-out),
    transform var(--dur-fast) var(--ease-out);

  @include m.focus-ring;
}

.promotion-modal__btn:hover {
  background: var(--surface-hover);
  border-color: var(--border-strong);
}

.promotion-modal__btn:active {
  transform: translateY(0.5px);
}

.promotion-modal__piece {
  width: 40px;
  height: 40px;
  object-fit: contain;
  display: block;
}
</style>
