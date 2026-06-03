<template>
  <main class="home">
    <HomeHero />

    <HomeResumeCard
      v-if="hasLastGame"
      :sub="resumeSub"
      @resume="resumeGame"
    />

    <HomeModesGrid @go="goTo" />

    <HomeStatsGrid
      :stats="stats"
      :deltas="deltas"
    />

    <section class="home__bottom-split">
      <HomeRecentGamesCard
        :games="recentGames"
        :total-count="stats.played"
        @open="openMatch"
        @history="openHistory"
      />
      <HomeDailyPuzzleCard
        :puzzle="dailyPuzzle"
        :streak="stats.streak"
        @solve="openDailyPuzzle"
      />
    </section>
  </main>
</template>

<script setup lang="ts">
import HomeDailyPuzzleCard
  from '@app/features/home/components/HomeDailyPuzzleCard.vue';
import HomeHero from '@app/features/home/components/HomeHero.vue';
import HomeModesGrid from '@app/features/home/components/HomeModesGrid.vue';
import HomeRecentGamesCard
  from '@app/features/home/components/HomeRecentGamesCard.vue';
import HomeResumeCard from '@app/features/home/components/HomeResumeCard.vue';
import HomeStatsGrid from '@app/features/home/components/HomeStatsGrid.vue';
import { useHomeStats } from '@app/features/home/composables/useHomeStats.js';
import { useRouter } from 'vue-router';

const router = useRouter();
const {
  hasLastGame, lastMatchId, resumeSub,
  stats, deltas, recentGames, dailyPuzzle,
} = useHomeStats();

function goTo(path: string): void {
  void router.push(path);
}

function resumeGame(): void {
  const id = lastMatchId.value;
  if (!id) return;
  void router.push(`/game/${id}`);
}

function openMatch(id: string): void {
  void router.push(`/game/${id}`);
}

function openHistory(): void {
  void router.push('/lobby/standard');
}

function openDailyPuzzle(): void {
  const p = dailyPuzzle.value;
  if (!p) return;
  void router.push({ name: 'puzzle-solve', params: { id: p.id } });
}
</script>

<style scoped lang="scss">
@use '../assets/mixins' as m;

.home {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--sp-6) var(--sp-5) var(--sp-9);
  display: flex;
  flex-direction: column;
  gap: var(--sp-5);
}

.home__bottom-split {
  display: grid;
  grid-template-columns: 8fr 4fr;
  gap: var(--sp-4);
}

@include m.tablet {
  .home__bottom-split {
    grid-template-columns: 1fr;
  }
}

@include m.mobile {
  .home {
    padding-bottom: calc(var(--sp-9) + var(--nav-height-mobile));
  }
}
</style>
