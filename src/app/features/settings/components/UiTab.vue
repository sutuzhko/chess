<template>
  <div class="settings-body">
    <SettingsSection :title="t('settings.ui.standard')">
      <BaseCard padding="none">
        <SettingsToggleRow
          v-for="row in STANDARD_UI_TOGGLES"
          :key="row.key"
          :model-value="getStandard(row.key)"
          :label="row.label"
          :disabled="!!row.disabled"
          @update:model-value="setStandard(row.key, $event)"
        />
      </BaseCard>
    </SettingsSection>

    <SettingsSection :title="t('settings.ui.shvedki')">
      <BaseCard padding="none">
        <SettingsToggleRow
          v-for="row in SHVEDKI_UI_TOGGLES"
          :key="row.key"
          :model-value="getShvedki(row.key)"
          :label="row.label"
          :disabled="!!row.disabled"
          @update:model-value="setShvedki(row.key, $event)"
        />
      </BaseCard>
    </SettingsSection>
  </div>
</template>

<script setup lang="ts">
import {
  SHVEDKI_UI_TOGGLES,
  STANDARD_UI_TOGGLES,
} from '@app/features/settings/config/settings-options.js';
import BaseCard from '@app/shared/ui/BaseCard/BaseCard.vue';
import { useSettingsStore } from '@app/stores/settings.js';
import { useI18n } from 'vue-i18n';
import SettingsSection from './SettingsSection.vue';
import SettingsToggleRow from './SettingsToggleRow.vue';

const settings = useSettingsStore();
const { t } = useI18n();

function getStandard(key: string): boolean {
  return Boolean((settings.standardUI as unknown as Record<string, boolean>)[key]);
}
function setStandard(key: string, value: boolean): void {
  settings.standardUI = { ...settings.standardUI, [key]: value };
}
function getShvedki(key: string): boolean {
  return Boolean((settings.shvedkiUI as unknown as Record<string, boolean>)[key]);
}
function setShvedki(key: string, value: boolean): void {
  settings.shvedkiUI = { ...settings.shvedkiUI, [key]: value };
}
</script>
