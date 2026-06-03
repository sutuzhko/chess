<template>
  <div class="fen-io">
    <div class="fen-io__group">
      <h3 class="fen-io__h3">
        {{ s.fenBuilder.sideLabel }}
      </h3>
      <div class="fen-io__radio-row">
        <label class="fen-io__radio">
          <input
            :checked="sideToMove === 'white'"
            type="radio"
            value="white"
            @change="$emit('update:sideToMove', 'white')"
          >
          {{ s.fenBuilder.sideWhite }}
        </label>
        <label class="fen-io__radio">
          <input
            :checked="sideToMove === 'black'"
            type="radio"
            value="black"
            @change="$emit('update:sideToMove', 'black')"
          >
          {{ s.fenBuilder.sideBlack }}
        </label>
      </div>
    </div>

    <div class="fen-io__group">
      <h3 class="fen-io__h3">
        {{ s.fenBuilder.castlingLabel }}
      </h3>
      <div class="fen-io__castling">
        <label><input
          :checked="castling.whiteKing"
          type="checkbox"
          @change="onCastlingChange('whiteKing', $event)"
        > O-O белые</label>
        <label><input
          :checked="castling.whiteQueen"
          type="checkbox"
          @change="onCastlingChange('whiteQueen', $event)"
        > O-O-O белые</label>
        <label><input
          :checked="castling.blackKing"
          type="checkbox"
          @change="onCastlingChange('blackKing', $event)"
        > O-O чёрные</label>
        <label><input
          :checked="castling.blackQueen"
          type="checkbox"
          @change="onCastlingChange('blackQueen', $event)"
        > O-O-O чёрные</label>
      </div>
    </div>

    <div class="fen-io__group">
      <h3 class="fen-io__h3">
        {{ s.fenBuilder.fenLabel }}
      </h3>
      <textarea
        class="fen-io__fen"
        rows="2"
        :value="fen"
        @change="(e) => $emit('loadFromFen', (e.target as HTMLTextAreaElement).value)"
      />
      <p
        v-if="loadError"
        class="fen-io__err"
      >
        {{ s.fenBuilder.invalid }}: {{ loadError }}
      </p>
      <div class="fen-io__actions">
        <BaseButton @click="$emit('copyFen')">
          {{ copied ? s.fenBuilder.copied : s.fenBuilder.copy }}
        </BaseButton>
        <BaseButton
          variant="primary"
          @click="$emit('apply')"
        >
          {{ s.fenBuilder.useInEditor }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PUZZLE_STRINGS } from '@app/features/puzzles/config/puzzle-strings.js';
import type {
  CastlingFlags,
  Color,
} from '@app/features/puzzles/utils/fen-builder.js';
import BaseButton from '@app/shared/ui/BaseButton/BaseButton.vue';

const props = defineProps<{
  sideToMove: Color;
  castling: CastlingFlags;
  fen: string;
  loadError: string;
  copied: boolean;
}>();

const emit = defineEmits<{
  'update:sideToMove': [value: Color];
  'update:castling': [flags: CastlingFlags];
  loadFromFen: [fen: string];
  copyFen: [];
  apply: [];
}>();

const s = PUZZLE_STRINGS;

function onCastlingChange(key: keyof CastlingFlags, e: Event): void {
  const checked = (e.target as HTMLInputElement).checked;
  emit('update:castling', { ...props.castling, [key]: checked });
}
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.fen-io {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.fen-io__group {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}

.fen-io__h3 {
  font-size: var(--fs-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin: 0 0 var(--sp-1);
}

.fen-io__radio-row {
  display: flex;
  gap: var(--sp-3);
}

.fen-io__radio {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  font-size: var(--fs-sm);
  color: var(--text);
}

.fen-io__castling {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-1);
  font-size: var(--fs-sm);
  color: var(--text);

  label {
    display: flex;
    align-items: center;
    gap: var(--sp-1);
  }
}

.fen-io__fen {
  width: 100%;
  padding: var(--sp-2);

  @include m.card-border(var(--r-sm));

  background: var(--bg-elev);
  color: var(--text);
  font-family: var(--font-mono), monospace;
  font-size: var(--fs-sm);
  resize: vertical;
}

.fen-io__err {
  color: var(--danger);
  font-size: var(--fs-xs);
  margin: 0;
}

.fen-io__actions {
  display: flex;
  gap: var(--sp-2);
  flex-wrap: wrap;
  margin-top: var(--sp-2);
}
</style>
