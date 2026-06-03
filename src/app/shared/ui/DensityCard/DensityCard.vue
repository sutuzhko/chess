<template>
  <button
    type="button"
    class="density-card"
    :class="{ 'is-active': active, 'is-disabled': disabled }"
    :aria-pressed="active"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <div
      class="density-card__preview"
      :class="`density-card__preview--${density}`"
    >
      <span class="density-card__line" />
      <span class="density-card__line" />
      <span class="density-card__line" />
    </div>
    <div class="density-card__label">
      {{ label }}<span
        v-if="disabled"
        class="density-card__hint"
      > · {{ soonLabel }}</span>
    </div>
  </button>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

withDefaults(defineProps<{
  density: 'compact' | 'normal' | 'comfy';
  label: string;
  active?: boolean;
  disabled?: boolean;
}>(), { active: false, disabled: false });

defineEmits<{ click: [] }>();

const { t } = useI18n();
const soonLabel = t('settings.common.soon');
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.density-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-3);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  cursor: pointer;
  transition: border-color var(--dur-base), background var(--dur-base);

  @include m.focus-ring;
}

.density-card:hover {
  border-color: var(--border-strong);
}

.density-card.is-active {
  border-color: var(--accent);
  background: var(--accent-soft);
  box-shadow: var(--shadow-xs);
}

.density-card.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.density-card__preview {
  width: 100%;
  height: 64px;
  border-radius: var(--r-sm);
  background: var(--surface-2);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 var(--sp-3);
}

.density-card__line {
  height: 4px;
  background: var(--border-strong);
  border-radius: 2px;
}

.density-card__preview--compact .density-card__line + .density-card__line { margin-top: 4px; }
.density-card__preview--normal .density-card__line + .density-card__line { margin-top: 8px; }
.density-card__preview--comfy .density-card__line + .density-card__line { margin-top: 12px; }

.density-card__label {
  font-size: var(--fs-sm);
  font-weight: 500;
  color: var(--text);
}

.density-card__hint {
  color: var(--text-faint);
  font-weight: 400;
}
</style>
