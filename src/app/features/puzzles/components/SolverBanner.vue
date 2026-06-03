<template>
  <BaseCard
    padding="md"
    class="solver-banner"
    :class="`solver-banner--${tone}`"
  >
    <div class="solver-banner__row">
      <span class="solver-banner__icon">
        <AppIcon
          v-if="tone === 'success'"
          name="check"
          :size="16"
        />
        <AppIcon
          v-else
          name="cross"
          :size="16"
        />
      </span>
      <div class="solver-banner__content">
        <div class="solver-banner__title">
          {{ title }}
        </div>
        <div class="solver-banner__body">
          {{ body }}
        </div>
      </div>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import AppIcon from '@app/shared/ui/AppIcon/AppIcon.vue';
import BaseCard from '@app/shared/ui/BaseCard/BaseCard.vue';

defineProps<{
  tone: 'success' | 'danger';
  title: string;
  body: string;
}>();
</script>

<style scoped lang="scss">
.solver-banner {
  border-width: 1px;
  border-style: solid;

  &--success {
    border-color: color-mix(in oklab, var(--success) 40%, var(--border));
    background: var(--success-soft);
  }

  &--danger {
    border-color: color-mix(in oklab, var(--danger) 40%, var(--border));
    background: var(--danger-soft);
  }
}

.solver-banner__row {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-2);
}

.solver-banner__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--r-md);
  flex-shrink: 0;

}

.solver-banner--success .solver-banner__icon {
  background: rgb(255 255 255 / 0.15);
  color: var(--success);
}

.solver-banner--danger .solver-banner__icon {
  background: rgb(255 255 255 / 0.15);
  color: var(--danger);
}

.solver-banner__content { flex: 1; }

.solver-banner__title {
  font-weight: 600;
  font-size: var(--fs-sm);
}

.solver-banner__body {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  margin-top: 2px;
}
</style>
