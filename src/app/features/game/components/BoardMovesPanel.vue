<template>
  <div class="board-moves">
    <div class="board-moves__title">
      {{ title }}
    </div>
    <div class="board-moves__body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string }>();
</script>

<style scoped lang="scss">
.board-moves {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  display: flex;
  flex-direction: column;
  width: 100%;

  // Фиксированная высота — иначе в шведках столбцы досок A и B расходятся,
  // когда в одном списке ходов больше записей, чем в другом.
  height: 240px;
  overflow: hidden;
}

.board-moves__title {
  font-family: var(--font-mono), sans-serif;
  font-size: var(--fs-xs);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--text-muted);
  font-weight: 600;
  padding: var(--sp-2) var(--sp-3);
  border-bottom: 1px solid var(--border);
}

.board-moves__body {
  padding: var(--sp-2);
  overflow-y: auto;
  flex: 1;
}
</style>
