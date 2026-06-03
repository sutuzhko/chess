<template>
  <section class="puzzle-editor">
    <header class="puzzle-editor__head">
      <h2 class="puzzle-editor__title">
        {{ isEditing ? s.editor.editTitle : s.editor.title }}
      </h2>
      <p class="puzzle-editor__sub">
        {{ isEditing ? s.editor.editSub : s.editor.sub }}
      </p>
    </header>

    <div class="puzzle-editor__grid">
      <div class="puzzle-editor__board-wrap">
        <canvas
          ref="boardCanvas"
          class="puzzle-editor__canvas"
          width="400"
          height="400"
        />
      </div>

      <PromotionModal @mounted="onPromotionMounted" />

      <div class="puzzle-editor__form">
        <PuzzleMetaForm
          :fen="state.fen"
          :fen-error="state.fenError"
          :title="state.title"
          :description="state.description"
          :elo="state.elo"
          :themes="state.themes"
          :objective="state.objective"
          @apply-fen="applyFen"
          @update:title="state.title = $event"
          @update:description="state.description = $event"
          @update:elo="state.elo = $event"
          @update:objective="state.objective = $event"
          @toggle-theme="toggleTheme"
        />

        <PuzzleSolutionList
          :lines="state.lines"
          :active-line-id="state.activeLineId"
          :has-active-moves="activeMoves.length > 0"
          @select-line="selectLine"
          @delete-line="deleteLine"
          @clear-active="clearActiveLine"
          @add-line="addLine"
        />

        <div class="puzzle-editor__actions">
          <BaseButton
            variant="primary"
            :disabled="!canSave"
            @click="onSave"
          >
            {{ isEditing ? s.editor.update : s.editor.save }}
          </BaseButton>
          <p
            v-if="!canSave && totalRecorded === 0"
            class="puzzle-editor__hint"
          >
            {{ s.editor.requiredFields }}
          </p>
          <p
            v-if="state.saved"
            class="puzzle-editor__saved"
          >
            ✓ {{ isEditing ? s.editor.updated : s.editor.saved }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  usePuzzleEditor,
} from '@app/features/puzzles/composables/usePuzzleEditor.js';
import { PUZZLE_STRINGS } from '@app/features/puzzles/config/puzzle-strings.js';
import BaseButton from '@app/shared/ui/BaseButton/BaseButton.vue';
import PromotionModal from '@app/shared/ui/PromotionModal/PromotionModal.vue';
import type { PuzzleData } from '@modules/game/domain/puzzles';
import { computed } from 'vue';
import PuzzleMetaForm from './PuzzleMetaForm.vue';
import PuzzleSolutionList from './PuzzleSolutionList.vue';

const props = defineProps<{ initialFen?: string; initialPuzzle?: PuzzleData }>();
const emit = defineEmits<{ save: [data: PuzzleData] }>();

const s = PUZZLE_STRINGS;
const editorOptions: { initialFen?: string; initialPuzzle?: PuzzleData } = {};
if (props.initialPuzzle) editorOptions.initialPuzzle = props.initialPuzzle;
else if (props.initialFen) editorOptions.initialFen = props.initialFen;

const {
  boardCanvas,
  promotionEl,
  state,
  activeMoves,
  isEditing,
  applyFen,
  toggleTheme,
  clearActiveLine,
  addLine,
  selectLine,
  deleteLine,
  buildPuzzle,
} = usePuzzleEditor(editorOptions);

const totalRecorded = computed<number>(
  () => state.lines.reduce((acc, l) => acc + l.moves.length, 0),
);

const canSave = computed<boolean>(
  () => totalRecorded.value > 0 && !state.fenError && state.fen.trim().length > 0,
);

function onSave(): void {
  const data = buildPuzzle();
  if (!data) return;
  emit('save', data);
  state.saved = true;
}

function onPromotionMounted(el: HTMLElement): void { promotionEl.value = el; }
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.puzzle-editor {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.puzzle-editor__title {
  font-size: var(--fs-lg);
  margin: 0;
  color: var(--text);
}

.puzzle-editor__sub {
  font-size: var(--fs-sm);
  color: var(--text-muted);
  margin: var(--sp-1) 0 0;
}

.puzzle-editor__grid {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) 2fr;
  gap: var(--sp-4);

  @include m.mobile {
    grid-template-columns: 1fr;
  }
}

.puzzle-editor__board-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  max-width: 400px;
}

.puzzle-editor__canvas {
  width: 100%;
  height: 100%;
  border-radius: var(--r-md);
  background: var(--board-light, #f0d9b5);
  display: block;
}

.puzzle-editor__form {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.puzzle-editor__actions {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  flex-wrap: wrap;
  margin-top: var(--sp-2);
}

.puzzle-editor__hint {
  color: var(--text-muted);
  font-size: var(--fs-xs);
  margin: 0;
}

.puzzle-editor__saved {
  color: var(--success);
  font-weight: 600;
  margin: 0;
}
</style>
