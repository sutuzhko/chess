import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useHeaderStore = defineStore('header', () => {
  const status = ref('');
  const modeBadge = ref('');
  const timeBadge = ref('');

  function setGameInfo(payload: { status: string; modeBadge: string; timeBadge: string }): void {
    status.value = payload.status;
    modeBadge.value = payload.modeBadge;
    timeBadge.value = payload.timeBadge;
  }

  function clearGameInfo(): void {
    status.value = '';
    modeBadge.value = '';
    timeBadge.value = '';
  }

  return { status, modeBadge, timeBadge, setGameInfo, clearGameInfo };
});
