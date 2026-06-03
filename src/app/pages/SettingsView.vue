<template>
  <main class="settings-view">
    <button
      class="settings-view__back"
      @click="router.back()"
    >
      <AppIcon
        name="arrow-left"
        :size="16"
      />
      <span>{{ t('common.back') }}</span>
    </button>

    <header class="settings-view__head">
      <div class="t-eyebrow">
        {{ t('settings.eyebrow') }}
      </div>
      <h1 class="settings-view__title">
        {{ t('settings.title') }}
      </h1>
      <p class="settings-view__sub">
        {{ t('settings.subtitle') }}
      </p>
    </header>

    <BaseTabs
      v-model="activeTab"
      class="settings-view__tabs"
      :tabs="tabs"
    />

    <AppearanceTab v-if="activeTab === 'appearance'" />
    <GameplayTab v-else-if="activeTab === 'gameplay'" />
    <UiTab v-else-if="activeTab === 'ui'" />
    <DataTab v-else-if="activeTab === 'data'" />
    <LanguageTab v-else-if="activeTab === 'lang'" />
  </main>
</template>

<script setup lang="ts">
import AppearanceTab from '@app/features/settings/components/AppearanceTab.vue';
import DataTab from '@app/features/settings/components/DataTab.vue';
import GameplayTab from '@app/features/settings/components/GameplayTab.vue';
import LanguageTab from '@app/features/settings/components/LanguageTab.vue';
import UiTab from '@app/features/settings/components/UiTab.vue';
import {
  SETTINGS_TABS,
  type SettingsTabId,
} from '@app/features/settings/config/settings-options.js';
import AppIcon from '@app/shared/ui/AppIcon/AppIcon.vue';
import BaseTabs, { type TabItem } from '@app/shared/ui/BaseTabs/BaseTabs.vue';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const router = useRouter();
const { t } = useI18n();
const activeTab = ref<SettingsTabId>('appearance');

const tabs = computed<TabItem[]>(() => SETTINGS_TABS.map((tab) => ({
  key: tab.id,
  label: t(`settings.tabs.${tab.i18nKey}`),
})));
</script>

<style scoped lang="scss">
@use '../assets/mixins' as m;
@include m.typography-helpers;

.settings-view {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: var(--sp-6) var(--sp-5) calc(var(--sp-8) + 80px);
  display: flex;
  flex-direction: column;
  gap: var(--sp-6);
}

.settings-view__back {
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

.settings-view__head {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}

.settings-view__title {
  font-family: var(--font-display), sans-serif;
  font-size: var(--fs-3xl);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  margin: 0;
  color: var(--text);
}

.settings-view__sub {
  margin: 0;
  font-size: var(--fs-md);
  color: var(--text-muted);
}

.settings-view__tabs {
  overflow-x: auto;
}
</style>
