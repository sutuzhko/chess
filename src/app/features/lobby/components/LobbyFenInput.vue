<template>
  <BaseInput
    :model-value="modelValue"
    type="text"
    size="md"
    :placeholder="$t('lobby.fen.placeholder')"
    :error="invalid ? $t('lobby.fen.invalid') : ''"
    class="lobby-fen"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
import BaseInput from '@app/shared/ui/BaseInput/BaseInput.vue';

defineProps<{
  modelValue: string;
  invalid: boolean;
}>();

const emit = defineEmits<{ 'update:modelValue': [string] }>();
</script>

<style scoped lang="scss">
.lobby-fen :deep(.base-input) {
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  letter-spacing: 0.01em;
}
</style>
