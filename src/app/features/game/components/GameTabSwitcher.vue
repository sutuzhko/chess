<template>
  <div class="game-tabs">
    <div class="game-tabs__bar">
      <button
        v-for="tab in visibleTabs"
        :key="tab.id"
        class="game-tabs__btn"
        :class="{ 'is-active': activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Ходы. v-show — слот всегда смонтирован, чтобы game-shell видел ref. -->
    <div
      v-show="moveListVisible"
      class="game-tabs__panel game-tabs__moves"
      :class="{ 'is-active': activeTab === 'moves' }"
    >
      <slot name="move-list" />
    </div>

    <!-- Взяты -->
    <div
      class="game-tabs__panel game-tabs__panel--captured"
      :class="{ 'is-active': activeTab === 'captured' }"
    >
      <div class="game-tabs__captured-row">
        <div class="t-eyebrow">
          Белые взяли
        </div>
        <CapturedPieces
          :pieces="capturedWhite.pieces"
          :advantage="capturedWhite.advantage"
          for-color="white"
        />
      </div>
      <div class="game-tabs__captured-row">
        <div class="t-eyebrow">
          Чёрные взяли
        </div>
        <CapturedPieces
          :pieces="capturedBlack.pieces"
          :advantage="capturedBlack.advantage"
          for-color="black"
        />
      </div>
    </div>

    <!-- Игроки + Управление -->
    <div
      class="game-tabs__panel"
      :class="{ 'is-active': activeTab === 'controls' }"
    >
      <div class="game-tabs__controls">
        <button
          class="btn btn--sm"
          @click="emit('undo')"
        >
          ↶ Отмена
        </button>
        <button
          class="btn btn--sm"
          @click="emit('redo')"
        >
          ↷ Повтор
        </button>
        <button
          class="btn btn--sm"
          :disabled="!canFlip"
          @click="emit('flip')"
        >
          ⇅ Flip
        </button>
        <button
          class="btn btn--sm btn--primary"
          @click="emit('reset')"
        >
          + Новая
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  CapturedDisplay,
} from '@app/features/game/utils/capture-utils.js';
import CapturedPieces from '@app/shared/ui/CapturedPieces/CapturedPieces.vue';
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  capturedWhite: CapturedDisplay;
  capturedBlack: CapturedDisplay;
  canFlip: boolean;
  moveListVisible: boolean;
}>();

const emit = defineEmits<{
  undo: [];
  redo: [];
  flip: [];
  reset: [];
}>();

const TABS = [
  { id: 'moves', label: 'Ходы' },
  { id: 'captured', label: 'Взяты' },
  { id: 'controls', label: 'Управление' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const visibleTabs = computed(() =>
  TABS.filter((t) => (t.id === 'moves' ? props.moveListVisible : true)),
);

const activeTab = ref<TabId>('moves');

// Если активна вкладка ходов и её скрыли — переключаемся на первую доступную.
watch(visibleTabs, (tabs) => {
  if (!tabs.some((t) => t.id === activeTab.value)) {
    activeTab.value = tabs[0]?.id ?? 'captured';
  }
});
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;
@include m.buttons;
@include m.typography-helpers;

/* — game-tabs (компонент-specific) — */
.game-tabs { display: none; }

.game-tabs__bar {
  display: flex;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.game-tabs__btn {
  flex: 1;
  height: 44px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-sans), sans-serif;
  font-size: var(--fs-sm);
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color var(--dur-base) var(--ease-out),
              border-color var(--dur-base) var(--ease-out);

  &.is-active {
    color: var(--text);
    border-bottom-color: var(--accent);
  }
}

.game-tabs__panel {
  padding: var(--sp-3);
  display: none;

  &.is-active { display: block; }
}

.game-tabs__moves {
  padding: var(--sp-2);
  max-height: 240px;
  overflow-y: auto;
}

.game-tabs__players {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.game-tabs__controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-2);
}

/* — captured (innerHTML дочерние) — */
.captured {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  line-height: 1;
  min-height: 22px;
  align-items: center;
}

:deep(.captured__piece) {
  width: 20px;
  height: 20px;
  object-fit: contain;
  display: block;
}

:deep(.captured__advantage) {
  font-family: var(--font-mono), sans-serif;
  font-size: var(--fs-xs);
  font-weight: 600;
  color: var(--accent);
  margin-left: var(--sp-1);
}

.game-tabs__panel--captured {
  display: none;
  flex-direction: column;
  gap: var(--sp-4);

  &.is-active {
    display: flex;
  }
}

.game-tabs__captured-row {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}
</style>
