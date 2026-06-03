<template>
  <main class="oauth-callback">
    <div
      v-if="state === 'pending'"
      class="oauth-callback__panel"
    >
      <div class="oauth-callback__spinner" />
      <p>{{ t('oauth.callback.exchanging') }}</p>
    </div>
    <div
      v-else-if="state === 'error'"
      class="oauth-callback__panel"
    >
      <h1 class="oauth-callback__title">
        {{ t('oauth.callback.errorTitle') }}
      </h1>
      <p class="oauth-callback__error">
        {{ message }}
      </p>
      <BaseButton
        variant="primary"
        @click="goSettings"
      >
        {{ t('oauth.callback.backToSettings') }}
      </BaseButton>
    </div>
  </main>
</template>

<script setup lang="ts">
import BaseButton from '@app/shared/ui/BaseButton/BaseButton.vue';
import { useLichessAuthStore } from '@app/stores/lichess-auth.js';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const auth = useLichessAuthStore();

const state = ref<'pending' | 'error'>('pending');
const message = ref<string>('');

function goSettings(): void {
  void router.replace({ name: 'settings' });
}

onMounted(async () => {
  // Lichess может вернуть `error=access_denied` если юзер отменил вход.
  const queryError = typeof route.query.error === 'string' ? route.query.error : null;
  if (queryError) {
    state.value = 'error';
    message.value = queryError === 'access_denied'
      ? t('oauth.callback.userDenied')
      : queryError;
    return;
  }

  const code = typeof route.query.code === 'string' ? route.query.code : null;
  if (!code) {
    state.value = 'error';
    message.value = t('oauth.callback.missingCode');
    return;
  }

  try {
    const returnTo = await auth.exchangeCodeForToken(code);
    void router.replace(returnTo);
  } catch (err) {
    state.value = 'error';
    message.value = err instanceof Error ? err.message : String(err);
  }
});
</script>

<style scoped lang="scss">
.oauth-callback {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-5);
}

.oauth-callback__panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-4);
  max-width: 480px;
  text-align: center;
}

.oauth-callback__title {
  font-family: var(--font-display), sans-serif;
  font-size: var(--fs-2xl);
  font-weight: 700;
  margin: 0;
  color: var(--text);
}

.oauth-callback__error {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--fs-sm);
  overflow-wrap: anywhere;
}

.oauth-callback__spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: oauth-spin 0.9s linear infinite;
}

@keyframes oauth-spin {
  to { transform: rotate(360deg); }
}
</style>
