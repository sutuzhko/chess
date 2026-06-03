<template>
  <svg
    class="app-icon"
    :class="`app-icon--${variant}`"
    :width="dimension"
    :height="dimension"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <use :href="`#icon-${name}`" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  name: IconName;
  size?: number | string;
  variant?: 'stroke' | 'fill';
}>(), { size: 20, variant: 'stroke' });

const dimension = computed<string | number>(() => props.size);
</script>

<script lang="ts">
export const ICON_NAMES = [
  'arrow-left', 'arrow-right', 'bars', 'bolt', 'bookmark', 'brain',
  'bulb', 'check', 'chevron-down', 'cpu', 'cross', 'flip', 'gear',
  'globe', 'home', 'moon', 'pawn', 'pencil', 'play', 'puzzle',
  'refresh', 'robot', 'search', 'star', 'sun', 'swap', 'target',
  'trash', 'users', 'graph', 'scope'
] as const;

export type IconName = typeof ICON_NAMES[number];
</script>

<style scoped lang="scss">
.app-icon {
  display: inline-block;
  flex-shrink: 0;
}

.app-icon--stroke {
  fill: none;
  stroke: currentcolor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.app-icon--fill {
  fill: currentcolor;
  stroke: none;
}
</style>
