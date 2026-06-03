<template>
  <div class="settings-body">
    <SettingsSection :title="t('settings.gameplay.rulesAndHints')">
      <BaseCard padding="none">
        <SettingsToggleRow
          v-for="row in GAMEPLAY_TOGGLES"
          :key="row.key"
          :model-value="settings.gameplay[row.key]"
          :label="row.label"
          :description="row.description"
          :disabled="!!row.disabled"
          @update:model-value="onToggle(row.key, $event)"
        />
      </BaseCard>
    </SettingsSection>
  </div>
</template>

<script setup lang="ts">
import {
  GAMEPLAY_TOGGLES,
  type GameplayToggle,
} from '@app/features/settings/config/settings-options.js';
import BaseCard from '@app/shared/ui/BaseCard/BaseCard.vue';
import { useSettingsStore } from '@app/stores/settings.js';
import { useI18n } from 'vue-i18n';
import SettingsSection from './SettingsSection.vue';
import SettingsToggleRow from './SettingsToggleRow.vue';

const settings = useSettingsStore();
const { t } = useI18n();

function onToggle(key: GameplayToggle['key'], value: boolean): void {
  settings.gameplay = { ...settings.gameplay, [key]: value };
}
</script>
