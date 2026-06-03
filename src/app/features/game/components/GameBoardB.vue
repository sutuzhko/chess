<template>
  <div class="board-col">
    <PlayerCard
      v-if="playerCardsVisible"
      name="Команда 2 · Белые · B"
      avatar="W·B"
      :is-active="ui.reserveBTurn === 'white'"
      :show-dot="ui.reserveBTurn === 'white'"
      :captured="null"
      for-color="white"
      :clock-text="ui.clockWhiteB"
      :clock-class="ui.clockWhiteBClass"
      class="player-b"
    >
      <template #extra>
        <div
          v-show="reserveVisible"
          ref="reserveWhiteEl"
          class="reservoir reservoir--inline"
        />
      </template>
    </PlayerCard>
    <canvas
      ref="canvasEl"
      class="board-canvas"
      width="600"
      height="600"
    />
    <PlayerCard
      v-if="playerCardsVisible"
      name="Команда 1 · Чёрные · B"
      avatar="B·B"
      :is-active="ui.reserveBTurn === 'black'"
      :show-dot="ui.reserveBTurn === 'black'"
      :captured="null"
      for-color="black"
      :clock-text="ui.clockBlackB"
      :clock-class="ui.clockBlackBClass"
      class="player-a"
    >
      <template #extra>
        <div
          v-show="reserveVisible"
          ref="reserveBlackEl"
          class="reservoir reservoir--inline"
        />
      </template>
    </PlayerCard>

    <BoardMovesPanel
      v-if="moveListVisible"
      :title="$t('game.boardB.movesTitle')"
      class="board__moves-container"
    >
      <div
        ref="moveListEl"
        class="moves scroll moves--list"
      />
    </BoardMovesPanel>
  </div>
</template>

<script setup lang="ts">
import type {
  GameUiState,
} from '@app/features/game/composables/game-shell/types.js';
import type { BoardBRefs } from '@app/features/game/types/board-b.types.js';
import { onMounted, ref } from 'vue';
import BoardMovesPanel from './BoardMovesPanel.vue';
import PlayerCard from './PlayerCard.vue';

defineProps<{
  ui: GameUiState;
  playerCardsVisible: boolean;
  moveListVisible: boolean;
  reserveVisible: boolean;
}>();

const emit = defineEmits<{ mounted: [BoardBRefs] }>();

const canvasEl = ref<HTMLCanvasElement | null>(null);
const reserveWhiteEl = ref<HTMLElement | null>(null);
const reserveBlackEl = ref<HTMLElement | null>(null);
const moveListEl = ref<HTMLElement | null>(null);

onMounted(() => {
  emit('mounted', {
    canvas: canvasEl.value,
    reserveWhite: reserveWhiteEl.value,
    reserveBlack: reserveBlackEl.value,
    moveList: moveListEl.value,
  });
});
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;
@include m.moves;
@include m.scroll;

.board-col {
  --board-player-card: 72px;
  --board-eval-width: 17px;

  display: grid;
  grid-template: "player-b player-b" var(--board-player-card) "board board" auto "player-a player-a" var(--board-player-card) "moves moves" 1fr / var(--board-eval-width) 1fr;
  gap: var(--sp-2);
  min-width: 0;
}

.board-canvas {
  grid-area: board;
  display: block;
  width: 100%;
  max-width: 600px;
  border-radius: var(--r-sm);
  cursor: pointer;
  user-select: none;

  /* Запрещаем браузерные жесты на canvas — pointer-события идут к нашему контроллеру. */
  touch-action: none;
  flex: 1;
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

@media (width <= 767px) {
  .board-canvas {
    max-width: none;
    border-radius: 0;
  }
}
</style>
