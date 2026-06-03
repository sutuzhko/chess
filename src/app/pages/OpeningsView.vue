<template>
  <main class="openings-view">
    <div class="openings">
      <OpeningsHeader
        :eco="openingEco"
        :title-key="openingTitleKey"
        :games-total="gamesTotal"
        :avg-rating="positionSummary?.avgRating ?? null"
        :orientation="orientation"
        :in-repertoire="inRepertoire"
        @update:orientation="orientation = $event"
        @bookmark="toggleRepertoire"
        @train="train"
      />

      <div class="openings__catalog-row">
        <button
          type="button"
          class="openings__catalog-btn"
          @click="catalogOpen = true"
        >
          <span class="openings__catalog-icon"><AppIcon
            name="search"
            :size="16"
          /></span>
          <span class="openings__catalog-label">{{ $t('openings.catalogOpen') }}</span>
          <span class="openings__catalog-kbd t-mono">{{ catalogShortcut }}</span>
        </button>
        <OpeningsBreadcrumbs
          :breadcrumbs="breadcrumbs"
          :ply="ply"
          :eco="openingEco"
          :title-key="openingTitleKey"
          @go-to-ply="goToPly"
        />
      </div>

      <div class="openings__body">
        <OpeningsBoardPanel
          :board-moves="boardMoves"
          :flipped="flipped"
          :side-to-move="sideToMove"
          :can-back="canBack"
          :can-forward="canForward"
          :preview-uci="previewUci"
          @back="goBack"
          @forward="goForward"
          @flip="toggleFlip"
          @play="onPlay"
        />

        <aside class="openings__side">
          <OpeningsPositionSummary :summary="positionSummary" />
          <OpeningsMovesCard
            :responses="visibleResponses"
            :loading="responsesLoading"
            :move-prefix="movePrefix"
            :side-to-move="sideToMove"
            :repertoire-fens="repertoireFens"
            :sort="sort"
            :min-games="minGames"
            :max-games="maxGames"
            :active-uci="previewUci"
            @update:sort="sort = $event"
            @update:min-games="minGames = $event"
            @play="onPlay"
            @hover="previewUci = $event"
            @hover-end="previewUci = null"
          />
        </aside>
      </div>
    </div>

    <!-- Мобильная нижняя панель: «В репертуар» + «Тренировать» (на десктопе они в шапке) -->
    <div class="openings__bottom-bar">
      <BaseButton
        variant="tertiary"
        size="sm"
        :class="{ 'is-saved': inRepertoire }"
        @click="toggleRepertoire"
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
        block
        @click="train"
      >
        {{ $t('openings.train') }}
        <AppIcon
          name="bolt"
          :size="16"
        />
      </BaseButton>
    </div>

    <OpeningsCatalog
      v-if="catalogOpen"
      :catalog="catalog"
      :active-name="selectedName"
      :repertoire="repertoireEntries"
      @select="selectOpening"
      @remove-repertoire="repertoire.remove"
      @close="catalogOpen = false"
    />
  </main>
</template>

<script setup lang="ts">
import OpeningsBoardPanel
  from '@app/features/openings/components/OpeningsBoardPanel.vue';
import OpeningsBreadcrumbs
  from '@app/features/openings/components/OpeningsBreadcrumbs.vue';
import OpeningsCatalog
  from '@app/features/openings/components/OpeningsCatalog.vue';
import OpeningsHeader
  from '@app/features/openings/components/OpeningsHeader.vue';
import OpeningsMovesCard
  from '@app/features/openings/components/OpeningsMovesCard.vue';
import OpeningsPositionSummary
  from '@app/features/openings/components/OpeningsPositionSummary.vue';
import {
  useOpeningsExplorer,
} from '@app/features/openings/composables/useOpeningsExplorer.js';
import {
  useOpeningsRepertoire,
} from '@app/features/openings/composables/useOpeningsRepertoire.js';
import AppIcon from '@app/shared/ui/AppIcon/AppIcon.vue';
import BaseButton from '@app/shared/ui/BaseButton/BaseButton.vue';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const {
  catalog,
  selectedName,
  boardMoves,
  currentFen,
  currentLineSan,
  visibleResponses,
  responsesLoading,
  positionSummary,
  gamesTotal,
  maxGames,
  sort,
  minGames,
  breadcrumbs,
  sideToMove,
  movePrefix,
  flipped,
  openingTitleKey,
  openingEco,
  canBack,
  canForward,
  ply,
  selectOpening,
  playMove,
  goBack,
  goForward,
  goToPly,
  toggleFlip,
  train,
} = useOpeningsExplorer();

const repertoire = useOpeningsRepertoire();
const repertoireEntries = repertoire.entries;
const inRepertoire = computed(() => repertoire.has(currentFen.value));
const repertoireFens = computed(
  () => new Set(repertoireEntries.value.map((e) => e.fen)),
);

function toggleRepertoire(): void {
  repertoire.toggle({
    fen: currentFen.value,
    name: openingTitleKey.value || null,
    eco: openingEco.value,
    moves: currentLineSan.value,
  });
}

const catalogOpen = ref(false);
const previewUci = ref<string | null>(null);

function onPlay(uci: string, san: string): void {
  previewUci.value = null;
  playMove(uci, san);
}

const orientation = computed<'white' | 'black'>({
  get: () => (flipped.value ? 'black' : 'white'),
  set: (value) => {
    if ((value === 'black') !== flipped.value) toggleFlip();
  },
});

const isMac =
  typeof navigator !== 'undefined' && /Mac|iP(hone|ad)/.test(navigator.userAgent);
const catalogShortcut = isMac ? '⌘ + K' : 'Ctrl + K';

function onKeydown(e: KeyboardEvent): void {
  if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    catalogOpen.value = true;
  }
}

onMounted(() => { document.addEventListener('keydown', onKeydown); });
onBeforeUnmount(() => { document.removeEventListener('keydown', onKeydown); });
</script>

<style scoped lang="scss">
@use '../assets/mixins' as m;
@include m.typography-helpers;

.openings-view {
  position: relative;
  height: calc(100dvh - var(--nav-height));
  background: var(--bg);
}

.openings {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  padding: var(--sp-4);
  width: 100%;
  max-width: var(--container-max);
  height: 100%;
  min-height: 0;
  margin: 0 auto;
}

.openings__catalog-row {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: var(--sp-3);
  align-items: stretch;
}

.openings__catalog-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  height: 38px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  cursor: pointer;
  color: var(--text);
  font-size: var(--fs-sm);
  font-weight: 500;
  transition: background var(--dur-base), border-color var(--dur-base);

  &:hover {
    background: var(--surface-hover);
    border-color: var(--border-strong);
  }
}

.openings__catalog-icon {
  display: flex;
  flex-shrink: 0;
  color: var(--text-faint);

}

.openings__catalog-label {
  flex: 1;
  min-width: 0;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.openings__catalog-kbd {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--text-faint);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--border);
  background: var(--surface-sunk);
}

.openings__body {
  display: grid;
  grid-template-columns: minmax(400px, 1fr) minmax(300px, 550px);
  gap: var(--sp-3);
  flex: 1;
  min-height: 0;
}

.openings__side {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  min-height: 0;
  min-width: 0;
}

@include m.tablet {
  .openings-view { height: auto; }

  .openings { height: auto; }

  .openings__catalog-row { grid-template-columns: 1fr; }

  .openings__body {
    grid-template-columns: 1fr;
    flex: none;
  }
}

.openings__bottom-bar {
  display: none;
}

@include m.mobile {
  .openings__bottom-bar {
    display: flex;
    gap: var(--sp-2);
    padding-top: var(--sp-3);
    border-top: 1px solid var(--border);
    flex-shrink: 0;
  }

  .openings__bottom-bar :deep(.base-btn--block) {
    flex: 1;
  }

  .openings__bottom-bar :deep(.base-btn.is-saved) {
    color: var(--accent);
  }

  .openings__bottom-bar :deep(.base-btn.is-saved .app-icon) {
    fill: var(--accent);
  }
}
</style>
