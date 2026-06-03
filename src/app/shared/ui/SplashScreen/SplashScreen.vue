<template>
  <Transition name="splash-fade">
    <div
      v-if="visible"
      class="splash"
    >
      <div class="splash__logo">
        <img
          :src="figureUrl('knight-white')"
          class="splash__knight"
          alt=""
          aria-hidden="true"
          draggable="false"
        >
      </div>
      <div class="splash__text">
        <div class="splash__title">
          Конём ходи
        </div>
        <div class="splash__tagline">
          Ходи. Решай. Играй.
        </div>
      </div>
      <div class="splash__bar">
        <div
          class="splash__bar-fill"
          :style="{ width: progress + '%' }"
        />
      </div>
      <div class="splash__status">
        {{ status }}
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { figureUrl } from '@shared/config/asset-path.js';
import { onMounted, ref } from 'vue';

const emit = defineEmits<{ done: [] }>();
const visible = ref(true);
const progress = ref(0);
const status = ref('Загрузка ресурсов…');

onMounted(async () => {
  await tick(20, 'Загрузка ресурсов…');
  await tick(60, 'Инициализация движка…');
  await tick(90, 'Восстановление позиции…');
  progress.value = 100;
  status.value = 'Готово';
  await delay(300);
  visible.value = false;
  emit('done');
});

function delay(ms: number): Promise<void> {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function tick(target: number, label: string): Promise<void> {
  status.value = label;
  const step = (target - progress.value) / 8;
  for (let i = 0; i < 8; i++) {
    progress.value += step;
    await delay(40);
  }
  progress.value = target;
}
</script>

<style scoped lang="scss">
.splash {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--sp-5);
  background: var(--bg);
  color: var(--text);
}

.splash__logo {
  width: 96px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-soft);
  border: 1px solid var(--accent);
  border-radius: var(--r-xl);
  box-shadow: var(--shadow-focus);
}

.splash__knight {
  width: 64px;
  height: 64px;
}

.splash__text {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}

.splash__title {
  font-family: var(--font-display), sans-serif;
  font-size: var(--fs-2xl);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  color: var(--text-strong);
}

.splash__tagline {
  font-family: var(--font-mono), sans-serif;
  font-size: var(--fs-2xs);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--text-faint);
}

.splash__bar {
  width: 220px;
  height: 4px;
  background: var(--surface-sunk);
  border-radius: var(--r-pill);
  overflow: hidden;
}

.splash__bar-fill {
  height: 100%;
  background: var(--accent);
  border-radius: var(--r-pill);
  transition: width var(--dur-base) var(--ease-out);
}

.splash__status {
  font-size: var(--fs-xs);
  color: var(--text-muted);
}

.splash-fade-leave-active {
  transition: opacity 0.4s ease;
}

.splash-fade-leave-to {
  opacity: 0;
}
</style>
