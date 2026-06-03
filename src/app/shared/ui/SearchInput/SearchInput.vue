<template>
  <div class="search-input">
    <span class="search-input__icon">
      <AppIcon
        name="search"
        :size="16"
      />
    </span>
    <input
      :value="modelValue"
      type="text"
      class="search-input__field"
      :placeholder="placeholder"
      @input="onInput"
    >
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@app/shared/ui/AppIcon/AppIcon.vue';

withDefaults(defineProps<{
  modelValue: string;
  placeholder?: string;
}>(), { placeholder: '' });

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

function onInput(e: Event): void {
  emit('update:modelValue', (e.target as HTMLInputElement).value);
}
</script>

<style scoped lang="scss">
.search-input {
  position: relative;
  display: block;
  width: 100%;
}

.search-input__icon {
  position: absolute;
  top: 50%;
  left: 12px;
  transform: translateY(-50%);
  color: var(--text-faint);
  pointer-events: none;
  display: inline-flex;

}

.search-input__field {
  width: 100%;
  height: 40px;
  padding: 0 var(--sp-3) 0 36px;
  font-family: var(--font-sans);
  font-size: var(--fs-base);
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  transition: border-color var(--dur-base), box-shadow var(--dur-fast);

  &::placeholder { color: var(--text-faint); }

  &:hover { border-color: var(--border-strong); }

  &:focus-visible {
    border-color: var(--accent);
    outline: none;
    box-shadow: var(--shadow-focus);
  }
}
</style>
