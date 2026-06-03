<template>
  <aside
    class="side-panel"
    :class="{ 'side-panel--under': isShvedki }"
  >
    <!-- Карточка противника -->
    <PlayerCard
      v-if="visibility.playerCards"
      :name="playerOpponentName"
      :avatar="playerOpponentAvatar"
      :is-active="playerOpponentActive"
      :show-dot="playerOpponentShowDot"
      :captured="playerOpponentCaptured"
      :for-color="playerOpponentColor"
      :clock-text="playerOpponentClock"
      :clock-class="playerOpponentClockClass"
    />

    <!-- Список ходов. v-show (не v-if) — внутренний div держит ref для game-shell,
         иначе при выключенной настройке моунт ломается на отсутствующем DOM-ноде. -->
    <div
      v-show="visibility.moveList"
      class="sp-card sp-card--moves"
    >
      <div class="sp-card__header">
        <span class="sp-card__title">{{ $t('game.sidebar.moves') }}</span>
        <span class="sp-badge">{{ moveCountBadge }}</span>
      </div>
      <div class="sp-moves-body">
        <slot name="move-list" />
      </div>
    </div>

    <!-- Карточка своего игрока -->
    <PlayerCard
      v-if="visibility.playerCards"
      :name="playerMeName"
      :avatar="playerMeAvatar"
      :is-active="playerMeActive"
      :show-dot="playerMeShowDot"
      :captured="playerMeCaptured"
      :for-color="playerMeColor"
      :clock-text="playerMeClock"
      :clock-class="playerMeClockClass"
    />

    <!-- Перевернуть доску — недоступно в шведках (две доски) -->
    <div
      v-if="!isShvedki"
      class="sp-cta"
    >
      <button
        class="sp-btn sp-btn--ghost"
        :disabled="!canFlip"
        @click="emit('flip')"
      >
        {{ $t('game.sidebar.flip') }}
      </button>
    </div>

    <!-- Кнопки управления: новая партия / сдача / предложить ничью -->
    <div class="sp-cta">
      <button
        class="sp-btn sp-btn--primary sp-btn--half"
        @click="emit('reset')"
      >
        {{ $t('game.sidebar.newGame') }}
      </button>
      <button
        class="sp-btn sp-btn--ghost sp-btn--quarter"
        @click="emit('resign')"
      >
        {{ $t('game.sidebar.resign') }}
      </button>
      <button
        class="sp-btn sp-btn--ghost sp-btn--quarter"
        :disabled="vsAI"
        @click="emit('offerDraw')"
      >
        {{ $t('game.sidebar.offerDraw') }}
      </button>
    </div>

    <SidebarMatchSetup
      v-if="visibility.matchSetup"
      :game-mode="gameMode"
      :selected-time-control="selectedTimeControl"
      :ai-side="aiSide"
      :ai-depth="aiDepth"
      :time-control-row-visible="timeControlRowVisible"
    />

    <!-- Панель движка -->
    <GameEnginePanel
      v-if="visibility.evalBar"
      :is-busy="engineBusy"
      :data="engineData"
    />

    <!-- Dev-панель -->
    <div
      v-show="devPanelVisible && visibility.devOverlay"
      class="sp-card"
    >
      <div class="sp-card__header">
        <span class="sp-card__title">{{ $t('game.sidebar.devOverlay') }}</span>
      </div>
      <slot name="dev-overlay" />
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { EngineData } from '@app/features/game/types/engine.types.js';
import type {
  CapturedDisplay,
} from '@app/features/game/utils/capture-utils.js';
import { useSettingsStore } from '@app/stores/settings.js';
import { computed } from 'vue';
import GameEnginePanel from './GameEnginePanel.vue';
import PlayerCard from './PlayerCard.vue';
import SidebarMatchSetup from './SidebarMatchSetup.vue';

const props = defineProps<{
  gameMode: string;
  selectedTimeControl: string;
  aiSide: string;
  aiDepth: number;
  canFlip: boolean;
  timeControlRowVisible: boolean;
  moveCountBadge: string;
  engineBusy: boolean;
  engineData: EngineData | null;
  devPanelVisible: boolean;
  playerOpponentName: string;
  playerOpponentAvatar: string;
  playerOpponentActive: boolean;
  playerOpponentShowDot: boolean;
  playerOpponentCaptured: CapturedDisplay;
  playerOpponentColor: 'white' | 'black';
  playerOpponentClock: string;
  playerOpponentClockClass: string;
  playerMeName: string;
  playerMeAvatar: string;
  playerMeActive: boolean;
  playerMeShowDot: boolean;
  playerMeCaptured: CapturedDisplay;
  playerMeColor: 'white' | 'black';
  playerMeClock: string;
  playerMeClockClass: string;
}>();

const emit = defineEmits<{
  flip: [];
  reset: [];
  resign: [];
  offerDraw: [];
}>();

const vsAI = computed(() => props.aiSide !== 'off');

const settings = useSettingsStore();

const isShvedki = computed(() => props.gameMode === 'shvedki');

const visibility = computed(() => {
  if (props.gameMode === 'shvedki') {
    // В шведках карточки игроков и список ходов рендерятся внутри досок, не в sidebar-е.
    return {
      playerCards: false,
      moveList: false,
      matchSetup: settings.shvedkiUI.matchSetup,
      evalBar: false,
      devOverlay: false,
    };
  }
  return {
    playerCards: false,
    moveList: settings.standardUI.moveList,
    matchSetup: settings.standardUI.matchSetup,
    evalBar: settings.standardUI.evalBar,
    devOverlay: settings.standardUI.devOverlay,
  };
});

</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.side-panel {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  width: 100%;
  min-width: 280px;
  flex-shrink: 0;
  overflow-y: auto;
  max-height: calc(100vh - 56px - var(--sp-10));

  @include m.tablet {
    width: 100%;
    min-width: 0;
    max-height: none;
    overflow-y: visible;
    justify-self: center;
  }
}

// Шведки: sidebar разворачивается под двумя досками во всю ширину.
.side-panel--under {
  grid-column: 1 / -1;
  flex-flow: column nowrap;
  align-items: stretch;
  width: 100%;
  max-width: 1100px;
  min-width: 0;
  max-height: none;
  margin: 0 auto;
  overflow-y: visible;

  // Ряд кнопок держит свою высоту — иначе вытягивался под соседа.
  > * {
    flex: 0 0 auto;
  }
}

.sp-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  overflow: hidden;
  min-height: 140px;
  
  &--moves {
    display: flex;
    flex-direction: column;
    min-height: 160px;
  }
}

.sp-card__header {
  padding: var(--sp-3) var(--sp-4);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  cursor: pointer;
  user-select: none;
  list-style: none;

  &::-webkit-details-marker { display: none; }

  &::after {
    // Сбрасываем глобальный details.card > summary::after, если такой задан где-то ещё.
    content: none;
  }
}

.sp-card__title {
  font-family: var(--font-mono), sans-serif;
  font-size: var(--fs-xs);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--text-muted);
  font-weight: 600;
}

.sp-card__body {
  padding: var(--sp-4);
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.sp-moves-body {
  padding: var(--sp-2);
  overflow-y: auto;
  flex: 1;
  min-height: 120px;
  max-height: 280px;
}

.sp-badge {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 var(--sp-2);
  border-radius: var(--r-sm);
  background: var(--surface-3);
  color: var(--text-muted);
  font-family: var(--font-mono), sans-serif;
  font-size: var(--fs-2xs);
  font-weight: 500;
}

.sp-cta {
  display: flex;
  gap: var(--sp-2);
}

.sp-btn {
  flex: 1 1 0;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  height: 36px;
  padding: 0 var(--sp-3);
  border-radius: var(--r-md);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-family: var(--font-sans), sans-serif;
  font-size: var(--fs-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease-out),
              border-color var(--dur-fast) var(--ease-out);
  white-space: nowrap;

  &:hover {
    background: var(--surface-hover);
    border-color: var(--border-strong);
  }

  &:active { transform: translateY(1px); }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    pointer-events: none;
  }

  &--ghost {
    background: transparent;
    border-color: transparent;
    color: var(--text-muted);

    &:hover {
      background: var(--surface-hover);
      color: var(--text);
    }
  }

  &--primary {
    background: var(--accent);
    color: var(--accent-fg);
    border-color: var(--accent);

    &:hover {
      background: var(--accent-soft);
      border-color: var(--accent-soft);
    }
  }

  &--half { flex-grow: 2; }
  &--quarter { flex-grow: 1; }
}

</style>
