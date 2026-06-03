<template>
  <label
    class="base-switch"
    :class="{ 'is-disabled': disabled }"
  >
    <span
      v-if="label || $slots.default"
      class="base-switch__text"
    >
      <span class="base-switch__label">
        <slot>{{ label }}</slot>
      </span>
      <span
        v-if="hint"
        class="base-switch__sub"
      >{{ hint }}</span>
    </span>
    <input
      type="checkbox"
      class="base-switch__input"
      :checked="modelValue"
      :disabled="disabled"
      @change="onChange"
    >
    <span
      class="base-switch__track"
      :class="{ 'is-on': modelValue }"
    >
      <span class="base-switch__thumb" />
    </span>
  </label>
</template>

<script setup lang="ts">
// Опциональные пропсы помечены `| undefined` явно: под `exactOptionalPropertyTypes`
// это необходимо, чтобы вызывающие компоненты могли пробрасывать значения типа
// `boolean | undefined` (например, `:disabled="opt.disabled"`).
withDefaults(defineProps<{
  modelValue: boolean;
  label?: string | undefined;
  hint?: string | undefined;
  disabled?: boolean | undefined;
}>(), {
  label: '',
  hint: '',
  disabled: false,
});

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();

function onChange(e: Event): void {
  emit('update:modelValue', (e.target as HTMLInputElement).checked);
}
</script>

<style scoped lang="scss">
.base-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-4);
  padding: var(--sp-3) 0;
  cursor: pointer;
}

.base-switch.is-disabled {
  opacity: 0.5;
  pointer-events: none;
}

.base-switch__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.base-switch__label {
  font-size: var(--fs-base);
  color: var(--text);
  font-weight: 500;
}

.base-switch__sub {
  font-size: var(--fs-xs);
  color: var(--text-faint);
}

/* Скрываем нативный checkbox — он только для семантики/keyboard. */
.base-switch__input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

.base-switch__track {
  width: 40px;
  height: 22px;
  border-radius: 11px;
  background: var(--surface-sunk);
  border: 1px solid var(--border);
  position: relative;
  transition:
    background var(--dur-base),
    border-color var(--dur-base);
  flex-shrink: 0;
}

.base-switch__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 8px;
  background: var(--text-muted);
  transition: all var(--dur-base) var(--ease-spring);
}

.base-switch__track.is-on {
  background: var(--accent);
  border-color: var(--accent);
}

.base-switch__track.is-on .base-switch__thumb {
  left: 20px;
  background: #fff;
}

.base-switch__input:focus-visible + .base-switch__track {
  box-shadow: var(--shadow-focus);
}
</style>
