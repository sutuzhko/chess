<template>
  <img
    :src="figureUrl('knight-white')"
    alt="knight"
    class="icon-knight"
    draggable="false"
    aria-hidden="true"
  >
</template>

<script setup lang="ts">
import { figureUrl } from '@shared/config/asset-path.js';
</script>

<style scoped lang="scss">
.icon-knight {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.1));
  user-select: none;
}
</style>
