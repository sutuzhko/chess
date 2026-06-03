<template>
  <button
    type="button"
    class="home-resume"
    @click="emit('resume')"
  >
    <span class="home-resume__icon">
      <AppIcon
        name="play"
        :size="18"
      />
    </span>
    <span class="home-resume__body">
      <span class="home-resume__title">{{ $t('home.resume.title') }}</span>
      <span class="home-resume__sub">{{ sub }}</span>
    </span>
    <BaseBadge
      tone="accent"
      mono
      dot
    >
      LIVE
    </BaseBadge>
    <span class="home-resume__arrow">
      <AppIcon
        name="arrow-right"
        :size="18"
      />
    </span>
  </button>
</template>

<script setup lang="ts">
import AppIcon from '@app/shared/ui/AppIcon/AppIcon.vue';
import BaseBadge from '@app/shared/ui/BaseBadge/BaseBadge.vue';

defineProps<{ sub: string }>();
const emit = defineEmits<{ resume: [] }>();
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.home-resume {
  display: flex;
  align-items: center;
  gap: var(--sp-4);
  padding: var(--sp-4) var(--sp-5);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition:
    border-color var(--dur-base) var(--ease-out),
    background var(--dur-base) var(--ease-out);

  @include m.focus-ring;
}

.home-resume:hover {
  border-color: var(--border-strong);
  background: var(--surface-hover);
}

.home-resume__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--r-md);
  background: var(--accent-soft);
  color: var(--accent);
  font-size: var(--fs-base);
  flex-shrink: 0;
}

.home-resume__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.home-resume__title {
  font-weight: 600;
  font-size: var(--fs-base);
  color: var(--text);
}

.home-resume__sub {
  font-size: var(--fs-xs);
  color: var(--text-muted);
}

.home-resume__arrow {
  color: var(--accent);
  font-size: var(--fs-lg);
  flex-shrink: 0;
}
</style>
