<template>
  <header class="op-header">
    <div class="op-header__top">
      <div class="op-header__identity">
        <BaseBadge
          v-if="eco"
          tone="accent"
          mono
        >
          {{ eco }}
        </BaseBadge>
        <h1 class="op-header__name">
          {{ titleKey ? $t(titleKey) : $t('openings.startPosition') }}
        </h1>
        <span
          v-if="gamesTotal > 0"
          class="op-header__meta t-mono t-faint"
        >
          {{ $t('openings.gamesTotal', { count: gamesLabel }) }}<template v-if="avgRating"> &middot; {{ $t('openings.avgRating', { rating: avgRating }) }}</template>
        </span>
      </div>

      <!-- Только десктоп: переключатель + кнопки действий -->
      <div class="op-header__actions">
        <Segmented
          :model-value="orientation"
          :options="orientationOptions"
          @update:model-value="emit('update:orientation', $event)"
        />
        <BaseButton
          variant="tertiary"
          size="sm"
          :class="{ 'is-saved': inRepertoire }"
          @click="emit('bookmark')"
        >
          <AppIcon
            name="star"
            :size="16"
          />
          {{ inRepertoire ? $t('openings.inRepertoire') : $t('openings.bookmark') }}
        </BaseButton>
        <BaseButton
          variant="primary"
          size="sm"
          @click="emit('train')"
        >
          {{ $t('openings.train') }}
          <AppIcon
            name="bolt"
            :size="16"
          />
        </BaseButton>
      </div>
    </div>

    <!-- Мобильный sub-ряд: счётчик партий + компактный переключатель (только иконки) -->
    <div
      v-if="gamesTotal > 0"
      class="op-header__sub"
    >
      <span class="op-header__sub-meta t-mono t-faint">
        {{ $t('openings.gamesTotal', { count: gamesLabel }) }}<template v-if="avgRating"> &middot; {{ $t('openings.avgRating', { rating: avgRating }) }}</template>
      </span>
      <Segmented
        :model-value="orientation"
        :options="orientationOptionsCompact"
        @update:model-value="emit('update:orientation', $event)"
      />
    </div>
  </header>
</template>

<script setup lang="ts">
import AppIcon from '@app/shared/ui/AppIcon/AppIcon.vue';
import BaseBadge from '@app/shared/ui/BaseBadge/BaseBadge.vue';
import BaseButton from '@app/shared/ui/BaseButton/BaseButton.vue';
import Segmented from '@app/shared/ui/Segmented/Segmented.vue';
import type { SegmentedOption } from '@app/shared/ui/Segmented/types.js';
import { useSettingsStore } from '@app/stores/settings.js';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  eco: string;
  titleKey: string;
  gamesTotal: number;
  avgRating: number | null;
  orientation: 'white' | 'black';
  inRepertoire: boolean;
}>();

const emit = defineEmits<{
  'update:orientation': [value: 'white' | 'black'];
  bookmark: [];
  train: [];
}>();

const { t, locale } = useI18n();
const settings = useSettingsStore();

const gamesLabel = computed(() =>
  new Intl.NumberFormat(locale.value).format(props.gamesTotal),
);

const orientationOptions = computed<readonly SegmentedOption<'white' | 'black'>[]>(
  () => [
    { value: 'white', label: t('openings.viewWhite'), marker: settings.theme === 'dark' ? '●' : '○' },
    { value: 'black', label: t('openings.viewBlack'), marker: '●' },
  ],
);

/** Метки-иконки для компактного мобильного sub-ряда. */
const orientationOptionsCompact = computed<readonly SegmentedOption<'white' | 'black'>[]>(
  () => [
    { value: 'white', label: '○' },
    { value: 'black', label: '●' },
  ],
);
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;
@include m.typography-helpers;

.op-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.op-header__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
}

.op-header__identity {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}

.op-header__name {
  font-family: var(--font-display), sans-serif;
  font-size: var(--fs-2xl);
  font-weight: 700;
  letter-spacing: var(--tracking-tighter);
  margin: 0;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.op-header__meta {
  font-size: var(--fs-xs);
  white-space: nowrap;
  flex-shrink: 0;
}

.op-header__actions {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  flex-shrink: 0;
}


[data-theme="dark"] .op-header__actions :deep(.segmented__opt[data-value="black"] .segmented__marker) {
  color: #5d6772;
}

.op-header :deep(.base-btn.is-saved) {
  color: var(--accent);
}

.op-header :deep(.base-btn.is-saved .app-icon) {
  fill: var(--accent);
}

/* Mobile sub-row — hidden on desktop */
.op-header__sub {
  display: none;
}

@include m.mobile {
  .op-header__meta { display: none; }
  .op-header__actions { display: none; }

  .op-header__sub {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .op-header__sub-meta {
    flex: 1;
    font-size: var(--fs-xs);
  }
}
</style>
