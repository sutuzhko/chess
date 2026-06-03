<template>
  <div class="solver-actions">
    <BaseButton
      variant="tertiary"
      size="sm"
      block
      :disabled="!canHint"
      @click="$emit('hint')"
    >
      <AppIcon
        name="bulb"
        :size="14"
      />
      <span>{{ s.hint }}</span>
    </BaseButton>
    <BaseButton
      variant="tertiary"
      size="sm"
      block
      @click="$emit('retry')"
    >
      <AppIcon
        name="refresh"
        :size="14"
      />
      <span>{{ s.retry }}</span>
    </BaseButton>
    <BaseButton
      class="solver-actions__wide"
      variant="ghost"
      size="sm"
      block
      :disabled="!canContinue"
      @click="$emit('continueFromPosition')"
    >
      <AppIcon
        name="swap"
        :size="14"
      />
      <span>{{ s.continueFromPosition }}</span>
    </BaseButton>
    <BaseButton
      class="solver-actions__wide"
      variant="primary"
      size="sm"
      block
      @click="$emit('next')"
    >
      <span>{{ s.next }}</span>
      <AppIcon
        name="arrow-right"
        :size="14"
      />
    </BaseButton>
  </div>
</template>

<script setup lang="ts">
import { PUZZLE_STRINGS } from '@app/features/puzzles/config/puzzle-strings.js';
import AppIcon from '@app/shared/ui/AppIcon/AppIcon.vue';
import BaseButton from '@app/shared/ui/BaseButton/BaseButton.vue';

defineProps<{ canHint: boolean; canContinue: boolean }>();
defineEmits<{
  hint: [];
  retry: [];
  continueFromPosition: [];
  next: [];
}>();

const s = PUZZLE_STRINGS.solver;
</script>

<style scoped lang="scss">
.solver-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-2);
  padding-top: var(--sp-2);
}

.solver-actions__wide {
  grid-column: span 2;
}

</style>
