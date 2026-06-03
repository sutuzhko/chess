<template>
  <div class="settings-body">
    <SettingsSection :title="t('settings.data.lichess.section')">
      <BaseCard padding="none">
        <SettingsToggleRow
          v-model="useLichessExplorer"
          :label="t('settings.data.lichess.toggleLabel')"
          :description="t('settings.data.lichess.toggleDescription')"
        />
      </BaseCard>
      <div
        v-if="useLichessExplorer"
        class="lichess-auth"
      >
        <div
          v-if="auth.isAuthorized"
          class="lichess-auth__status"
        >
          <span class="lichess-auth__connected">
            {{ t('settings.data.lichess.connectedAs') }}
            <strong>@{{ auth.username ?? t('settings.data.lichess.anonymous') }}</strong>
          </span>
          <BaseButton
            variant="tertiary"
            :disabled="auth.loading"
            @click="onLogout"
          >
            {{ t('settings.data.lichess.logout') }}
          </BaseButton>
        </div>
        <div
          v-else-if="hasExpiredToken"
          class="lichess-auth__expired"
        >
          <p class="lichess-auth__expired-text">
            {{ t('settings.data.lichess.expired') }}
          </p>
          <BaseButton
            variant="primary"
            :disabled="auth.loading"
            @click="onLogin"
          >
            {{ t('settings.data.lichess.expiredCta') }}
          </BaseButton>
        </div>
        <div
          v-else
          class="lichess-auth__login"
        >
          <p class="lichess-auth__hint">
            {{ t('settings.data.lichess.loginHint') }}
          </p>
          <BaseButton
            variant="primary"
            :disabled="auth.loading"
            @click="onLogin"
          >
            {{ t('settings.data.lichess.loginCta') }}
          </BaseButton>
        </div>
      </div>
      <p
        v-else
        class="lichess-auth__local-only"
      >
        {{ t('settings.data.lichess.localOnly') }}
      </p>
    </SettingsSection>

    <SettingsSection :title="t('settings.data.storageSize')">
      <BaseCard padding="md">
        <div class="data-storage">
          <div class="data-storage__text">
            <div class="data-storage__value">
              {{ storageBadge }}
            </div>
            <div class="data-storage__sub">
              localStorage · {{ t('settings.data.outOf') }} 5 {{ t('settings.data.megabytes') }}
            </div>
          </div>
          <div class="data-storage__bar">
            <div
              class="data-storage__bar-fill"
              :style="{ width: `${barPercent.toString()}%` }"
            />
          </div>
        </div>
      </BaseCard>
    </SettingsSection>

    <SettingsSection :title="t('settings.data.backup')">
      <div class="data-actions">
        <BaseButton
          variant="tertiary"
          @click="exportData"
        >
          {{ t('settings.data.exportJson') }}
        </BaseButton>
        <BaseButton
          variant="tertiary"
          @click="triggerImport"
        >
          {{ t('settings.data.importJson') }}
        </BaseButton>
        <input
          ref="fileInput"
          type="file"
          accept="application/json"
          class="data-actions__file"
          @change="onImport"
        >
      </div>
      <p
        v-if="message"
        class="data-message"
      >
        {{ message }}
      </p>
    </SettingsSection>

    <SettingsSection :title="t('settings.data.clearSection')">
      <BaseButton
        variant="danger"
        @click="clearAll"
      >
        {{ t('settings.data.clearBtn') }}
      </BaseButton>
      <p class="data-warning">
        {{ t('settings.data.clearWarning') }}
      </p>
    </SettingsSection>
  </div>
</template>

<script setup lang="ts">
import BaseButton from '@app/shared/ui/BaseButton/BaseButton.vue';
import BaseCard from '@app/shared/ui/BaseCard/BaseCard.vue';
import { useLichessAuthStore } from '@app/stores/lichess-auth.js';
import { useSettingsStore } from '@app/stores/settings.js';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import SettingsSection from './SettingsSection.vue';
import SettingsToggleRow from './SettingsToggleRow.vue';

const { t } = useI18n();
const route = useRoute();
const settings = useSettingsStore();
const { useLichessExplorer } = storeToRefs(settings);
const auth = useLichessAuthStore();
const message = ref('');
const fileInput = ref<HTMLInputElement | null>(null);

/** Был валидный токен, но он истёк — показываем "войти снова" вместо первичной CTA. */
const hasExpiredToken = computed<boolean>(() => {
  return auth.token !== null && !auth.isAuthorized;
});

function onLogin(): void {
  // Возврат на текущий путь Settings — чтобы юзер оказался ровно здесь после OAuth.
  void auth.login(route.fullPath);
}

async function onLogout(): Promise<void> {
  await auth.logout();
}

function triggerImport(): void { fileInput.value?.click(); }

const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024;

const totalBytes = computed<number>(() => {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    const value = localStorage.getItem(key) ?? '';
    total += key.length + value.length;
  }
  return total;
});

const storageBadge = computed<string>(() => {
  const total = totalBytes.value;
  if (total < 1024) return `${String(total)} ${t('settings.data.bytes')}`;
  if (total < 1024 * 1024) return `${(total / 1024).toFixed(1)} ${t('settings.data.kilobytes')}`;
  return `${(total / (1024 * 1024)).toFixed(2)} ${t('settings.data.megabytes')}`;
});

const barPercent = computed<number>(() => {
  const pct = (totalBytes.value / STORAGE_LIMIT_BYTES) * 100;
  if (pct < 0.5) return 0.5;
  return Math.min(100, pct);
});

function exportData(): void {
  const data: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || (!key.startsWith('chess.') && key !== 'app.settings')) continue;
    try {
      data[key] = JSON.parse(localStorage.getItem(key) ?? 'null');
    } catch {
      data[key] = localStorage.getItem(key);
    }
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chess-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  message.value = t('settings.data.exportSaved');
}

function onImport(e: Event): void {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (): void => {
    try {
      const text = typeof reader.result === 'string' ? reader.result : '';
      const data = JSON.parse(text) as Record<string, unknown>;
      for (const [key, value] of Object.entries(data)) {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      }
      message.value = t('settings.data.importDone');
    } catch (err) {
      message.value = `${t('settings.data.errorPrefix')}${(err as Error).message}`;
    }
  };
  reader.readAsText(file);
  input.value = '';
}

function clearAll(): void {
  if (!confirm(t('settings.data.confirmClear'))) return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) keys.push(key);
  }
  keys.forEach((k) => { localStorage.removeItem(k); });
  message.value = t('settings.data.storageCleared');
}
</script>

<style scoped lang="scss">
.data-storage {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-4);
}

.data-storage__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.data-storage__value {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--text);
}

.data-storage__sub {
  font-size: var(--fs-xs);
  color: var(--text-faint);
}

.data-storage__bar {
  width: 200px;
  height: 6px;
  background: var(--surface-sunk);
  border-radius: 3px;
  overflow: hidden;
}

.data-storage__bar-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 3px;
  transition: width var(--dur-base) var(--ease-out);
}

.data-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  align-items: center;
}

.data-actions__file { display: none; }

.data-message {
  margin-top: var(--sp-2);
  font-size: var(--fs-sm);
  color: var(--accent);
}

.data-warning {
  margin-top: var(--sp-2);
  font-size: var(--fs-xs);
  color: var(--text-faint);
}

.lichess-auth {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  margin-top: var(--sp-3);
}

.lichess-auth__status,
.lichess-auth__expired {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  flex-wrap: wrap;
  padding: var(--sp-3) var(--sp-4);
  background: var(--surface-sunk);
  border-radius: var(--r-md);
  font-size: var(--fs-sm);
  color: var(--text-muted);
}

.lichess-auth__connected strong {
  color: var(--text);
  margin-left: 4px;
}

.lichess-auth__expired-text {
  margin: 0;
  color: var(--accent);
}

.lichess-auth__login {
  display: flex;
  justify-content: space-between;
  padding: var(--sp-3) var(--sp-5);
  gap: var(--sp-2);
}

.lichess-auth__hint {
  margin: 0;
  font-size: var(--fs-xs);
  color: var(--text-faint);
  max-width: 60ch;
}

.lichess-auth__local-only {
  margin: var(--sp-2) 0 0;
  font-size: var(--fs-xs);
  padding: var(--sp-3) var(--sp-5);
  color: var(--text-faint);
}
</style>
