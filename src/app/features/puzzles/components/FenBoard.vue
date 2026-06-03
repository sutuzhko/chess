<template>
  <div
    class="fen-board"
    :class="{ 'fen-board--flipped': orientation === 'black' }"
  >
    <button
      v-for="cell in cells"
      :key="cell.idx"
      type="button"
      class="fen-board__cell"
      :class="{
        'fen-board__cell--light': cell.light,
        'fen-board__cell--dark': !cell.light,
        'fen-board__cell--target': dragTargetIdx === cell.idx,
      }"
      :title="cell.algebraic"
      @click="$emit('cellClick', cell.idx)"
      @dragover.prevent="$emit('dragOver', cell.idx, $event)"
      @dragleave="$emit('dragLeave', cell.idx)"
      @drop.prevent="$emit('drop', cell.idx)"
    >
      <img
        v-if="squares[cell.idx]"
        :src="pieceImg(squares[cell.idx])"
        :alt="pieceAlt(squares[cell.idx])"
        class="fen-board__piece"
        draggable="true"
        @dragstart="$emit('pieceDragStart', cell.idx, $event)"
        @dragend="$emit('dragEnd')"
      >
      <span
        v-if="cell.label"
        class="fen-board__coord"
      >{{ cell.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { pieceImageSrc } from '@app/features/game/config/piece-glyphs.js';
import type {
  FenBuilderCell,
} from '@app/features/puzzles/composables/useFenBuilder.js';
import type {
  Color,
  PlacedPiece,
} from '@app/features/puzzles/utils/fen-builder.js';

defineProps<{
  cells: readonly FenBuilderCell[];
  squares: readonly (PlacedPiece | null)[];
  orientation: Color;
  dragTargetIdx: number | null;
}>();

defineEmits<{
  cellClick: [idx: number];
  pieceDragStart: [idx: number, ev: DragEvent];
  dragOver: [idx: number, ev: DragEvent];
  dragLeave: [idx: number];
  drop: [idx: number];
  dragEnd: [];
}>();

function pieceImg(p: PlacedPiece | null | undefined): string {
  return p ? pieceImageSrc(p.type, p.color) : '';
}
function pieceAlt(p: PlacedPiece | null | undefined): string {
  return p ? `${p.color} ${p.type}` : '';
}
</script>

<style scoped lang="scss">
.fen-board {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
  width: 100%;
  max-width: 480px;
  aspect-ratio: 1 / 1;
  border-radius: var(--r-md);
  overflow: hidden;
  user-select: none;
}

.fen-board__cell {
  position: relative;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &--light { background: var(--board-light, #f0d9b5); }
  &--dark  { background: var(--board-dark, #b58863); }

  &--target {
    outline: 3px solid var(--accent);
    outline-offset: -3px;
  }
}

.fen-board__piece {
  width: 88%;
  height: 88%;
  pointer-events: auto;
  user-select: none;
}

.fen-board__coord {
  position: absolute;
  bottom: 1px;
  right: 3px;
  font-size: 10px;
  color: var(--text-muted);
  pointer-events: none;
}
</style>
