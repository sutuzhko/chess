<template>
  <main class="lobby">
    <button
      class="lobby__back"
      @click="router.back()"
    >
      <AppIcon
        name="arrow-left"
        :size="16"
      />
      <span>{{ $t('common.back') }}</span>
    </button>

    <div class="lobby__head">
      <div class="t-eyebrow">
        {{ modeLabel }}
      </div>
      <h1 class="lobby__title">
        {{ $t('lobby.title') }}
      </h1>
      <p class="lobby__lead">
        {{ $t('lobby.lead') }}
      </p>
    </div>

    <div class="lobby__sec">
      <div class="lobby__sec-title">
        {{ $t('lobby.opponent.title') }}
      </div>
      <LobbyOpponentPicker v-model="opponent" />
    </div>

    <div
      v-if="opponent === 'ai'"
      class="lobby__sec"
    >
      <div class="lobby__sec-head">
        <div class="lobby__sec-title">
          {{ $t('lobby.ai.engine') }} · {{ aiLevelLabel }}
        </div>
        <span class="lobby__elo">~ELO {{ aiElo }}</span>
      </div>
      <LobbyAiSlider v-model="aiLevel" />
    </div>

    <div
      v-if="mode !== 'shvedki'"
      class="lobby__sec"
    >
      <div class="lobby__sec-title">
        {{ $t('lobby.side.title') }}
      </div>
      <LobbySidePicker v-model="side" />
    </div>

    <div class="lobby__sec">
      <div class="lobby__sec-title">
        {{ $t('lobby.time.title') }}
      </div>
      <LobbyTimeGrid v-model="selectedTime" />
    </div>

    <div
      v-if="mode === 'standard'"
      class="lobby__sec"
    >
      <div class="lobby__sec-title">
        {{ $t('lobby.fen.title') }}
      </div>
      <LobbyFenInput
        v-model="startFen"
        :invalid="isFenInvalid"
      />
    </div>

    <div class="lobby__cta">
      <BaseButton
        variant="ghost"
        @click="router.back()"
      >
        {{ $t('lobby.cancel') }}
      </BaseButton>
      <BaseButton
        variant="primary"
        :disabled="isFenInvalid"
        size="lg"
        @click="startGame"
      >
        <span>{{ $t('lobby.start') }}</span>
        <AppIcon
          name="arrow-right"
          :size="16"
        />
      </BaseButton>
    </div>
  </main>
</template>

<script setup lang="ts">
import {
  getAiLevelElo,
  getAiLevelLabel,
} from '@app/features/game/config/ai-config.js';
import { parseTimeControl } from '@app/features/game/config/time-controls.js';
import LobbyAiSlider from '@app/features/lobby/components/LobbyAiSlider.vue';
import LobbyFenInput from '@app/features/lobby/components/LobbyFenInput.vue';
import LobbyOpponentPicker
  from '@app/features/lobby/components/LobbyOpponentPicker.vue';
import LobbySidePicker
  from '@app/features/lobby/components/LobbySidePicker.vue';
import LobbyTimeGrid from '@app/features/lobby/components/LobbyTimeGrid.vue';
import type { LobbySide } from '@app/features/lobby/types/lobby.types.js';
import AppIcon from '@app/shared/ui/AppIcon/AppIcon.vue';
import BaseButton from '@app/shared/ui/BaseButton/BaseButton.vue';
import { useGameStore } from '@app/stores/game.js';
import { useSettingsStore } from '@app/stores/settings.js';
import { isFenValid } from '@modules/game/application';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const gameStore = useGameStore();
const settings = useSettingsStore();

const mode = computed(
  () => route.params.mode as 'standard' | 'shvedki' | 'opening_training',
);
// Позиция, прилетевшая через query (?fen=...): используется тренировкой дебютов
// и кнопкой «Продолжить игру с этой позиции» в задачах.
const queryFen = computed(() =>
  typeof route.query.fen === 'string' ? route.query.fen : null,
);
const queryTitle = computed(() =>
  typeof route.query.title === 'string' && route.query.title ? route.query.title : null,
);
const trainName = computed(() =>
  typeof route.query.name === 'string' && route.query.name ? route.query.name : null,
);

const modeLabel = computed(() => {
  if (mode.value === 'shvedki') return t('game.modes.shvedki');
  if (mode.value === 'opening_training') return t('game.modes.openingTraining');
  if (queryFen.value) return t('game.modes.standardFromPosition');
  return t('game.modes.standard');
});

const opponent = ref<'ai' | 'hotseat'>(gameStore.lobbyConfig.opponent);
const aiLevel = ref(settings.aiLevel);
const side = ref<LobbySide>(gameStore.lobbyConfig.side);
const selectedTime = ref('600_0');
// Если позиция пришла через ?fen=... — предзаполняем поле FEN для стандартного режима.
const startFen = ref(mode.value === 'standard' ? (queryFen.value ?? '') : '');

const aiLevelLabel = computed(() => getAiLevelLabel(aiLevel.value));
const aiElo = computed(() => getAiLevelElo(aiLevel.value));
const isFenInvalid = computed(() => {
  const v = startFen.value.trim();
  return v.length > 0 && !isFenValid(v);
});

function startGame(): void {
  if (isFenInvalid.value) return;
  const resolvedSide = side.value === 'random'
    ? (Math.random() < 0.5 ? 'white' : 'black')
    : side.value;

  const customFen = startFen.value.trim();

  gameStore.setConfig({
    mode: mode.value,
    opponent: opponent.value,
    aiLevel: aiLevel.value,
    side: resolvedSide,
    time: parseTimeControl(selectedTime.value),
    ...(mode.value === 'opening_training'
      ? {
          ...(queryFen.value ? { startFen: queryFen.value } : {}),
          openingName: trainName.value,
        }
      : mode.value === 'standard' && customFen
        ? { startFen: customFen, ...(queryTitle.value ? { openingName: queryTitle.value } : {}) }
        : {}),
  });

  settings.aiLevel = aiLevel.value;
  gameStore.setNewGamePending(true);
  const matchId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `m-${String(Date.now())}-${Math.random().toString(36).slice(2, 8)}`;
  void router.push(`/game/${matchId}`);
}
</script>

<style scoped lang="scss">
@use '../assets/mixins' as m;
@include m.typography-helpers;

.lobby {
  display: flex;
  flex-direction: column;
  gap: var(--sp-6);
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--sp-6) var(--sp-5) calc(var(--sp-7) + 80px);
}

.lobby__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 var(--sp-2);
  margin-left: -8px;
  background: transparent;
  border: 0;
  color: var(--text-muted);
  font-size: var(--fs-sm);
  border-radius: var(--r-md);
  width: fit-content;
  cursor: pointer;
  transition: background var(--dur-base), color var(--dur-base);

  &:hover {
    background: var(--surface-hover);
    color: var(--text);
  }
}

.lobby__head {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}

.lobby__title {
  font-family: var(--font-display), sans-serif;
  font-size: var(--fs-3xl);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  margin: 0;
}

.lobby__lead {
  font-size: var(--fs-md);
  color: var(--text-muted);
  margin: 0;
}

.lobby__sec {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.lobby__sec-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
}

.lobby__sec-title {
  font-family: var(--font-mono), monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--text-faint);
}

.lobby__elo {
  font-family: var(--font-mono), monospace;
  font-size: var(--fs-xs);
  letter-spacing: 0.06em;
  padding: 2px 8px;
  border-radius: var(--r-pill);
  background: var(--accent-soft);
  color: var(--accent-ink);
}

.lobby__cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  padding-top: var(--sp-4);
  border-top: 1px solid var(--divider);

  .btn--primary {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-2);

  }
}
</style>
