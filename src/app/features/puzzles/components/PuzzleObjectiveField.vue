<template>
  <div class="objective-field">
    <span class="objective-field__label">{{ s.label }}</span>

    <Segmented
      :model-value="kind"
      :options="kindOptions"
      @update:model-value="onKindChange"
    />

    <label
      v-if="kind === OBJECTIVE_KIND.mate"
      class="objective-field__moves"
    >
      <span class="objective-field__moves-label">{{ s.movesLabel }}</span>
      <input
        :value="movesLocal"
        type="number"
        :min="OBJECTIVE_MIN_MOVES"
        :max="OBJECTIVE_MAX_MOVES"
        step="1"
        class="objective-field__moves-input"
        @input="onMovesInput"
      >
    </label>

    <p class="objective-field__hint">
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { PUZZLE_STRINGS } from '@app/features/puzzles/config/puzzle-strings.js';
import Segmented from '@app/shared/ui/Segmented/Segmented.vue';
import type { SegmentedOption } from '@app/shared/ui/Segmented/types.js';
import {
  OBJECTIVE_KIND,
  type ObjectiveKind,
  type PuzzleObjective,
} from '@modules/game/application';
import { computed, ref, watch } from 'vue';

type Kind = 'none' | ObjectiveKind;

const props = defineProps<{
  objective: PuzzleObjective | null;
}>();

const emit = defineEmits<{
  'update:objective': [value: PuzzleObjective | null];
}>();

/** Допустимый диапазон бюджета ходов для objective='mate'. */
const OBJECTIVE_MIN_MOVES = 1;
const OBJECTIVE_MAX_MOVES = 20;
const DEFAULT_MATE_MOVES = 3;

const s = PUZZLE_STRINGS.editor.objective;

const kind = computed<Kind>(() => props.objective?.kind ?? 'none');

/** Локальное число ходов для мат-режима — сохраняется при переключении между режимами. */
const movesLocal = ref<number>(props.objective?.moves ?? DEFAULT_MATE_MOVES);
watch(() => props.objective, (v) => {
  if (v?.kind === OBJECTIVE_KIND.mate) movesLocal.value = v.moves;
});

const kindOptions = computed<readonly SegmentedOption<Kind>[]>(() => [
  { value: 'none', label: s.kindScripted },
  { value: OBJECTIVE_KIND.bestMove, label: s.kindBestMove },
  { value: OBJECTIVE_KIND.mate, label: s.kindMate },
]);

const hint = computed(() => {
  switch (kind.value) {
    case 'none': return s.hintScripted;
    case OBJECTIVE_KIND.bestMove: return s.hintBestMove;
    case OBJECTIVE_KIND.mate: return s.hintMate(movesLocal.value);
    default: return '';
  }
});

function onKindChange(next: Kind): void {
  if (next === 'none') emit('update:objective', null);
  else if (next === OBJECTIVE_KIND.bestMove) {
    emit('update:objective', { kind: OBJECTIVE_KIND.bestMove, moves: 1 });
  } else {
    emit('update:objective', { kind: OBJECTIVE_KIND.mate, moves: clampMoves(movesLocal.value) });
  }
}

function onMovesInput(e: Event): void {
  const raw = Number((e.target as HTMLInputElement).value);
  const moves = clampMoves(raw);
  movesLocal.value = moves;
  emit('update:objective', { kind: OBJECTIVE_KIND.mate, moves });
}

function clampMoves(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_MATE_MOVES;
  return Math.min(OBJECTIVE_MAX_MOVES, Math.max(OBJECTIVE_MIN_MOVES, Math.round(n)));
}
</script>

<style scoped lang="scss">
.objective-field {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.objective-field__label {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.objective-field__moves {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  font-size: var(--fs-sm);
}

.objective-field__moves-label {
  color: var(--text-muted);
}

.objective-field__moves-input {
  width: 72px;
  padding: var(--sp-1) var(--sp-2);
  background: var(--bg-elev);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  font-size: var(--fs-sm);

  &:focus {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }
}

.objective-field__hint {
  margin: 0;
  font-size: var(--fs-xs);
  color: var(--text-faint);
  line-height: 1.4;
}
</style>
