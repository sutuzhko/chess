<template>
  <div
    class="stat-tile"
    :class="{ 'stat-tile--brand': brand }"
  >
    <div class="stat-tile__val">
      {{ value }}
    </div>
    <div class="stat-tile__lbl">
      {{ label }}
    </div>
    <div
      v-if="delta"
      class="stat-tile__delta"
      :class="`stat-tile__delta--${delta.dir}`"
    >
      <span>{{ delta.dir === 'up' ? '↑' : '↓' }}</span>
      <span>{{ delta.text }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StatDelta } from './types.js';

withDefaults(defineProps<{
  label: string;
  value: string | number;
  /** Изменение метрики; не отрисовывается если не передано. */
  delta?: StatDelta | undefined;
  brand?: boolean;
}>(), {
  delta: undefined,
  brand: false,
});
</script>

<style scoped lang="scss">
.stat-tile {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--sp-4);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  min-height: 88px;
}

.stat-tile__val {
  font-family: var(--font-display);
  font-size: var(--fs-2xl);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  color: var(--text);
  line-height: 1.1;
}

.stat-tile__lbl {
  font-size: var(--fs-xs);
  color: var(--text-faint);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  font-weight: 500;
}

.stat-tile__delta {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: var(--fs-xs);
  font-weight: 600;
  margin-top: var(--sp-1);
}

.stat-tile__delta--up { color: var(--success); }
.stat-tile__delta--down { color: var(--danger); }

.stat-tile--brand {
  background: var(--accent);
  color: var(--accent-fg);
  border-color: var(--accent);
}

.stat-tile--brand .stat-tile__val {
  color: #fff;
}

.stat-tile--brand .stat-tile__lbl {
  color: rgb(255 255 255 / 0.85);
}
</style>
