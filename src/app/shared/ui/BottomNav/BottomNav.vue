<template>
  <nav class="bottom-nav">
    <div class="bottom-nav__items">
      <RouterLink
        to="/"
        class="bottom-nav__item"
        :class="{ 'is-active': route.name === 'home' }"
      >
        <AppIcon
          name="home"
          class="bottom-nav__icon"
        />
        <span>{{ $t('nav.home') }}</span>
      </RouterLink>
      <RouterLink
        to="/lobby/standard"
        class="bottom-nav__item"
        :class="{ 'is-active': route.name === 'game' || route.name === 'lobby' }"
      >
        <AppIcon
          name="play"
          class="bottom-nav__icon"
        />
        <span>{{ $t('nav.game') }}</span>
      </RouterLink>
      <RouterLink
        to="/openings"
        class="bottom-nav__item"
        :class="{ 'is-active': route.name === 'openings' }"
      >
        <AppIcon
          name="graph"
          class="bottom-nav__icon"
        />
        <span>{{ $t('nav.openings') }}</span>
      </RouterLink>
      <RouterLink
        to="/puzzles"
        class="bottom-nav__item"
        :class="{ 'is-active': route.name === 'puzzles' }"
      >
        <AppIcon
          name="scope"
          class="bottom-nav__icon"
        />
        <span>{{ $t('nav.puzzles') }}</span>
      </RouterLink>
      <RouterLink
        to="/settings"
        class="bottom-nav__item"
        :class="{ 'is-active': route.name === 'settings' }"
      >
        <AppIcon
          name="gear"
          class="bottom-nav__icon"
        />
        <span>{{ $t('nav.settings') }}</span>
      </RouterLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import AppIcon from '@app/shared/ui/AppIcon/AppIcon.vue';
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.bottom-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--bg-elev);
  border-top: 1px solid var(--border);
  padding-bottom: env(safe-area-inset-bottom, 0);

  @include m.mobile {
    display: block;
  }
}

.bottom-nav__items {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  height: var(--nav-height-mobile);
}

.bottom-nav__item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--text-muted);
  text-decoration: none;
  font-size: var(--fs-2xs);
  font-weight: 500;
  transition: color var(--dur-base);
  position: relative;
  min-height: 44px;
}

.bottom-nav__item:hover {
  color: var(--text);
}

.bottom-nav__item.is-active {
  color: var(--accent);
}

.bottom-nav__item.is-active::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--accent);
}

.bottom-nav__icon {
  width: 22px;
  height: 22px;
}
</style>
