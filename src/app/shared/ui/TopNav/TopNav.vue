<template>
  <header class="top-nav">
    <div class="top-nav__inner">
      <RouterLink
        to="/"
        class="top-nav__brand"
      >
        <img
          :src="figureUrl('knight-white')"
          class="top-nav__brand-icon"
          alt=""
          aria-hidden="true"
          draggable="false"
        >
        <span class="top-nav__brand-name">Конём ходи</span>
      </RouterLink>

      <nav class="top-nav__links">
        <RouterLink
          to="/"
          class="top-nav__link"
          :class="{ 'is-active': route.name === 'home' }"
        >
          {{ $t('nav.home') }}
        </RouterLink>
        <RouterLink
          to="/lobby/standard"
          class="top-nav__link"
          :class="{ 'is-active': route.name === 'game' || route.name === 'lobby' }"
        >
          {{ $t('nav.game') }}
        </RouterLink>
        <RouterLink
          to="/openings"
          class="top-nav__link"
          :class="{ 'is-active': route.name === 'openings' }"
        >
          {{ $t('nav.openings') }}
        </RouterLink>
        <RouterLink
          to="/puzzles"
          class="top-nav__link"
          :class="{ 'is-active': route.name === 'puzzles' }"
        >
          {{ $t('nav.puzzles') }}
        </RouterLink>
        <div
          v-if="header.status || header.modeBadge"
          class="top-nav__game-info"
        >
          <span
            v-if="header.modeBadge"
            class="top-nav__badge top-nav__badge--accent"
          >{{ header.modeBadge }}</span>
          <span
            v-if="header.timeBadge"
            class="top-nav__badge top-nav__badge--info"
          >{{ header.timeBadge }}</span>
          <span
            v-if="header.status"
            class="top-nav__status"
          >{{ header.status }}</span>
        </div>
      </nav>

      <div class="top-nav__actions">
        <button
          type="button"
          class="top-nav__icon-btn"
          :title="$t('nav.theme')"
          @click="toggleTheme"
        >
          <AppIcon
            v-if="settings.theme === 'dark'"
            name="sun"
            :size="18"
          />
          <AppIcon
            v-else
            name="moon"
            :size="18"
          />
        </button>
        <RouterLink
          to="/settings"
          class="top-nav__icon-btn"
          :title="$t('nav.settings')"
        >
          <AppIcon
            name="gear"
            :size="18"
          />
        </RouterLink>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import AppIcon from '@app/shared/ui/AppIcon/AppIcon.vue';
import { useHeaderStore } from '@app/stores/header';
import { useSettingsStore } from '@app/stores/settings';
import { figureUrl } from '@shared/config/asset-path.js';
import { useRoute } from 'vue-router';

const route = useRoute();
const settings = useSettingsStore();
const header = useHeaderStore();

function toggleTheme(): void {
  settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
}
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.top-nav {
  height: var(--nav-height);
  background: var(--bg-elev);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}

// Внутренний контейнер ограничивает контент так же, как .home / .page (1100px).
.top-nav__inner {
  max-width: 1100px;
  width: 100%;
  height: 100%;
  margin: 0 auto;
  padding: 0 var(--sp-5);
  display: flex;
  align-items: center;
  gap: var(--sp-5);
}

.top-nav__brand {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  font-family: var(--font-display), sans-serif;
  font-weight: 700;
  font-size: var(--fs-md);
  letter-spacing: var(--tracking-tight);
  color: var(--text);
  text-decoration: none;
  flex-shrink: 0;
}

.top-nav__brand-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.top-nav__brand-name {
  white-space: nowrap;
}

.top-nav__links {
  display: flex;
  gap: var(--sp-1);
  flex: 1;
  min-width: 0;
  align-items: center;
}

.top-nav__link {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 var(--sp-3);
  border: 0;
  background: transparent;
  border-radius: var(--r-md);
  color: var(--text-muted);
  font-size: var(--fs-sm);
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: color var(--dur-base);
  position: relative;
  white-space: nowrap;

  @include m.focus-ring;
}

.top-nav__link:hover {
  color: var(--text);
}

.top-nav__link.is-active {
  color: var(--text);
  font-weight: 600;
}

.top-nav__link.is-active::after {
  content: "";
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: -13px;
  height: 2px;
  background: var(--accent);
  border-radius: 2px 2px 0 0;
}

.top-nav__actions {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  margin-left: auto;
  flex-shrink: 0;
}

// Кнопки в правом блоке: одинаковая icon-only геометрия (язык/тема/настройки).
.top-nav__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 0;
  background: transparent;
  border-radius: var(--r-md);
  color: var(--text-muted);
  cursor: pointer;
  text-decoration: none;
  transition: background var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out);

  @include m.focus-ring;
}

.top-nav__icon-btn:hover {
  background: var(--surface-hover);
  color: var(--text);
}


.top-nav__game-info {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin-left: var(--sp-4);
  padding-left: var(--sp-4);
  border-left: 1px solid var(--border);
  
  @include m.laptop {
    display: none;
  }
}

.top-nav__badge {
  font-family: var(--font-mono), sans-serif;
  font-size: var(--fs-2xs);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  font-weight: 600;
  padding: 2px var(--sp-2);
  border-radius: var(--r-sm);
  background: var(--surface-3);
  color: var(--text-muted);

  &--accent {
    background: var(--accent-soft);
    color: var(--accent);
  }

  &--info {
    background: var(--surface-3);
    color: var(--text);
  }
}

.top-nav__status {
  font-size: var(--fs-sm);
  color: var(--text);
}

/* Phones (≤ $bp-md): top-nav скрыт — навигация в BottomNav. */
@include m.mobile {
  .top-nav {
    display: none;
  }
}
</style>
