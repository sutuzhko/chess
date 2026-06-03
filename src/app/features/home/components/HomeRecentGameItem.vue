<template>
  <button
    type="button"
    class="recent-item"
    @click="$emit('open', game.id)"
  >
    <span
      class="recent-item__result"
      :class="`recent-item__result--${dotKind}`"
    >
      <span class="recent-item__dot" />
      <span class="recent-item__result-label">
        {{ $t('home.recentGames.result.' + game.result) }}
      </span>
    </span>

    <span class="recent-item__main">
      <span class="recent-item__opponent">{{ opponentLabel }}</span>
      <span class="recent-item__sub">{{ modeLabel }} · {{ $t('home.recentGames.moves', { n: game.moves }) }}</span>
    </span>

    <span
      v-if="timeControlText"
      class="recent-item__tc"
    >
      {{ timeControlText }}
    </span>

    <span class="recent-item__when">{{ relativeText }}</span>
  </button>
</template>

<script setup lang="ts">
import type {
  RecentGame,
  RecentGameResult,
} from '@app/features/home/composables/useHomeStats.js';
import {
  formatTimeControl,
  relativeTimeKey,
} from '@app/features/home/config/recent-game-meta.js';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{ game: RecentGame }>();
defineEmits<(e: 'open', id: string) => void>();

const { t } = useI18n();

/** Категория результата для цвета точки/текста (success / danger / muted). */
const dotKind = computed<'win' | 'loss' | 'draw'>(() => mapResultToDot(props.game.result));

function mapResultToDot(r: RecentGameResult): 'win' | 'loss' | 'draw' {
  if (r === 'win') return 'win';
  if (r === 'loss') return 'loss';
  return 'draw';
}

const opponentLabel = computed<string>(() => {
  const o = props.game.opponent;
  if (o.kind === 'team') return t('home.recentGames.opponent.team');
  if (o.kind === 'hotseat') return t('home.recentGames.opponent.hotseat');
  if (typeof o.aiLevel === 'number') {
    return t('home.recentGames.opponent.aiLevel', { name: t('home.recentGames.opponent.aiName'), level: o.aiLevel });
  }
  return t('home.recentGames.opponent.aiName');
});

const modeLabel = computed<string>(() => {
  if (props.game.mode === 'shvedki') return t('home.modes.shvedki.title');
  if (props.game.mode === 'opening_training') return t('game.modes.openingTraining');
  return t('home.modes.standard.title');
});

const timeControlText = computed<string | null>(() => {
  const tc = props.game.timeControl;
  if (!tc) return null;
  return formatTimeControl(tc.initialSeconds, tc.incrementSeconds);
});

const relativeText = computed<string>(() => {
  const r = relativeTimeKey(props.game.savedAt);
  return r.n === undefined ? t(r.key) : t(r.key, { n: r.n });
});
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

/* Строка наследует столбцы у .recent-card__list (subgrid), благодаря чему
 * все строки выровнены по одной общей сетке. */
.recent-item {
  display: grid;
  grid-template-columns: subgrid;
  grid-column: 1 / -1;
  align-items: center;
  gap: var(--sp-4);
  padding: var(--sp-3) var(--sp-4);
  background: transparent;
  border: 0;
  border-top: 1px solid var(--border-subtle, var(--border));
  cursor: pointer;
  text-align: left;
  color: var(--text);
  transition: background var(--dur-base) var(--ease-out);

  @include m.focus-ring;
}

.recent-item:hover {
  background: var(--surface-hover);
}

.recent-item__result {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  font-size: var(--fs-sm);
  font-weight: 500;
}

.recent-item__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--text-faint);
}

.recent-item__result--win .recent-item__dot { background: var(--success); }
.recent-item__result--loss .recent-item__dot { background: var(--danger); }
.recent-item__result--draw .recent-item__dot { background: var(--text-faint); }

.recent-item__result--win .recent-item__result-label { color: var(--success); }
.recent-item__result--loss .recent-item__result-label { color: var(--danger); }
.recent-item__result--draw .recent-item__result-label { color: var(--text-muted); }

.recent-item__main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.recent-item__opponent {
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-item__sub {
  font-size: var(--fs-xs);
  color: var(--text-muted);
}

.recent-item__tc {
  font-family: var(--font-mono), sans-serif;
  font-size: var(--fs-xs);
  font-weight: 600;
  color: var(--text-muted);
  padding: 2px var(--sp-2);
  border: 1px solid var(--border);
  border-radius: 999px;
  font-feature-settings: 'tnum';
  white-space: nowrap;
  justify-self: start;
  text-align: center;
  min-width: 56px;
}

.recent-item__when {
  font-size: var(--fs-xs);
  color: var(--text-faint);
  white-space: nowrap;
  text-align: right;
}

@include m.mobile {
  .recent-item__tc,
  .recent-item__when {
    display: none;
  }
}
</style>
