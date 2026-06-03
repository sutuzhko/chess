<template>
  <button
    type="button"
    class="theme-card"
    :class="{ 'is-active': active }"
    :aria-pressed="active"
    @click="$emit('click')"
  >
    <span
      class="theme-card__preview"
      :class="`theme-card__preview--${variant}`"
    >
      <span class="theme-card__win" />
      <span class="theme-card__line" />
      <span class="theme-card__line theme-card__line--short" />
    </span>
    <span class="theme-card__lbl">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  variant: 'light' | 'dark';
  label: string;
  active?: boolean;
}>(), { active: false });

defineEmits<{ click: [] }>();
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.theme-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--sp-2);
  padding: var(--sp-3);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  cursor: pointer;
  text-align: center;
  transition: border-color var(--dur-base), background var(--dur-base);

  @include m.focus-ring;
}

.theme-card:hover { border-color: var(--border-strong); }

.theme-card.is-active {
  border-color: var(--accent);
  background: var(--accent-soft);
  box-shadow: var(--shadow-xs);
}

.theme-card__preview {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  width: 100%;
  height: 80px;
  padding: 12px;
  border-radius: var(--r-md);
  border: 1px solid var(--border);
}

.theme-card__preview--light {
  background: #f6f7f8;
  color: #14171b;
}

.theme-card__preview--dark {
  background: #14171b;
  color: #e8ecf1;
}

.theme-card__win {
  width: 100%;
  height: 10px;
  background: currentcolor;
  opacity: 0.12;
  border-radius: 2px;
}

.theme-card__line {
  width: 100%;
  height: 4px;
  background: currentcolor;
  opacity: 0.5;
  border-radius: 2px;
}

.theme-card__line--short {
  width: 60%;
  opacity: 0.3;
}

.theme-card__lbl {
  font-weight: 600;
  font-size: var(--fs-sm);
  color: var(--text);
}
</style>
