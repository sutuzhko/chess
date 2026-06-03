<template>
  <span
    class="icon-base"
    :style="cssVars"
    aria-hidden="true"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{ size?: number | string }>(), { size: 20 });

const cssVars = computed<Record<string, string>>(() => ({
  '--icon-base-size': typeof props.size === 'number' ? `${props.size}px` : props.size,
}));
</script>

<style scoped lang="scss">
.icon-base {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--icon-base-size);
  height: var(--icon-base-size);
  flex-shrink: 0;

  :slotted(svg) {
    width: 100%;
    height: 100%;
  }
}
</style>
