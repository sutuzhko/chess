<template>
  <div class="home-stats">
    <StatTile
      :label="$t('home.stats.played')"
      :value="stats.played"
      :delta="deltaFor(deltas.played)"
    />
    <StatTile
      :label="$t('home.stats.solved')"
      :value="stats.solved"
      :delta="deltaFor(deltas.solved)"
    />
    <StatTile
      :label="$t('home.stats.rating')"
      :value="stats.rating"
      :delta="deltaFor(deltas.rating)"
    />
    <StatTile
      :label="$t('home.stats.streak')"
      :value="stats.streak"
      brand
    />
  </div>
</template>

<script setup lang="ts">
import type {
  HomeStats,
  HomeStatsDeltas,
} from '@app/features/home/composables/useHomeStats.js';
import StatTile from '@app/shared/ui/StatTile/StatTile.vue';
import type { StatDelta } from '@app/shared/ui/StatTile/types.js';

defineProps<{
  stats: HomeStats;
  deltas: HomeStatsDeltas;
}>();

function deltaFor(n: number): StatDelta | undefined {
  if (n === 0) return undefined;
  const sign = n > 0 ? '+' : '−';
  return { dir: n > 0 ? 'up' : 'down', text: `${sign}${String(Math.abs(n))}` };
}
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.home-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--sp-3);
}

@include m.tablet {
  .home-stats {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }
}

@include m.mobile {
  .home-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
