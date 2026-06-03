<template>
  <section class="fen-builder">
    <header class="fen-builder__head">
      <h2 class="fen-builder__title">
        {{ s.fenBuilder.title }}
      </h2>
      <p class="fen-builder__sub">
        {{ s.fenBuilder.sub }}
      </p>
    </header>

    <div class="fen-builder__layout">
      <div class="fen-builder__board-col">
        <FenBoard
          :cells="b.cells.value"
          :squares="b.squares.value"
          :orientation="b.orientation.value"
          :drag-target-idx="b.dragTargetIdx.value"
          @cell-click="b.onCellClick"
          @piece-drag-start="b.onPieceDragStart"
          @drag-over="b.onDragOver"
          @drag-leave="b.onDragLeave"
          @drop="b.onDrop"
          @drag-end="b.onDragEnd"
        />
        <div class="fen-builder__tools">
          <BaseButton @click="b.resetInitial">
            {{ s.fenBuilder.initial }}
          </BaseButton>
          <BaseButton @click="b.clearAll">
            {{ s.fenBuilder.clear }}
          </BaseButton>
          <BaseButton @click="b.flipOrientation">
            {{ s.fenBuilder.flip }}
          </BaseButton>
        </div>
      </div>

      <aside class="fen-builder__side">
        <FenPalette
          :is-active="b.isActive"
          :erase-active="b.tool.value.kind === 'erase'"
          @select-piece="b.selectPiece"
          @select-erase="b.selectErase"
          @palette-drag-start="b.onPaletteDragStart"
          @drag-end="b.onDragEnd"
        />
        <FenIo
          :side-to-move="b.sideToMove.value"
          :castling="b.castling"
          :fen="b.fen.value"
          :load-error="b.loadError.value"
          :copied="b.copied.value"
          @update:side-to-move="b.sideToMove.value = $event"
          @update:castling="Object.assign(b.castling, $event)"
          @load-from-fen="b.loadFromFen"
          @copy-fen="b.copyFen"
          @apply="emit('apply', b.fen.value)"
        />
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  useFenBuilder,
} from '@app/features/puzzles/composables/useFenBuilder.js';
import { PUZZLE_STRINGS } from '@app/features/puzzles/config/puzzle-strings.js';
import BaseButton from '@app/shared/ui/BaseButton/BaseButton.vue';
import FenBoard from './FenBoard.vue';
import FenIo from './FenIo.vue';
import FenPalette from './FenPalette.vue';

const emit = defineEmits<{ apply: [fen: string] }>();

const s = PUZZLE_STRINGS;
const b = useFenBuilder();
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.fen-builder {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.fen-builder__title {
  font-size: var(--fs-lg);
  margin: 0;
  color: var(--text);
}

.fen-builder__sub {
  font-size: var(--fs-sm);
  color: var(--text-muted);
  margin: var(--sp-1) 0 0;
}

.fen-builder__layout {
  display: grid;
  grid-template-columns: minmax(320px, 1fr) minmax(260px, 380px);
  gap: var(--sp-4);

  @include m.tablet {
    grid-template-columns: 1fr;
  }
}

.fen-builder__board-col {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.fen-builder__tools {
  display: flex;
  gap: var(--sp-2);
  flex-wrap: wrap;
}

.fen-builder__side {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}
</style>
