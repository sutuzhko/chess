<template>
  <section
    v-show="active"
    role="tabpanel"
    class="base-tab-panel"
  >
    <slot />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  panelKey: string;
  modelValue: string;
}>();

const active = computed<boolean>(() => props.panelKey === props.modelValue);
</script>
