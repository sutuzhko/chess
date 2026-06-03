<template>
  <SplashScreen
    v-if="!splashDone"
    @done="splashDone = true"
  />

  <template v-if="splashDone">
    <TopNav />
    <ErrorBoundary>
      <RouterView />
    </ErrorBoundary>
    <BottomNav />
  </template>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import BottomNav from './shared/ui/BottomNav/BottomNav.vue';
import ErrorBoundary from './shared/ui/ErrorBoundary/ErrorBoundary.vue';
import SplashScreen from './shared/ui/SplashScreen/SplashScreen.vue';
import TopNav from './shared/ui/TopNav/TopNav.vue';

const splashDone = ref(false);
</script>
