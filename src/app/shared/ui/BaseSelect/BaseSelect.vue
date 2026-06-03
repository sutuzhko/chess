<template>
  <label class="base-field">
    <span
      v-if="label"
      class="base-field__label"
    >{{ label }}</span>
    <select
      :id="selectId"
      class="base-select"
      :value="modelValue"
      :disabled="disabled"
      @change="onChange"
    >
      <option
        v-if="placeholder"
        value=""
        disabled
      >{{ placeholder }}</option>
      <option
        v-for="opt in options"
        :key="String(opt.value)"
        :value="opt.value"
      >{{ opt.label }}</option>
    </select>
  </label>
</template>

<script setup lang="ts">
import { useId } from 'vue';

export interface SelectOption {
  value: string | number;
  label: string;
}

withDefaults(defineProps<{
  modelValue: string | number;
  options: readonly SelectOption[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}>(), {
  label: '',
  placeholder: '',
  disabled: false,
});

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>();

const selectId = useId();

function onChange(e: Event): void {
  emit('update:modelValue', (e.target as HTMLSelectElement).value);
}
</script>

<style scoped lang="scss">
.base-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.base-field__label {
  font-size: var(--fs-sm);
  color: var(--text);
  font-weight: 500;
}

.base-select {
  width: 100%;
  height: 40px;
  padding: 0 var(--sp-3);
  font-family: var(--font-sans);
  font-size: var(--fs-base);
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  transition: border-color var(--dur-base), box-shadow var(--dur-fast);
}

.base-select:hover:not(:disabled) {
  border-color: var(--border-strong);
}

.base-select:focus-visible {
  border-color: var(--accent);
  outline: none;
  box-shadow: var(--shadow-focus);
}

.base-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
