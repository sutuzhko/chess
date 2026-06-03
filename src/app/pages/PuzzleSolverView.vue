<template>
  <main class="puzzle-solver-view">
    <PuzzleSolver
      :puzzle-id="puzzleId"
      @back="goBack"
      @next="goNext"
    />
  </main>
</template>

<script setup lang="ts">
import PuzzleSolver from '@app/features/puzzles/components/PuzzleSolver.vue';
import {
  usePuzzleLibrary,
} from '@app/features/puzzles/composables/usePuzzleLibrary.js';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const library = usePuzzleLibrary();

const puzzleId = computed(() =>
  typeof route.params.id === 'string' ? route.params.id : '',
);
const fromScope = computed<'custom' | 'library'>(() =>
  route.query.from === 'custom' ? 'custom' : 'library',
);

function currentPool(): readonly { id: string }[] {
  return fromScope.value === 'custom'
    ? library.customPuzzles.value
    : library.bundledPuzzles.value;
}

function goBack(): void {
  void router.push({
    name: 'puzzles',
    query: fromScope.value === 'custom' ? { tab: 'custom' } : {},
  });
}

function goNext(): void {
  const pool = currentPool();
  if (pool.length === 0) { goBack(); return; }
  const idx = pool.findIndex((p) => p.id === puzzleId.value);
  const next = pool[(idx + 1) % pool.length];
  if (!next) { goBack(); return; }
  void router.push({
    name: 'puzzle-solve',
    params: { id: next.id },
    query: fromScope.value === 'custom' ? { from: 'custom' } : {},
  });
}
</script>

<style scoped lang="scss">
.puzzle-solver-view {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--sp-6, 24px) var(--sp-4, 16px);
}
</style>
