<template>
  <div class="lobby__side">
    <button
      v-for="s in SIDES"
      :key="s.value"
      class="side-btn"
      :class="{ 'is-active': modelValue === s.value }"
      @click="emit('update:modelValue', s.value)"
    >
      {{ $t(s.i18nKey) }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { LobbySide } from '@app/features/lobby/types/lobby.types.js';

defineProps<{ modelValue: LobbySide }>();
const emit = defineEmits<{ 'update:modelValue': [LobbySide] }>();

const SIDES = [
  { value: 'white' as const, i18nKey: 'lobby.side.white' },
  { value: 'random' as const, i18nKey: 'lobby.side.random' },
  { value: 'black' as const, i18nKey: 'lobby.side.black' },
] as const;
</script>

<style scoped lang="scss">
.lobby__side {
  display: flex;
  padding: 4px;
  gap: 4px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
}

.side-btn {
  flex: 1;
  padding: var(--sp-3) var(--sp-4);
  background: transparent;
  border: 0;
  border-radius: calc(var(--r-md) - 2px);
  color: var(--text-muted);
  font-size: var(--fs-md);
  cursor: pointer;
  transition: all var(--dur-base);

  &:hover { color: var(--text); }

  &.is-active {
    background: var(--surface);
    color: var(--accent);
    font-weight: 600;
    box-shadow: var(--shadow-sm);
  }
}
</style>
