<template>
  <div class="game-view">
    <div
      class="game-layout"
      :class="{ 'game-layout--shvedki': ui.boardColBVisible }"
    >
      <div
        class="board-col"
        :class="{ '': ui.boardColBVisible }"
      >
        <PlayerCard
          v-if="ui.boardColBVisible && shvedkiPlayerCardsVisible"
          name="Команда 2 · Чёрные · A"
          avatar="B·A"
          :is-active="ui.reserveATurn === 'black'"
          :show-dot="ui.reserveATurn === 'black'"
          :captured="null"
          for-color="black"
          :clock-text="ui.clockBlackA"
          :clock-class="ui.clockBlackAClass"
          class="player-b"
        >
          <template #extra>
            <div
              v-show="shvedkiReserveVisible"
              ref="reserveABlackEl"
              class="reservoir reservoir--inline"
            />
          </template>
        </PlayerCard>
        <PlayerCard
          v-if="!ui.boardColBVisible && standardPlayerCardsVisible"
          :name="slots.opponent.label.value"
          :avatar="slots.opponent.avatar.value"
          :is-active="slots.opponent.active.value"
          :show-dot="slots.opponent.dot.value"
          :captured="slots.opponent.captured.value"
          :for-color="slots.opponent.color.value"
          :clock-text="slots.opponent.clock.value"
          :clock-class="slots.opponent.clockClass.value"
          class="player-b"
        />
        <GameEvalBar
          v-if="evalBarVisible"
          :score-cp="whiteRelativeScore"
          :orientation="ui.orientation"
          class="eval"
        />
        <canvas
          ref="boardCanvasA"
          class="board-canvas"
          width="580"
          height="580"
        />
        <PlayerCard
          v-if="!ui.boardColBVisible && standardPlayerCardsVisible"
          :name="slots.me.label.value"
          :avatar="slots.me.avatar.value"
          :is-active="slots.me.active.value"
          :show-dot="slots.me.dot.value"
          :captured="slots.me.captured.value"
          :for-color="slots.me.color.value"
          :clock-text="slots.me.clock.value"
          :clock-class="slots.me.clockClass.value"
          class="player-a"
        />
        <PlayerCard
          v-if="ui.boardColBVisible && shvedkiPlayerCardsVisible"
          name="Команда 1 · Белые · A"
          avatar="W·A"
          :is-active="ui.reserveATurn === 'white'"
          :show-dot="ui.reserveATurn === 'white'"
          :captured="null"
          for-color="white"
          :clock-text="ui.clockWhiteA"
          :clock-class="ui.clockWhiteAClass"
          class="player-a"
        >
          <template #extra>
            <div
              v-show="shvedkiReserveVisible"
              ref="reserveAWhiteEl"
              class="reservoir reservoir--inline"
            />
          </template>
        </PlayerCard>

        <BoardMovesPanel
          v-if="ui.boardColBVisible && shvedkiMoveListVisible"
          :title="$t('game.boardA.movesTitle')"
          class="board__moves-container"
        >
          <div
            ref="moveListEl"
            class="moves scroll moves--list"
          />
        </BoardMovesPanel>
      </div>

      <GameBoardB
        v-if="ui.boardColBVisible && partnerBoardVisible"
        :ui="ui"
        :player-cards-visible="shvedkiPlayerCardsVisible"
        :move-list-visible="shvedkiMoveListVisible"
        :reserve-visible="shvedkiReserveVisible"
        @mounted="onBoardBMounted"
      />

      <GameSidebar
        :game-mode="ui.gameMode"
        :selected-time-control="selectedTimeControl"
        :ai-side="aiSideValue"
        :ai-depth="aiDepthValue"
        :can-flip="canFlip()"
        :time-control-row-visible="ui.timeControlRowVisible"
        :move-count-badge="ui.moveCountBadge"
        :engine-busy="ui.engineBusy"
        :engine-data="ui.engineData"
        :dev-panel-visible="ui.devPanelVisible"
        :player-opponent-name="slots.opponent.label.value"
        :player-opponent-avatar="slots.opponent.avatar.value"
        :player-opponent-active="slots.opponent.active.value"
        :player-opponent-show-dot="slots.opponent.dot.value"
        :player-opponent-captured="slots.opponent.captured.value"
        :player-opponent-color="slots.opponent.color.value"
        :player-opponent-clock="slots.opponent.clock.value"
        :player-opponent-clock-class="slots.opponent.clockClass.value"
        :player-me-name="slots.me.label.value"
        :player-me-avatar="slots.me.avatar.value"
        :player-me-active="slots.me.active.value"
        :player-me-show-dot="slots.me.dot.value"
        :player-me-captured="slots.me.captured.value"
        :player-me-color="slots.me.color.value"
        :player-me-clock="slots.me.clock.value"
        :player-me-clock-class="slots.me.clockClass.value"
        @flip="doFlip"
        @reset="doReset"
        @resign="doResign"
      >
        <template #move-list>
          <div
            ref="moveListEl"
            class="moves scroll moves--list"
          />
        </template>
        <template #dev-overlay>
          <div
            ref="devOverlayEl"
            class="dev-overlay-content"
          />
        </template>
      </GameSidebar>

      <GameTabSwitcher
        :captured-white="ui.capturedWhite"
        :captured-black="ui.capturedBlack"
        :can-flip="canFlip()"
        :move-list-visible="mobileMoveListVisible"
        @undo="doUndo"
        @redo="doRedo"
        @flip="doFlip"
        @reset="doReset"
      >
        <template #move-list>
          <div
            ref="moveListMobileEl"
            class="moves scroll moves--list"
          />
        </template>
      </GameTabSwitcher>
    </div>

    <PromotionModal @mounted="onPromotionMounted" />
    <GameOverModal @mounted="onGameOverMounted" />
  </div>
</template>

<script setup lang="ts">
import BoardMovesPanel from '@app/features/game/components/BoardMovesPanel.vue';
import GameBoardB from '@app/features/game/components/GameBoardB.vue';
import GameEvalBar from '@app/features/game/components/GameEvalBar.vue';
import GameOverModal from '@app/features/game/components/GameOverModal.vue';
import GameSidebar from '@app/features/game/components/GameSidebar.vue';
import GameTabSwitcher from '@app/features/game/components/GameTabSwitcher.vue';
import PlayerCard from '@app/features/game/components/PlayerCard.vue';
import {
  useGameUiShell,
} from '@app/features/game/composables/useGameUiShell.js';
import {
  usePlayerSlots,
} from '@app/features/game/composables/usePlayerSlots.js';
import type { BoardBRefs } from '@app/features/game/types/board-b.types.js';
import PromotionModal from '@app/shared/ui/PromotionModal/PromotionModal.vue';
import { useSettingsStore } from '@app/stores/settings.js';
import { computed } from 'vue';

const settings = useSettingsStore();
const standardPlayerCardsVisible = computed(() => settings.standardUI.playerCards);
const partnerBoardVisible = computed(() => settings.shvedkiUI.partnerBoard);
const shvedkiPlayerCardsVisible = computed(() => settings.shvedkiUI.playerCards);
const shvedkiMoveListVisible = computed(() => settings.shvedkiUI.moveList);
const shvedkiReserveVisible = computed(() => settings.shvedkiUI.reserve);

const {
  boardCanvasA, boardCanvasB,
  moveListEl, moveListBEl, moveListMobileEl, devOverlayEl, promotionEl, notificationEl,
  reserveAWhiteEl, reserveABlackEl, reserveBWhiteEl, reserveBBlackEl,
  ui, selectedTimeControl, aiSideValue, aiDepthValue,
  canFlip,
  doUndo, doRedo, doReset, doFlip, doResign,
} = useGameUiShell();

const evalBarVisible = computed(() => settings.standardUI.evalBar && !ui.boardColBVisible);

// Мобильный таб-свитчер показывает список ходов того режима, в котором находимся.
const mobileMoveListVisible = computed(() =>
  ui.boardColBVisible ? settings.shvedkiUI.moveList : settings.standardUI.moveList,
);

// Оценки движка — относительно стороны хода (negamax); шкала читает абсолютную, white-relative.
const whiteRelativeScore = computed(() => {
  const raw = ui.engineData?.score ?? 0;
  return ui.fen.split(' ')[1] === 'b' ? -raw : raw;
});

const slots = usePlayerSlots(ui);

function onPromotionMounted(el: HTMLElement): void { promotionEl.value = el; }
function onGameOverMounted(el: HTMLElement): void { notificationEl.value = el; }
function onBoardBMounted(r: BoardBRefs): void {
  boardCanvasB.value = r.canvas;
  reserveBWhiteEl.value = r.reserveWhite;
  reserveBBlackEl.value = r.reserveBlack;
  moveListBEl.value = r.moveList;
}
</script>

<style scoped lang="scss">
@use '../assets/mixins' as m;
@include m.moves;
@include m.scroll;

/* — reservoir (Bughouse, дочерние из JS) — */
.reservoir {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  padding: var(--sp-3);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
}

.reservoir--inline {
  padding: 0;
  background: transparent;
  border: none;
}

:deep(.reservoir__row) {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-1);
  min-height: 36px;
  align-items: center;
}

:deep(.reservoir__piece) {
  width: 36px;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--bg-elev);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  cursor: pointer;
  position: relative;
  transition: all var(--dur-fast) var(--ease-out);
  user-select: none;

  &:hover {
    border-color: var(--accent);
    transform: translateY(-1px);
  }

  &.is-selected {
    background: var(--accent);
    color: var(--accent-fg);
    border-color: var(--accent);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;

    &:hover {
      border-color: var(--border);
      transform: none;
    }
  }
}

:deep(.reservoir__piece-img) {
  width: 28px;
  height: 28px;
  object-fit: contain;
  pointer-events: none;
}

:deep(.reservoir__count) {
  position: absolute;
  bottom: 1px;
  right: 3px;
  font-size: var(--fs-2xs);
  font-family: var(--font-mono), sans-serif;
  color: var(--text-muted);
  font-weight: 600;
}

:deep(.reservoir__piece.is-selected .reservoir__count) {
  color: var(--accent-fg);
}

/* — dev-overlay-content — */
.dev-overlay-content {
  max-height: 320px;
  overflow-y: auto;
  padding: var(--sp-3);
  font-family: var(--font-mono), sans-serif;
  font-size: var(--fs-2xs);
  color: var(--text-muted);
  white-space: pre-wrap;
  line-height: 1.55;
}

.game-view {
  display: flex;
  flex-direction: column;
  background: var(--bg);
  
  @include m.mobile {
    padding: 16px 8px 0;
  }
}

.game-layout {
  display: grid;
  justify-content: center;
  grid-template-columns: minmax(0, 1fr) minmax(0, 420px);
  gap: var(--sp-5);
  padding: var(--sp-5);
  align-items: flex-start;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;

  &--shvedki {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: var(--sp-4);
    padding: var(--sp-4);
    width: 100%;
    max-width: var(--container-max);
    margin: 0 auto;
    
    @include m.mobile {
      grid-template-columns: minmax(0, var(--board-size));
    }
  }
  
  @include m.mobile {
    gap: var(--sp-6);
    grid-template-columns: minmax(0, var(--board-size));
    justify-content: center;
    padding: var(--sp-2) var(--sp-2) var(--sp-11);
  }
}

.board-col {
  --board-player-card: 72px;
  --board-eval-width: 17px;

  display: grid;
  grid-template: "player-b player-b" var(--board-player-card) "eval-bar board" auto "player-a player-a" var(--board-player-card) "moves moves" 1fr / var(--board-eval-width) 1fr;
  gap: var(--sp-2);
  min-width: 0;

  --row-max-w: var(--board-size);
}

.game-layout--shvedki .board-col {
  grid-template-areas:
    "player-b player-b"
    "board board"
    "player-a player-a"
    "moves moves";
  gap: var(--sp-3);
}

.player-b {
  grid-area: player-b;
}

.player-a {
  grid-area: player-a;
}

.eval {
  grid-area: eval-bar;
}

.board__moves-container {
  grid-area: moves;
}

.board-col__inner {
  display: flex;
  align-items: stretch;
  gap: var(--sp-2);
  width: 100%;
  max-width: var(--row-max-w);
}

.board-col > :deep(.player-card) {
  width: 100%;
  max-width: var(--row-max-w);
}

@include m.desktop {
  .board-col {
    --row-max-w: calc(var(--board-size) + var(--advantage-width) + var(--sp-2));
  }
}

.board-canvas {
  grid-area: board;
  display: block;
  width: 100%;
  max-width: var(--board-size);
  border-radius: var(--r-sm);
  cursor: pointer;
  user-select: none;
  touch-action: none;
  flex: 1;
}

@include m.tablet {
  .board-col {
    --row-max-w: var(--board-size);
  }
}

@include m.mobile {
  .board-canvas {
    max-width: none;
  }
}
</style>
