<template>
  <article class="puzzle-card">
    <PuzzleBoardWithSide
      :fen="puzzle.fen"
      :side-to-move="puzzle.sideToMove"
    />
    <div class="puzzle-card__body">
      <h3 class="puzzle-card__title">
        {{ puzzle.title }}
      </h3>
      <div class="puzzle-card__meta">
        <span class="puzzle-card__theme">
          {{ primaryTheme }}
          <span
            v-if="restCount > 0"
            class="puzzle-card__more"
          >
            · +{{ restCount }}
          </span>
        </span>
        <span class="puzzle-card__elo">{{ s.card.elo }} {{ puzzle.elo }}</span>
      </div>
    </div>
    <div class="puzzle-card__foot">
      <BaseButton
        variant="primary"
        size="sm"
        block
        class="puzzle-card__open"
        @click="$emit('open', puzzle.id)"
      >
        {{ s.card.open }}
      </BaseButton>
      <BaseIconButton
        v-if="puzzle.source === 'custom'"
        variant="accent"
        size="md"
        :title="s.editor.edit"
        :aria-label="s.editor.edit"
        @click="$emit('edit', puzzle.id)"
      >
        <AppIcon
          name="pencil"
          :size="16"
        />
      </BaseIconButton>
      <BaseIconButton
        v-if="puzzle.source === 'custom'"
        variant="danger"
        size="md"
        :title="s.card.delete"
        :aria-label="s.card.delete"
        @click="$emit('delete', puzzle.id)"
      >
        <AppIcon
          name="trash"
          :size="16"
        />
      </BaseIconButton>
    </div>
  </article>
</template>

<script setup lang="ts">
import type {
  PuzzleSummary,
} from '@app/features/puzzles/composables/usePuzzleLibrary.js';
import { PUZZLE_STRINGS } from '@app/features/puzzles/config/puzzle-strings.js';
import { themeLabel } from '@app/features/puzzles/config/puzzle-themes.js';
import AppIcon from '@app/shared/ui/AppIcon/AppIcon.vue';
import BaseButton from '@app/shared/ui/BaseButton/BaseButton.vue';
import BaseIconButton from '@app/shared/ui/BaseIconButton/BaseIconButton.vue';
import { computed } from 'vue';
import PuzzleBoardWithSide from './PuzzleBoardWithSide.vue';

const props = defineProps<{ puzzle: PuzzleSummary }>();
defineEmits<(e: 'open' | 'delete' | 'edit', id: string) => void>();

const s = PUZZLE_STRINGS;

const primaryTheme = computed<string>(() => {
  const first = props.puzzle.themes[0];
  return first ? themeLabel(first) : '';
});

const restCount = computed<number>(() => Math.max(0, props.puzzle.themes.length - 1));
</script>

<style scoped lang="scss">
.puzzle-card {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  overflow: hidden;
  transition: border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out);

  &:hover {
    border-color: var(--border-strong);
    box-shadow: var(--shadow-sm);
  }
}

.puzzle-card__body {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  padding: var(--sp-3) var(--sp-4) var(--sp-2);
}

.puzzle-card__title {
  font-size: var(--fs-md);
  font-weight: 600;
  color: var(--text);
  margin: 0;
  line-height: var(--lh-snug);

  /* stylelint-disable value-no-vendor-prefix, property-no-vendor-prefix */
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  /* stylelint-enable value-no-vendor-prefix, property-no-vendor-prefix */
  overflow: hidden;
}

.puzzle-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  min-height: 22px;
}

.puzzle-card__theme {
  font-size: var(--fs-xs);
  color: var(--text-muted);
}

.puzzle-card__more { color: var(--text-faint); }

.puzzle-card__elo {
  font-family: var(--font-mono), sans-serif;
  font-size: var(--fs-2xs);
  letter-spacing: 0.04em;
  color: var(--text-muted);
  background: var(--surface-2);
  border: 1px solid var(--border);
  padding: 2px var(--sp-2);
  border-radius: var(--r-pill);
  white-space: nowrap;
}

.puzzle-card__foot {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-3) var(--sp-4);
  border-top: 1px solid var(--divider);
}

.puzzle-card__open {
  flex: 1;
  min-width: 0;
}
</style>
