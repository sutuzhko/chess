<template>
  <div class="empty-state">
    <div
      v-if="$slots.icon"
      class="empty-state__icon"
    >
      <slot name="icon" />
    </div>
    <h3
      v-if="$slots.title || title"
      class="empty-state__title"
    >
      <slot name="title">
        {{ title }}
      </slot>
    </h3>
    <p
      v-if="$slots.description || description"
      class="empty-state__desc"
    >
      <slot name="description">
        {{ description }}
      </slot>
    </p>
    <div
      v-if="$slots.actions"
      class="empty-state__actions"
    >
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
  description?: string;
}>();
</script>

<style scoped lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--sp-3);
  padding: var(--sp-7) var(--sp-4);
  color: var(--text-muted);
}

.empty-state__icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-faint);
}

.empty-state__title {
  margin: 0;
  font-size: var(--fs-md);
  font-weight: 600;
  color: var(--text);
}

.empty-state__desc {
  margin: 0;
  font-size: var(--fs-sm);
  max-width: 32ch;
}

.empty-state__actions {
  display: flex;
  gap: var(--sp-2);
  margin-top: var(--sp-2);
}
</style>
