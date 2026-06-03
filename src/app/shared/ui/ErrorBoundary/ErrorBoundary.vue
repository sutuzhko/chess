<template>
  <div
    v-if="error"
    class="error-boundary"
    role="alert"
  >
    <div class="error-boundary__inner">
      <div class="error-boundary__eyebrow">
        {{ $t('app.error.eyebrow') }}
      </div>
      <h2 class="error-boundary__title">
        {{ $t('app.error.title') }}
      </h2>
      <p class="error-boundary__message">
        {{ error.message }}
      </p>
      <button
        type="button"
        class="error-boundary__btn"
        @click="reset"
      >
        {{ $t('app.error.retry') }}
      </button>
    </div>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue';

const error = ref<Error | null>(null);

onErrorCaptured((err) => {
  error.value = err instanceof Error ? err : new Error(String(err));
  // Возвращаем false → ошибка не пробрасывается выше; UI-fallback показан.
  return false;
});

function reset(): void {
  error.value = null;
}
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.error-boundary {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-6);
}

.error-boundary__inner {
  background: var(--surface);
  border: 1px solid var(--danger);
  border-radius: var(--r-xl);
  padding: var(--sp-6);
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  text-align: center;
}

.error-boundary__eyebrow {
  font-family: var(--font-mono);
  font-size: var(--fs-2xs);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--danger);
  font-weight: 500;
}

.error-boundary__title {
  margin: 0;
  font-size: var(--fs-lg);
  font-weight: 600;
  color: var(--text-strong);
}

.error-boundary__message {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--fs-sm);
  font-family: var(--font-mono);
}

.error-boundary__btn {
  align-self: center;
  margin-top: var(--sp-2);
  height: 36px;
  padding: 0 var(--sp-4);
  background: var(--accent);
  color: var(--accent-fg);
  border: 1px solid var(--accent);
  border-radius: var(--r-pill);
  font-weight: 600;
  cursor: pointer;
  transition: background var(--dur-base) var(--ease-out);

  @include m.focus-ring;
}

.error-boundary__btn:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}
</style>
