<template>
  <div
    class="setting-row"
    :class="{ 'setting-row--disabled': disabled }"
  >
    <div class="setting-row__text">
      <div class="setting-row__label">
        {{ label }}<span
          v-if="disabled"
          class="setting-row__hint"
        > · {{ soonLabel }}</span>
      </div>
      <div
        v-if="description"
        class="setting-row__desc"
      >
        {{ description }}
      </div>
    </div>
    <BaseSwitch
      :model-value="modelValue"
      :disabled="disabled"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import BaseSwitch from '@app/shared/ui/BaseSwitch/BaseSwitch.vue';
import { useI18n } from 'vue-i18n';

withDefaults(defineProps<{
  modelValue: boolean;
  label: string;
  description?: string;
  disabled?: boolean;
}>(), {
  description: '',
  disabled: false,
});

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();

const { t } = useI18n();
const soonLabel = t('settings.common.soon');
</script>

<style scoped lang="scss">
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-4);
  padding: var(--sp-3) var(--sp-5);
  border-top: 1px solid var(--divider);

  &:first-child { border-top: 0; }

  &--disabled { opacity: 0.55; }
}

.setting-row__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.setting-row__label {
  font-size: var(--fs-base);
  color: var(--text);
  font-weight: 500;
}

.setting-row__hint {
  color: var(--text-faint);
  font-weight: 400;
}

.setting-row__desc {
  font-size: var(--fs-xs);
  color: var(--text-faint);
}
</style>
