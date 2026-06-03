<template>
  <div class="lobby__opps">
    <button
      class="oppcard"
      :class="{ 'is-active': modelValue === 'ai' }"
      @click="emit('update:modelValue', 'ai')"
    >
      <span class="oppcard__icon"><AppIcon
        name="cpu"
        :size="32"
      /></span>
      <span class="oppcard__title">{{ $t('lobby.opponent.ai.title') }}</span>
      <span class="oppcard__desc">{{ $t('lobby.opponent.ai.desc') }}</span>
    </button>
    <button
      class="oppcard"
      :class="{ 'is-active': modelValue === 'hotseat' }"
      @click="emit('update:modelValue', 'hotseat')"
    >
      <span class="oppcard__icon"><AppIcon
        name="users"
        :size="32"
      /></span>
      <span class="oppcard__title">{{ $t('lobby.opponent.hotseat.title') }}</span>
      <span class="oppcard__desc">{{ $t('lobby.opponent.hotseat.desc') }}</span>
    </button>
    <button
      class="oppcard is-disabled"
      disabled
    >
      <span class="oppcard__icon"><AppIcon
        name="globe"
        :size="32"
      /></span>
      <span class="oppcard__title">{{ $t('lobby.opponent.remote.title') }}</span>
      <span class="oppcard__desc">{{ $t('lobby.opponent.remote.desc') }}</span>
      <span class="oppcard__soon">{{ $t('lobby.opponent.soon') }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@app/shared/ui/AppIcon/AppIcon.vue';

defineProps<{ modelValue: 'ai' | 'hotseat' }>();
const emit = defineEmits<{ 'update:modelValue': ['ai' | 'hotseat'] }>();
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.lobby__opps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--sp-3);

  @include m.mobile { grid-template-columns: 1fr; }
}

.oppcard {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  align-items: flex-start;
  padding: var(--sp-4);
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: var(--r-lg);
  cursor: pointer;
  transition: all var(--dur-base);
  text-align: left;
  position: relative;

  &:hover:not(.is-disabled) { border-color: var(--border-strong); }

  &.is-active {
    border-color: var(--accent);
    background: var(--accent-soft);
  }

  &.is-disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}

.oppcard__icon {
  width: 32px;
  height: 32px;
  color: var(--text-muted);


  .is-active & {
    color: var(--accent);
  }
}

.oppcard__title {
  font-size: var(--fs-md);
  font-weight: 600;
  color: var(--text);
}

.oppcard__desc {
  font-size: var(--fs-sm);
  color: var(--text-muted);
}

.oppcard__soon {
  position: absolute;
  top: var(--sp-3);
  right: var(--sp-3);
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 2px 6px;
  background: var(--surface-3);
  color: var(--text-faint);
  border-radius: var(--r-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
</style>
