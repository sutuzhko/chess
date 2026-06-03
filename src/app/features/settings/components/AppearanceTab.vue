<template>
  <div class="settings-body">
    <SettingsSection :title="t('settings.appearance.theme')">
      <div class="theme-cards">
        <ThemeCard
          v-for="opt in THEME_OPTIONS"
          :key="opt.value"
          :variant="opt.value"
          :label="opt.label"
          :active="settings.theme === opt.value"
          @click="settings.theme = opt.value"
        />
      </div>
    </SettingsSection>

    <SettingsSection :title="t('settings.appearance.accent')">
      <div class="accent-swatches">
        <PaletteSwatch
          v-for="opt in ACCENT_OPTIONS"
          :key="opt.value"
          :color="opt.color"
          :active="settings.accent === opt.value"
          :aria-label="opt.label"
          @click="settings.accent = opt.value"
        />
      </div>
    </SettingsSection>

    <SettingsSection :title="t('settings.appearance.board')">
      <div class="palette-grid">
        <PaletteCard
          v-for="opt in BOARD_OPTIONS"
          :key="opt.value"
          :label="opt.label"
          :light="opt.light"
          :dark="opt.dark"
          :active="settings.board === opt.value"
          @click="settings.board = opt.value"
        />
      </div>
    </SettingsSection>

    <SettingsSection :title="t('settings.appearance.pieceSet')">
      <div class="piece-set-grid">
        <button
          v-for="opt in PIECE_SET_OPTIONS"
          :key="opt.value"
          class="piece-set-thumb"
          :class="{ 'is-active': settings.pieceSet === opt.value, 'is-disabled': opt.disabled }"
          :disabled="opt.disabled"
          @click="onPieceSet(opt)"
        >
          <span class="piece-set-thumb__sample">
            <img
              :src="figureUrl('knight-white')"
              class="piece-set-thumb__img"
              alt=""
              aria-hidden="true"
              draggable="false"
            >
          </span>
          <span class="piece-set-thumb__name">
            {{ opt.label }}<span
              v-if="opt.disabled"
              class="piece-set-thumb__hint"
            > · {{ t('settings.common.soon') }}</span>
          </span>
        </button>
      </div>
    </SettingsSection>

    <SettingsSection :title="t('settings.appearance.density')">
      <div class="density-cards">
        <DensityCard
          v-for="opt in DENSITY_OPTIONS"
          :key="opt.value"
          :density="opt.value"
          :label="opt.label"
          :active="settings.density === opt.value"
          :disabled="!!opt.disabled"
          @click="onDensity(opt)"
        />
      </div>
    </SettingsSection>
  </div>
</template>

<script setup lang="ts">
import {
  ACCENT_OPTIONS,
  BOARD_OPTIONS,
  DENSITY_OPTIONS,
  PIECE_SET_OPTIONS,
  THEME_OPTIONS,
} from '@app/features/settings/config/settings-options.js';
import DensityCard from '@app/shared/ui/DensityCard/DensityCard.vue';
import PaletteCard from '@app/shared/ui/PaletteCard/PaletteCard.vue';
import PaletteSwatch from '@app/shared/ui/PaletteSwatch/PaletteSwatch.vue';
import ThemeCard from '@app/shared/ui/ThemeCard/ThemeCard.vue';
import { useSettingsStore } from '@app/stores/settings.js';
import { figureUrl } from '@shared/config/asset-path.js';
import { useI18n } from 'vue-i18n';
import SettingsSection from './SettingsSection.vue';

interface PieceSetOption { value: typeof PIECE_SET_OPTIONS[number]['value']; disabled?: boolean }
interface DensityOption { value: typeof DENSITY_OPTIONS[number]['value']; disabled?: boolean }

const settings = useSettingsStore();
const { t } = useI18n();

function onPieceSet(opt: PieceSetOption): void {
  if (opt.disabled) return;
  settings.pieceSet = opt.value;
}

function onDensity(opt: DensityOption): void {
  if (opt.disabled) return;
  settings.density = opt.value;
}
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.theme-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--sp-3);
}

.accent-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}

.palette-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--sp-3);

  @include m.mobile {
    grid-template-columns: repeat(2, 1fr);
  }
}

.piece-set-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--sp-3);

  @include m.mobile {
    grid-template-columns: repeat(2, 1fr);
  }
}

.piece-set-thumb {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--sp-2);
  padding: var(--sp-3);
  background: var(--surface);

  @include m.card-border(var(--r-md));

  color: var(--text);
  cursor: pointer;
  text-align: left;

  &.is-active {
    border-color: var(--accent);
    background: var(--accent-soft);
  }

  &.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.piece-set-thumb__sample {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  color: var(--text);

  .piece-set-thumb__img {
    width: 60%;
    height: 60%;
    object-fit: contain;
  }
}

.piece-set-thumb__name {
  font-size: var(--fs-sm);
  font-weight: 500;
  color: var(--text);
}

.piece-set-thumb__hint {
  color: var(--text-faint);
  font-weight: 400;
}

.density-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--sp-3);

  @include m.mobile {
    grid-template-columns: 1fr;
  }
}
</style>
