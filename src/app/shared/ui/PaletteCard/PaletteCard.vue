<template>
  <button
    type="button"
    class="palette-card"
    :class="{ 'is-active': active }"
    :aria-pressed="active"
    @click="$emit('click')"
  >
    <span class="palette-card__board">
      <span
        v-for="i in 16"
        :key="i"
        :style="cellStyle(i)"
      />
    </span>
    <span class="palette-card__name">{{ label }}</span>
    <span
      v-if="active"
      class="palette-card__check"
    >
      <AppIcon
        name="check"
        :size="12"
      />
    </span>
  </button>
</template>

<script setup lang="ts">
import AppIcon from '@app/shared/ui/AppIcon/AppIcon.vue';

const props = withDefaults(defineProps<{
  light: string;
  dark: string;
  label: string;
  active?: boolean;
}>(), { active: false });

defineEmits<{ click: [] }>();

function cellStyle(i: number): Record<string, string> {
  const idx = i - 1;
  const row = Math.floor(idx / 4);
  const col = idx % 4;
  const isLight = (row + col) % 2 === 0;
  return { background: isLight ? props.light : props.dark };
}
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.palette-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--sp-2);
  padding: var(--sp-3);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  cursor: pointer;
  text-align: left;
  transition: border-color var(--dur-base), background var(--dur-base);

  @include m.focus-ring;
}

.palette-card:hover { border-color: var(--border-strong); }

.palette-card.is-active {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.palette-card__board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: var(--r-sm);
  overflow: hidden;
  border: 1px solid var(--border);

  > span { display: block; }
}

.palette-card__name {
  font-size: var(--fs-sm);
  font-weight: 500;
  color: var(--text);
}

.palette-card__check {
  position: absolute;
  top: var(--sp-2);
  right: var(--sp-2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent);
  color: var(--accent-fg);

}
</style>
