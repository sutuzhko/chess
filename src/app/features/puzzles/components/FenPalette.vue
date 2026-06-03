<template>
  <div class="fen-palette">
    <h3 class="fen-palette__h3">
      {{ s.fenBuilder.paletteWhite }}
    </h3>
    <div class="fen-palette__row">
      <button
        v-for="t in PALETTE_TYPES"
        :key="`w-${t}`"
        type="button"
        class="fen-palette__btn"
        :class="{ 'fen-palette__btn--active': isActive('white', t) }"
        draggable="true"
        @click="$emit('selectPiece', 'white', t)"
        @dragstart="$emit('paletteDragStart', 'white', t, $event)"
        @dragend="$emit('dragEnd')"
      >
        <img
          :src="pieceImageSrc(t, 'white')"
          :alt="t"
        >
      </button>
    </div>

    <h3 class="fen-palette__h3">
      {{ s.fenBuilder.paletteBlack }}
    </h3>
    <div class="fen-palette__row">
      <button
        v-for="t in PALETTE_TYPES"
        :key="`b-${t}`"
        type="button"
        class="fen-palette__btn"
        :class="{ 'fen-palette__btn--active': isActive('black', t) }"
        draggable="true"
        @click="$emit('selectPiece', 'black', t)"
        @dragstart="$emit('paletteDragStart', 'black', t, $event)"
        @dragend="$emit('dragEnd')"
      >
        <img
          :src="pieceImageSrc(t, 'black')"
          :alt="t"
        >
      </button>
    </div>

    <div class="fen-palette__row">
      <button
        type="button"
        class="fen-palette__btn fen-palette__btn--erase"
        :class="{ 'fen-palette__btn--active': eraseActive }"
        @click="$emit('selectErase')"
      >
        ✕
      </button>
    </div>
    <p class="fen-palette__hint">
      {{ s.fenBuilder.toolHint }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { pieceImageSrc } from '@app/features/game/config/piece-glyphs.js';
import { PUZZLE_STRINGS } from '@app/features/puzzles/config/puzzle-strings.js';
import type { Color } from '@app/features/puzzles/utils/fen-builder.js';
import type {
  PieceType,
} from '@modules/game/domain/game/value-objects/PieceType.js';

defineProps<{
  isActive: (color: Color, type: PieceType) => boolean;
  eraseActive: boolean;
}>();

defineEmits<{
  selectPiece: [color: Color, type: PieceType];
  selectErase: [];
  paletteDragStart: [color: Color, type: PieceType, ev: DragEvent];
  dragEnd: [];
}>();

const s = PUZZLE_STRINGS;
const PALETTE_TYPES: readonly PieceType[] = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'];
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.fen-palette {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}

.fen-palette__h3 {
  font-size: var(--fs-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin: 0 0 var(--sp-1);
}

.fen-palette__row {
  display: flex;
  gap: var(--sp-1);
  flex-wrap: wrap;
  margin-bottom: var(--sp-2);
}

.fen-palette__btn {
  width: 44px;
  height: 44px;

  @include m.card-border(var(--r-sm));

  background: var(--surface);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;

  img {
    width: 100%;
    height: 100%;
  }

  &--active { outline: 2px solid var(--accent); }

  &--erase {
    font-size: 20px;
    color: var(--danger);
  }
}

.fen-palette__hint {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  margin: 0;
}
</style>
