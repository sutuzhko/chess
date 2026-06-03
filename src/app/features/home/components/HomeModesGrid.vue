<template>
  <div class="home-modes">
    <ModeCard
      size="lg"
      brand
      :title="$t('home.modes.standard.title')"
      :desc="$t('home.modes.standard.desc')"
      @click="emit('go', '/lobby/standard')"
    >
      <template #icon>
        <img
          :src="figureUrl('knight-white')"
          alt=""
          class="home-modes__piece"
        >
      </template>
      <template #badge>
        <BaseBadge
          tone="solid"
          padding-zero
          mono
        >
          {{ $t('home.modes.popular') }}
        </BaseBadge>
      </template>
    </ModeCard>

    <ModeCard
      size="lg"
      :title="$t('home.modes.shvedki.title')"
      :desc="$t('home.modes.shvedki.desc')"
      icon-ghost
      @click="emit('go', '/lobby/shvedki')"
    >
      <template #icon>
        <span class="home-modes__duo">
          <img
            :src="figureUrl('king-white')"
            alt=""
            class="home-modes__duo-fg"
          >
          <img
            :src="figureUrl('king-black')"
            alt=""
            class="home-modes__duo-bg"
          >
        </span>
      </template>
    </ModeCard>

    <ModeCard
      size="lg"
      :title="$t('home.modes.puzzles.title')"
      :desc="$t('home.modes.puzzles.desc')"
      @click="emit('go', '/puzzles')"
    >
      <template #icon>
        <AppIcon
          name="scope"
          :size="24"
        />
      </template>
    </ModeCard>

    <ModeCard
      :title="$t('home.modes.online.title')"
      :desc="$t('home.modes.online.desc')"
      :soon-label="$t('app.deferred.badge')"
    >
      <template #icon>
        <AppIcon
          name="globe"
          :size="24"
        />
      </template>
    </ModeCard>

    <ModeCard
      :title="$t('home.modes.openings.title')"
      :desc="$t('home.modes.openings.desc')"
      @click="emit('go', '/openings')"
    >
      <template #icon>
        <AppIcon
          name="graph"
          :size="24"
        />
      </template>
    </ModeCard>

    <ModeCard
      :title="$t('home.modes.analysis.title')"
      :desc="$t('home.modes.analysis.desc')"
      :soon-label="$t('app.deferred.badge')"
    >
      <template #icon>
        <AppIcon
          name="bars"
          :size="24"
        />
      </template>
    </ModeCard>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@app/shared/ui/AppIcon/AppIcon.vue';
import BaseBadge from '@app/shared/ui/BaseBadge/BaseBadge.vue';
import ModeCard from '@app/shared/ui/ModeCard/ModeCard.vue';
import { figureUrl } from '@shared/config/asset-path.js';

const emit = defineEmits<{
  go: [path: string];
}>();
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.home-modes {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--sp-4);
}

.home-modes__piece {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.home-modes__duo {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 36px;
}

.home-modes__duo-fg,
.home-modes__duo-bg {
  position: absolute;
  object-fit: contain;
}

.home-modes__duo-fg {
  top: 0;
  left: 0;
  width: 28px;
  height: 28px;
}

.home-modes__duo-bg {
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
}

@include m.tablet {
  .home-modes {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
}

@include m.mobile {
  .home-modes {
    grid-template-columns: 1fr;
  }
}
</style>
