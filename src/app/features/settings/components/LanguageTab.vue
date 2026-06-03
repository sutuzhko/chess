<template>
  <div class="settings-body">
    <SettingsSection :title="t('settings.language.title')">
      <div class="lang-list">
        <button
          v-for="opt in LANG_OPTIONS"
          :key="opt.value"
          class="lang-card"
          :class="{ 'is-active': settings.lang === opt.value, 'is-disabled': opt.disabled }"
          :disabled="opt.disabled"
          @click="onSelect(opt)"
        >
          <span class="lang-card__label">
            {{ opt.label }}<span
              v-if="opt.disabled"
              class="lang-card__hint"
            > · {{ t('settings.common.soon') }}</span>
          </span>
          <span
            v-if="settings.lang === opt.value && !opt.disabled"
            class="lang-card__check"
          >✓</span>
        </button>
      </div>
    </SettingsSection>
  </div>
</template>

<script setup lang="ts">
import {
  LANG_OPTIONS,
} from '@app/features/settings/config/settings-options.js';
import { useSettingsStore } from '@app/stores/settings.js';
import { useI18n } from 'vue-i18n';
import SettingsSection from './SettingsSection.vue';

interface LangOption { value: typeof LANG_OPTIONS[number]['value']; disabled?: boolean }

const settings = useSettingsStore();
const { t } = useI18n();

function onSelect(opt: LangOption): void {
  if (opt.disabled) return;
  settings.lang = opt.value;
}
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.lang-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.lang-card {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  background: var(--surface-2);

  @include m.card-border(var(--r-sm));

  color: var(--text);
  cursor: pointer;
  text-align: left;

  &.is-active {
    border-color: var(--accent);
    background: var(--surface-3);
  }

  &.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.lang-card__flag {
  width: 24px;
  height: 16px;
  flex-shrink: 0;
}

.lang-card__label {
  flex: 1;
  font-weight: 500;
}

.lang-card__hint {
  color: var(--text-faint);
  font-weight: 400;
}

.lang-card__check {
  color: var(--accent);
  font-size: var(--fs-lg);
}
</style>
