<template>
  <main class="fen-builder-view">
    <header class="fen-builder-view__header">
      <BaseButton
        size="sm"
        class="fen-builder-view__back"
        @click="onBack"
      >
        ← {{ s.fenBuilder.back }}
      </BaseButton>
      <h1 class="fen-builder-view__title">
        {{ s.fenBuilder.title }}
      </h1>
    </header>

    <FenBuilder @apply="onApply" />
  </main>
</template>

<script setup lang="ts">
import FenBuilder from '@app/features/puzzles/components/FenBuilder.vue';
import { PUZZLE_STRINGS } from '@app/features/puzzles/config/puzzle-strings.js';
import BaseButton from '@app/shared/ui/BaseButton/BaseButton.vue';
import { useRouter } from 'vue-router';

const s = PUZZLE_STRINGS;
const router = useRouter();

function onApply(fen: string): void {
  void router.push({ name: 'puzzles', query: { tab: 'create', fen } });
}

function onBack(): void {
  void router.push({ name: 'puzzles', query: { tab: 'create' } });
}
</script>

<style scoped lang="scss">
.fen-builder-view {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--sp-6, 24px) var(--sp-4, 16px);
  display: flex;
  flex-direction: column;
  gap: var(--sp-4, 16px);
}

.fen-builder-view__header {
  display: flex;
  align-items: center;
  gap: var(--sp-3, 12px);
}

.fen-builder-view__title {
  font-size: var(--fs-xl, 22px);
  font-weight: 600;
  margin: 0;
  color: var(--text, #222);
}

.fen-builder-view__back {
  font-size: var(--fs-sm, 14px);
}
</style>
