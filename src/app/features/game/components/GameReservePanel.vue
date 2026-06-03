<template>
  <div class="reservoir-col">
    <div class="card">
      <div class="card__header">
        <span class="card__title">Резерв A</span>
      </div>
      <div class="card__body card__body--tight">
        <slot name="reserve-a" />
        <div class="t-eyebrow reservoir-turn">
          {{ reserveATurn }} ходит
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card__header">
        <span class="card__title">Резерв B</span>
      </div>
      <div class="card__body card__body--tight">
        <slot name="reserve-b" />
        <div class="t-eyebrow reservoir-turn">
          {{ reserveBTurn }} ходит
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  reserveATurn: string;
  reserveBTurn: string;
}>();
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;
@include m.card;
@include m.typography-helpers;

.reservoir-col {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  align-self: stretch;
  justify-content: center;
  min-width: 80px;
}

.card__body--tight { padding: var(--sp-2); }
.reservoir-turn { margin-top: var(--sp-2); }
</style>
