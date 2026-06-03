<template>
  <label
    class="base-field"
    :class="{ 'base-field--inline': inline }"
  >
    <span
      v-if="label"
      class="base-field__label"
    >{{ label }}</span>
    <input
      :id="inputId"
      class="base-input"
      :class="sizeClass"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :aria-invalid="!!error || undefined"
      :aria-describedby="error ? errorId : undefined"
      @input="onInput"
      @change="onChange"
      @blur="onBlur"
    >
    <span
      v-if="error"
      :id="errorId"
      class="base-field__error"
    >{{ error }}</span>
  </label>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue';

const props = withDefaults(defineProps<{
  modelValue: string | number;
  label?: string;
  type?: 'text' | 'number' | 'email' | 'password' | 'search' | 'tel' | 'url';
  size?: 'sm' | 'md' | 'lg';
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  inline?: boolean;
  error?: string;
}>(), {
  label: '',
  type: 'text',
  size: 'md',
  placeholder: '',
  disabled: false,
  readonly: false,
  inline: false,
  error: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
  blur: [event: FocusEvent];
}>();

const inputId = useId();
const errorId = useId();

const sizeClass = computed<string>(() => `base-input--${props.size}`);

function onInput(e: Event): void {
  emit('update:modelValue', (e.target as HTMLInputElement).value);
}

function onChange(e: Event): void {
  emit('change', (e.target as HTMLInputElement).value);
}

function onBlur(e: FocusEvent): void {
  emit('blur', e);
}
</script>

<style scoped lang="scss">
.base-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.base-field--inline {
  flex-direction: row;
  align-items: center;
  gap: var(--sp-3);
}

.base-field__label {
  font-size: var(--fs-sm);
  color: var(--text);
  font-weight: 500;
}

.base-field__error {
  font-size: var(--fs-xs);
  color: var(--danger);
}

.base-input {
  width: 100%;
  padding: 0 var(--sp-3);
  font-family: var(--font-sans);
  font-size: var(--fs-base);
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  transition: border-color var(--dur-base), box-shadow var(--dur-fast);
}

.base-input::placeholder {
  color: var(--text-faint);
}

.base-input:hover:not(:disabled) {
  border-color: var(--border-strong);
}

.base-input:focus-visible {
  border-color: var(--accent);
  outline: none;
  box-shadow: var(--shadow-focus);
}

.base-input[aria-invalid='true'] {
  border-color: var(--danger);

  &:focus-visible {
    border-color: var(--danger);
    box-shadow: 0 0 0 2px color-mix(in oklab, var(--danger) 35%, transparent);
  }
}

.base-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.base-input--sm {
  height: 32px;
  font-size: var(--fs-sm);
}

.base-input--md {
  height: 40px;
}

.base-input--lg {
  height: 48px;
  font-size: var(--fs-md);
}
</style>
