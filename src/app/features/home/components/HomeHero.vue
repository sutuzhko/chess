<template>
  <section class="home-hero">
    <div class="home-hero__eyebrow">
      {{ $t('home.eyebrow') }}
    </div>
    <h1 class="home-hero__title">
      {{ $t('home.title') }}
    </h1>
    <p class="home-hero__sub">
      {{ $t('home.subtitle') }}
    </p>
  </section>
</template>

<script setup lang="ts">
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.home-hero {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  margin-bottom: var(--sp-2);
}

.home-hero__eyebrow {
  font-family: var(--font-mono), sans-serif;
  font-size: var(--fs-2xs);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--text-faint);
  font-weight: 500;
}

.home-hero__title {
  font-family: var(--font-display), sans-serif;
  font-size: var(--fs-4xl);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  margin: var(--sp-1) 0 0;
  line-height: var(--lh-tight);
  color: var(--text-strong);
}

.home-hero__sub {
  color: var(--text-muted);
  font-size: var(--fs-md);
  margin: 0;
  max-width: 60ch;
}

@include m.mobile {
  .home-hero__title {
    font-size: var(--fs-3xl);
  }
}
</style>
