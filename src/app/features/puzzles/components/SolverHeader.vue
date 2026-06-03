<template>
  <header class="solver-header">
    <BaseButton
      class="solver-header__back"
      variant="ghost"
      size="sm"
      type="button"
      @click="$emit('back')"
    >
      <AppIcon
        name="arrow-left"
        :size="16"
      />
      <span>{{ s.solver.backToList }}</span>
    </BaseButton>

    <div class="solver-header__title-block">
      <div class="solver-header__title-row">
        <BaseBadge
          mono
          tone="accent"
        >
          {{ title || '—' }}
        </BaseBadge>
      </div>
      <div class="solver-header__meta">
        <span class="solver-header__side-pill">
          <span
            class="solver-header__side-dot"
            :class="`solver-header__side-dot--${sideToMove}`"
          />
          {{ sideToMove === 'white' ? s.card.sideToMoveWhite : s.card.sideToMoveBlack }}
        </span>
        <span class="solver-header__sep">·</span>
        <BaseBadge mono>
          ELO {{ elo }}
        </BaseBadge>
        <span class="solver-header__sep">·</span>
        <span class="solver-header__themes">{{ themesText }}</span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { PUZZLE_STRINGS } from '@app/features/puzzles/config/puzzle-strings.js';
import AppIcon from '@app/shared/ui/AppIcon/AppIcon.vue';
import BaseBadge from '@app/shared/ui/BaseBadge/BaseBadge.vue';
import BaseButton from '@app/shared/ui/BaseButton/BaseButton.vue';

defineProps<{
  title: string;
  sideToMove: 'white' | 'black';
  elo: number;
  themesText: string;
}>();
defineEmits<{ back: [] }>();

const s = PUZZLE_STRINGS;
</script>

<style scoped lang="scss">
.solver-header {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: var(--sp-5);
  padding-bottom: var(--sp-4);
  border-bottom: 1px solid var(--divider);
}

.solver-header__back {
  width: fit-content;
  margin-left: -8px;
  color: var(--text-muted);

}

.solver-header__title-block {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}

.solver-header__title-row {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
}

.solver-header__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--sp-2);
  font-size: var(--fs-xs);
  color: var(--text-muted);
}

.solver-header__side-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.solver-header__side-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1px solid var(--border-strong);
  display: inline-block;

  &--white { background: #fff; }
  &--black { background: #1a1a1a; }
}

.solver-header__sep { color: var(--text-faint); }

.solver-header__themes {
  color: var(--text-muted);
}
</style>
