<template>
  <RouterLink
    :to="to"
    class="modecard"
    :class="{ 'modecard--primary': primary }"
  >
    <div class="modecard__icon">
      <slot name="icon" />
    </div>
    <div class="modecard__body">
      <div class="modecard__title">
        {{ title }}
      </div>
      <div class="modecard__desc">
        {{ description }}
      </div>
    </div>
    <span class="modecard__arrow">→</span>
  </RouterLink>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';

withDefaults(defineProps<{
  to: string;
  title: string;
  description: string;
  primary?: boolean;
}>(), { primary: false });
</script>

<style scoped lang="scss">
.modecard {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-4);
  padding: var(--sp-5);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: all var(--dur-base);
  position: relative;
  min-height: 120px;

  &:hover {
    border-color: var(--border-strong);
    background: var(--surface-hover);
    transform: translateY(-1px);
  }

  &--primary {
    background: var(--accent);
    color: var(--accent-fg);
    border-color: var(--accent);

    &:hover {
      background: var(--accent-soft);
      border-color: var(--accent-soft);
    }
  }
}

.modecard__icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  opacity: 0.9;

  :slotted(img),
  :slotted(svg) {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.modecard__body { flex: 1; }

.modecard__title {
  font-size: var(--fs-xl);
  font-weight: 600;
  letter-spacing: var(--tracking-tight);
}

.modecard__desc {
  font-size: var(--fs-sm);
  opacity: 0.7;
  margin-top: 4px;
}

.modecard__arrow { opacity: 0.5; }
</style>
