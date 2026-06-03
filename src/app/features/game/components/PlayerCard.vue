<template>
  <div
    class="player-card"
    :class="{ 'player-card--active': isActive }"
  >
    <div class="player-card__avatar">
      {{ avatar }}
    </div>
    <div class="player-card__info">
      <div class="player-card__name-row">
        <span class="player-card__name">{{ name }}</span>
        <span
          v-if="showDot"
          class="dot dot--pulse dot--accent"
        />
      </div>
      <CapturedPieces
        v-if="captured?.pieces && captured.advantage"
        :pieces="captured.pieces"
        :advantage="captured.advantage"
        :for-color="forColor"
      />
      <slot name="extra" />
    </div>
    <div
      v-if="clockText"
      :class="clockClass"
    >
      {{ clockText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  CapturedDisplay,
} from '@app/features/game/utils/capture-utils.js';
import CapturedPieces from '@app/shared/ui/CapturedPieces/CapturedPieces.vue';

defineProps<{
  name: string;
  avatar: string;
  isActive: boolean;
  showDot: boolean;
  captured: CapturedDisplay | null;
  forColor: 'white' | 'black';
  clockText: string;
  clockClass: string;
}>();
</script>

<style scoped lang="scss">
.player-card {
  display: grid;
  grid-template-columns: 36px 1fr auto;
  gap: var(--sp-3);
  align-items: flex-start;
  padding: var(--sp-3);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  transition: border-color var(--dur-base) var(--ease-out);

  &--active {
    border-color: var(--accent);
  }
}

.player-card__avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--r-md);
  background: var(--surface-2);
  color: var(--text-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono), sans-serif;
  font-size: var(--fs-sm);
  font-weight: 600;
  flex-shrink: 0;
}

.player-card__info {
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.player-card__name-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}

.player-card__name {
  font-size: var(--fs-base);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// Scoped-копия глобального индикатора-точки, чтобы не зависеть от загрузки app.scss.
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentcolor;
  display: inline-block;
  flex-shrink: 0;
}

.dot--accent { color: var(--accent); }

.dot--pulse {
  animation: dot-pulse 1.6s var(--ease-in-out) infinite;
}

@keyframes dot-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.5;
    transform: scale(1.3);
  }
}

.captured {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  line-height: 1;
  min-height: 20px;
  align-items: center;
  margin-top: 2px;
}

.clock {
  font-size: var(--fs-2xl);
  font-weight: 500;
  padding: 4px 15px;
  min-width: unset;
  border-radius: var(--r-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--clock-bg);
  color: var(--clock-text);
  font-family: var(--font-mono), sans-serif;
  font-variant-numeric: tabular-nums;
  letter-spacing: var(--tracking-tight);
  border: none;
  white-space: nowrap;
  transition: background var(--dur-base) var(--ease-out),
              color var(--dur-base) var(--ease-out);

  &.clock--active {
    background: var(--clock-active-bg);
    color: var(--clock-active-text);
    box-shadow: 0 0 0 2px var(--accent-glow);
  }

  &.clock--low {
    background: var(--clock-low-bg);
    color: var(--clock-low-text);
  }

  &.clock--critical {
    animation: clock-pulse 0.8s var(--ease-in-out) infinite;
  }

  &.clock--out {
    background: var(--surface-2);
    color: var(--text-faint);
    text-decoration: line-through;
  }
}

@keyframes clock-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgb(217 107 107 / 0.5); }
  50% { box-shadow: 0 0 0 6px rgb(217 107 107 / 0); }
}
</style>
