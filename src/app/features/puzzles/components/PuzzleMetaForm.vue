<template>
  <div class="meta-form">
    <label class="meta-form__field">
      <span>{{ s.editor.fenLabel }}</span>
      <input
        :value="fen"
        type="text"
        class="meta-form__input"
        :placeholder="s.editor.fenPlaceholder"
        @change="$emit('applyFen', ($event.target as HTMLInputElement).value)"
      >
      <small
        v-if="fenError"
        class="meta-form__err"
      >
        {{ s.editor.fenInvalid }}: {{ fenError }}
      </small>
      <RouterLink
        :to="{ name: 'puzzles-fen-builder' }"
        class="meta-form__fen-link"
      >
        {{ s.fenBuilder.openLink }} →
      </RouterLink>
    </label>

    <label class="meta-form__field">
      <span>{{ s.editor.titleLabel }}</span>
      <input
        :value="title"
        type="text"
        class="meta-form__input"
        :placeholder="s.editor.titlePlaceholder"
        @input="$emit('update:title', ($event.target as HTMLInputElement).value)"
      >
    </label>

    <label class="meta-form__field">
      <span>{{ s.editor.descriptionLabel }}</span>
      <textarea
        :value="description"
        class="meta-form__input meta-form__textarea"
        rows="2"
        @input="$emit('update:description', ($event.target as HTMLTextAreaElement).value)"
      />
    </label>

    <label class="meta-form__field">
      <span>{{ s.editor.eloLabel }}</span>
      <input
        :value="elo"
        type="number"
        class="meta-form__input"
        min="0"
        max="3000"
        step="50"
        @input="onEloInput"
      >
    </label>

    <div class="meta-form__field">
      <span>{{ s.editor.themesLabel }}</span>
      <div class="meta-form__chips">
        <BaseChip
          v-for="th in PUZZLE_THEMES"
          :key="th.id"
          :active="themes.includes(th.id)"
          @click="$emit('toggleTheme', th.id)"
        >
          {{ th.label }}
        </BaseChip>
      </div>
    </div>

    <PuzzleObjectiveField
      :objective="objective"
      @update:objective="$emit('update:objective', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import PuzzleObjectiveField
  from '@app/features/puzzles/components/PuzzleObjectiveField.vue';
import { PUZZLE_STRINGS } from '@app/features/puzzles/config/puzzle-strings.js';
import { PUZZLE_THEMES } from '@app/features/puzzles/config/puzzle-themes.js';
import BaseChip from '@app/shared/ui/BaseChip/BaseChip.vue';
import type { PuzzleObjective } from '@modules/game/application';
import { RouterLink } from 'vue-router';

defineProps<{
  fen: string;
  fenError: string;
  title: string;
  description: string;
  elo: number;
  themes: readonly string[];
  objective: PuzzleObjective | null;
}>();

const emit = defineEmits<{
  applyFen: [fen: string];
  'update:title': [value: string];
  'update:description': [value: string];
  'update:elo': [value: number];
  'update:objective': [value: PuzzleObjective | null];
  toggleTheme: [id: string];
}>();

const s = PUZZLE_STRINGS;

function onEloInput(e: Event): void {
  const v = Number((e.target as HTMLInputElement).value);
  emit('update:elo', Number.isFinite(v) ? v : 0);
}
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.meta-form {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.meta-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);

  > span {
    font-size: var(--fs-xs);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.meta-form__input {
  padding: var(--sp-2) var(--sp-3);

  @include m.card-border(var(--r-sm));

  background: var(--bg-elev);
  color: var(--text);
  font-size: var(--fs-sm);

  &:focus {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }
}

.meta-form__textarea { resize: vertical; }

.meta-form__fen-link {
  font-size: var(--fs-xs);
  color: var(--accent);
  text-decoration: none;
  margin-top: var(--sp-1);
  align-self: flex-start;

  &:hover { text-decoration: underline; }
}

.meta-form__err {
  color: var(--danger);
  font-size: var(--fs-xs);
}

.meta-form__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-1);
}
</style>
