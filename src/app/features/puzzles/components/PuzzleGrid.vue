<template>
  <div class="puzzle-grid">
    <p
      v-if="puzzles.length === 0"
      class="puzzle-grid__empty"
    >
      {{ emptyMessage }}
    </p>
    <PuzzleCard
      v-for="p in puzzles"
      :key="p.id"
      :puzzle="p"
      @open="$emit('open', $event)"
      @delete="$emit('delete', $event)"
      @edit="$emit('edit', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type {
  PuzzleSummary,
} from '@app/features/puzzles/composables/usePuzzleLibrary.js';
import PuzzleCard from './PuzzleCard.vue';

defineProps<{ puzzles: PuzzleSummary[]; emptyMessage: string }>();
defineEmits<(e: 'open' | 'delete' | 'edit', id: string) => void>();
</script>

<style scoped lang="scss">
.puzzle-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--sp-4);
}

.puzzle-grid__empty {
  grid-column: 1 / -1;
  text-align: center;
  color: var(--text-muted);
  padding: var(--sp-8) var(--sp-4);
  margin: 0;
}
</style>
