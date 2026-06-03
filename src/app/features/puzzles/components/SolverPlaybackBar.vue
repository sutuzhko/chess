<template>
  <BaseCard
    padding="sm"
    class="solver-playback"
  >
    <div class="solver-playback__row">
      <BaseIconButton
        size="sm"
        :aria-label="s.aiSolveRestart"
        :title="s.aiSolveRestart"
        @click="$emit('reset')"
      >
        <AppIcon
          name="arrow-left"
          :size="14"
        />
      </BaseIconButton>
      <span class="solver-playback__counter">
        {{ visIndex }} / {{ total }}
      </span>
      <BaseButton
        variant="primary"
        size="sm"
        :disabled="!canStepNext"
        @click="$emit('next')"
      >
        <span>{{ s.aiSolveNext }}</span>
        <AppIcon
          name="arrow-right"
          :size="14"
        />
      </BaseButton>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import { PUZZLE_STRINGS } from '@app/features/puzzles/config/puzzle-strings.js';
import AppIcon from '@app/shared/ui/AppIcon/AppIcon.vue';
import BaseButton from '@app/shared/ui/BaseButton/BaseButton.vue';
import BaseCard from '@app/shared/ui/BaseCard/BaseCard.vue';
import BaseIconButton from '@app/shared/ui/BaseIconButton/BaseIconButton.vue';

defineProps<{
  visIndex: number;
  total: number;
  canStepNext: boolean;
}>();
defineEmits<{
  reset: [];
  next: [];
}>();

const s = PUZZLE_STRINGS.solver;
</script>

<style scoped lang="scss">
.solver-playback { padding: var(--sp-2) var(--sp-3); }

.solver-playback__row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  min-height: 36px;
}

.solver-playback__counter {
  flex: 1;
  text-align: center;
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  color: var(--text-muted);
}

</style>
