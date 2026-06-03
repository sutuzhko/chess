<template>
  <div class="puzzle-board">
    <BoardPreview
      :fen="fen"
      :orientation="sideToMove"
    />
    <span class="puzzle-board__pill">
      <span
        class="puzzle-board__dot"
        :class="`puzzle-board__dot--${sideToMove}`"
      />
      {{ sideToMove === 'white' ? s.card.sideToMoveWhite : s.card.sideToMoveBlack }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { PUZZLE_STRINGS } from '@app/features/puzzles/config/puzzle-strings.js';
import BoardPreview from '@app/shared/ui/BoardPreview/BoardPreview.vue';

defineProps<{
  fen: string;
  sideToMove: 'white' | 'black';
}>();

const s = PUZZLE_STRINGS;
</script>

<style scoped lang="scss">
.puzzle-board {
  position: relative;
  padding: var(--sp-3);
}

.puzzle-board__pill {
  position: absolute;
  top: var(--sp-4);
  right: var(--sp-4);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px var(--sp-2);
  background: var(--surface);
  color: var(--text-muted);
  font-size: var(--fs-2xs);
  font-weight: 500;
  border-radius: var(--r-pill);
  backdrop-filter: blur(4px);
  text-transform: uppercase;
}

.puzzle-board__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1px solid var(--border-strong);
}

.puzzle-board__dot--white { background: #fff; }
.puzzle-board__dot--black { background: #1a1a1a; }
</style>
