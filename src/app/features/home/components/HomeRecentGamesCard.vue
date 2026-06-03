<template>
  <BaseCard
    class="recent-card"
    padding="none"
  >
    <template #header>
      <div class="recent-card__head">
        <div>
          <div class="recent-card__title">
            {{ $t('home.bottom.recent.title') }}
          </div>
          <div class="recent-card__sub">
            {{ subtitleText }}
          </div>
        </div>
        <BaseButton
          v-if="totalCount && totalCount > 0"
          variant="ghost"
          size="sm"
          :disabled="true"
          @click="$emit('history')"
        >
          {{ $t('home.bottom.recent.history') }}
          <span
            class="lang-card__hint"
          >
            {{ t('settings.common.soon') }}
          </span>
          <!--           <IconArrowRight class="recent-card__action-arrow" /> -->
        </BaseButton>
      </div>
    </template>

    <ul
      v-if="games.length > 0"
      class="recent-card__list"
    >
      <li
        v-for="g in games"
        :key="g.id"
      >
        <HomeRecentGameItem
          :game="g"
          @open="(id) => $emit('open', id)"
        />
      </li>
    </ul>
    <EmptyState
      v-else
      :title="$t('home.bottom.recent.empty.title')"
      :description="$t('home.bottom.recent.empty.desc')"
    />
  </BaseCard>
</template>

<script setup lang="ts">
import HomeRecentGameItem
  from '@app/features/home/components/HomeRecentGameItem.vue';
import type {
  RecentGame,
} from '@app/features/home/composables/useHomeStats.js';
import BaseButton from '@app/shared/ui/BaseButton/BaseButton.vue';
import BaseCard from '@app/shared/ui/BaseCard/BaseCard.vue';
import EmptyState from '@app/shared/ui/EmptyState/EmptyState.vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(defineProps<{
  games: readonly RecentGame[];
  /** Полное число завершённых партий (а не только показанных). */
  totalCount?: number;
}>(), { totalCount: 0 });

defineEmits<{
  (e: 'open', id: string): void;
  (e: 'history'): void;
}>();

const { t } = useI18n();

const subtitleText = computed<string>(() => {
  if (props.totalCount === 0) return t('home.bottom.recent.sub');
  return t('home.bottom.recent.subCount', { shown: props.games.length, total: props.totalCount });
});
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.recent-card {
  min-height: 220px;
}

.recent-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sp-2);
  width: 100%;
}

.recent-card__title {
  font-family: var(--font-display), sans-serif;
  font-size: var(--fs-lg);
  font-weight: 600;
  color: var(--text);
  letter-spacing: var(--tracking-tight);
}

.recent-card__sub {
  font-size: var(--fs-xs);
  color: var(--text-faint);
}

.recent-card__action {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  background: transparent;
  border: 0;
  padding: var(--sp-1) var(--sp-2);
  margin: 0;
  color: var(--accent);
  font-size: var(--fs-xs);
  font-weight: 600;
  cursor: pointer;
  border-radius: var(--r-sm);

  @include m.focus-ring;
}

.recent-card__action:hover {
  background: var(--surface-hover);
}

.recent-card__action-arrow {
  width: 14px;
  height: 14px;
}

/* Колонки общие для всех строк: result · opponent · time-control · when · arrow.
 * Дочерние <li> объявлены через display: contents, а .recent-item ниже
 * наследует столбцы через grid-template-columns: subgrid — этим все строки
 * выровнены по одной сетке вне зависимости от длины отдельных значений. */
.recent-card__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr) 64px 96px 24px;
}

.recent-card__list > li {
  display: contents;
}

.recent-card__list > li:first-child :deep(.recent-item) {
  border-top: 0;
}

@include m.mobile {
  .recent-card__list {
    grid-template-columns: 110px minmax(0, 1fr) 24px;
  }
}

.lang-card__hint {
  color: var(--text-faint);
  font-weight: 400;
}
</style>
