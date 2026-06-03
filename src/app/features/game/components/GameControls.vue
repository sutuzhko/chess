<template>
  <div class="card">
    <div class="card__header">
      <span class="card__title">Управление</span>
    </div>
    <div class="card__body card__body--controls">
      <div class="controls-grid-4">
        <button
          class="btn btn--sm"
          @click="emit('undo')"
        >
          ↶ Отмена
        </button>
        <button
          class="btn btn--sm"
          @click="emit('redo')"
        >
          ↷ Повтор
        </button>
        <button
          class="btn btn--sm"
          :disabled="!canFlip"
          @click="emit('flip')"
        >
          ⇅ Flip
        </button>
        <button
          class="btn btn--sm btn--primary"
          @click="emit('reset')"
        >
          + Новая
        </button>
      </div>
      <div class="controls-grid-2">
        <button
          class="btn btn--sm"
          @click="emit('save')"
        >
          Сохранить
        </button>
        <button
          class="btn btn--sm"
          @click="emit('load')"
        >
          Загрузить
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ canFlip: boolean }>();

const emit = defineEmits<{
  undo: [];
  redo: [];
  flip: [];
  reset: [];
  save: [];
  load: [];
}>();
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;
@include m.card;
@include m.buttons;

.controls-grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--sp-1);
}

.controls-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-1);
}

.card__body--controls {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
</style>
