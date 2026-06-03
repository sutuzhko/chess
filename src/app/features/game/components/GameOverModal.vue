<template>
  <div
    ref="el"
    class="gameover-modal gameover-modal--hidden"
    role="dialog"
    aria-modal="true"
    :aria-label="$t('game.gameOver.title')"
  >
    <div class="gameover-modal__dialog">
      <div class="gameover-modal__hero">
        <div class="gameover-modal__eyebrow">
          {{ $t('game.gameOver.title') }}
        </div>
        <h2
          class="gameover-modal__title"
          data-role="title"
        >
          —
        </h2>
        <p
          class="gameover-modal__sub"
          data-role="body"
        />
      </div>
      <div class="gameover-modal__footer">
        <button
          class="gameover-modal__btn gameover-modal__btn--primary"
          data-action="new-game"
        >
          {{ $t('game.gameOver.newGame') }}
        </button>
        <button
          class="gameover-modal__btn"
          data-action="dismiss"
        >
          {{ $t('game.gameOver.dismiss') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

const emit = defineEmits<{ mounted: [HTMLElement] }>();

const el = ref<HTMLElement | null>(null);

onMounted(() => {
  if (el.value) emit('mounted', el.value);
});

defineExpose({ el });
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.gameover-modal {
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

.gameover-modal--hidden {
  display: none;
}

.gameover-modal__dialog {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-xl);
  box-shadow: var(--shadow-xl);
  max-width: min(420px, 100%);
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.gameover-modal__hero {
  padding: var(--sp-5);
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}

.gameover-modal__eyebrow {
  font-family: var(--font-mono);
  font-size: var(--fs-2xs);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--text-faint);
  font-weight: 500;
}

.gameover-modal__title {
  margin: 0;
  font-size: var(--fs-xl);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  color: var(--text-strong);
}

.gameover-modal__sub {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.gameover-modal__footer {
  padding: 0 var(--sp-5) var(--sp-5);
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.gameover-modal__btn {
  width: 100%;
  height: 44px;
  border: 1px solid var(--border-strong);
  border-radius: var(--r-pill);
  background: var(--surface);
  color: var(--text);
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: var(--fs-base);
  cursor: pointer;
  transition:
    background var(--dur-base) var(--ease-out),
    border-color var(--dur-base) var(--ease-out),
    transform var(--dur-fast) var(--ease-out);

  @include m.focus-ring;
}

.gameover-modal__btn:hover {
  background: var(--surface-hover);
}

.gameover-modal__btn:active {
  transform: translateY(0.5px);
}

.gameover-modal__btn--primary {
  background: var(--accent);
  color: var(--accent-fg);
  border-color: var(--accent);
}

.gameover-modal__btn--primary:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}
</style>
