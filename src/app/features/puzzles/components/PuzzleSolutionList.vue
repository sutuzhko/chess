<template>
  <div class="solution-list">
    <span class="solution-list__label">{{ s.editor.linesLabel }}</span>
    <ul class="solution-list__items">
      <li
        v-for="(line, idx) in lines"
        :key="line.id"
        class="solution-list__line"
        :class="{ 'solution-list__line--active': line.id === activeLineId }"
      >
        <button
          type="button"
          class="solution-list__line-btn"
          :aria-pressed="line.id === activeLineId"
          @click="$emit('selectLine', line.id)"
        >
          <span class="solution-list__line-name">
            {{ s.editor.lineName(idx + 1) }}
          </span>
          <span class="solution-list__line-moves">
            <template v-if="line.moves.length">{{ line.moves.join(' ') }}</template>
            <em
              v-else
              class="solution-list__empty"
            >{{ s.editor.solutionEmpty }}</em>
          </span>
        </button>
        <BaseButton
          variant="ghost"
          size="sm"
          class="solution-list__line-del"
          :disabled="lines.length <= 1"
          @click="$emit('deleteLine', line.id)"
        >
          ✕
        </BaseButton>
      </li>
    </ul>
    <p class="solution-list__hint">
      {{ s.editor.recordLabel }}
    </p>
    <div class="solution-list__actions">
      <BaseButton
        :disabled="!hasActiveMoves"
        @click="$emit('clearActive')"
      >
        {{ s.editor.clearMoves }}
      </BaseButton>
      <BaseButton @click="$emit('addLine')">
        + {{ s.editor.addLine }}
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PUZZLE_STRINGS } from '@app/features/puzzles/config/puzzle-strings.js';
import BaseButton from '@app/shared/ui/BaseButton/BaseButton.vue';

interface SolutionLine {
  readonly id: string;
  readonly moves: readonly string[];
}

defineProps<{
  lines: readonly SolutionLine[];
  activeLineId: string;
  hasActiveMoves: boolean;
}>();

defineEmits<{
  selectLine: [id: string];
  deleteLine: [id: string];
  clearActive: [];
  addLine: [];
}>();

const s = PUZZLE_STRINGS;
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.solution-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}

.solution-list__label {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.solution-list__items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}

.solution-list__line {
  display: flex;
  align-items: stretch;
  gap: var(--sp-1);

  @include m.card-border(var(--r-sm));

  background: var(--bg-elev);
  overflow: hidden;
}

.solution-list__line--active {
  border-color: var(--accent);
  outline: 1px solid var(--accent);
}

.solution-list__line-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: var(--sp-2) var(--sp-3);
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  color: inherit;
  font: inherit;

  &:hover { background: var(--surface-hover); }
}

.solution-list__line-name {
  font-size: var(--fs-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.solution-list__line-moves {
  font-family: var(--font-mono), monospace;
  font-size: var(--fs-sm);
  color: var(--text);
  word-break: break-all;
}

.solution-list__line-del {
  padding: 0 var(--sp-3);
  border-left: 1px solid var(--border);
  border-radius: 0;
}

.solution-list__empty {
  color: var(--text-muted);
  font-size: var(--fs-sm);
  margin: 0;
  font-style: italic;
}

.solution-list__hint {
  margin: var(--sp-1) 0 0;
  font-size: var(--fs-xs);
  color: var(--text-muted);
}

.solution-list__actions {
  display: flex;
  gap: var(--sp-2);
  margin-top: var(--sp-1);
}
</style>
