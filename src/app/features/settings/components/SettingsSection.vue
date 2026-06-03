<template>
  <section class="settings-section">
    <div
      v-if="$slots.title || title"
      class="settings-section__title"
    >
      <slot name="title">
        {{ title }}
      </slot>
    </div>
    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps<{ title?: string }>();
</script>

<style scoped lang="scss">
.settings-section {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  padding: var(--sp-4) 0;
  border-bottom: 1px solid var(--border);

  &:last-child { border-bottom: none; }
}

.settings-section__title {
  font-size: var(--fs-xs);
  color: var(--text-faint);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  font-family: var(--font-mono), sans-serif;
  font-weight: 500;
  margin-bottom: var(--sp-2);
}
</style>
