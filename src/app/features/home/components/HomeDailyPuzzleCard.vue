<template>
  <BaseCard
    class="daily-card"
    padding="none"
    @click="$emit('solve')"
  >
    <template #header>
      <div class="daily-card__head">
        <div class="daily-card__head-text">
          <div class="daily-card__title">
            {{ $t('home.bottom.daily.title') }}
          </div>
          <div class="daily-card__sub">
            {{ puzzle ? subtitle : $t('home.bottom.daily.sub') }}
          </div>
        </div>
        <BaseBadge
          v-if="streak && streak > 0"
          tone="warning"
          size="sm"
          mono
        >
          {{ $t('home.bottom.daily.streakBadge', { n: streak }) }}
        </BaseBadge>
      </div>
    </template>

    <PuzzleBoardWithSide
      v-if="puzzle"
      :fen="puzzle.fen"
      :side-to-move="puzzle.sideToMove"
    />
    <EmptyState
      v-else
      :title="$t('home.bottom.daily.empty.title')"
      :description="$t('home.bottom.daily.empty.desc')"
    />

    <!--     <template
      v-if="puzzle"
      #footer
    >
      <BaseButton
        block
        variant="primary"
        class="daily-card__cta"
        @click="$emit('solve')"
      >
        {{ $t('home.bottom.daily.solve') }} →
      </BaseButton>
    </template> -->
  </BaseCard>
</template>

<script setup lang="ts">
import PuzzleBoardWithSide
  from '@app/features/puzzles/components/PuzzleBoardWithSide.vue';
import type {
  PuzzleSummary,
} from '@app/features/puzzles/composables/usePuzzleLibrary.js';
import BaseBadge from '@app/shared/ui/BaseBadge/BaseBadge.vue';
import BaseCard from '@app/shared/ui/BaseCard/BaseCard.vue';
import EmptyState from '@app/shared/ui/EmptyState/EmptyState.vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(defineProps<{ puzzle: PuzzleSummary | null; streak?: number }>(), {
  streak: 0,
});
defineEmits<(e: 'solve') => void>();

const { t } = useI18n();

const subtitle = computed<string>(() => {
  const p = props.puzzle;
  if (!p) return t('home.bottom.daily.sub');
  const obj = p.objective;
  const elo = t('home.bottom.daily.eloShort', { n: p.elo });
  if (obj?.kind === 'mate') return `${elo} · ${t('home.bottom.daily.mateInN', { n: obj.moves })}`;
  if (obj?.kind === 'best-move') return `${elo} · ${t('home.bottom.daily.bestMove')}`;
  return elo;
});
</script>

<style scoped lang="scss">
.daily-card {
  min-height: 220px;
  cursor: pointer;
  
  &:hover {
    border-color: var(--border-strong);
    background: var(--surface-hover);
  }
}

.daily-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sp-2);
  width: 100%;
}

.daily-card__head-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.daily-card__title {
  font-family: var(--font-display), sans-serif;
  font-size: var(--fs-lg);
  font-weight: 600;
  color: var(--text);
  letter-spacing: var(--tracking-tight);
}

.daily-card__sub {
  font-size: var(--fs-xs);
  color: var(--text-faint);
}

.daily-card__cta {
  width: 100%;
}
</style>
