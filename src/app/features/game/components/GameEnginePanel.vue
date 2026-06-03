<template>
  <div class="card">
    <div class="card__header">
      <span class="card__title">Движок</span>
      <span
        v-if="isBusy"
        class="badge"
      >думает…</span>
    </div>
    <div class="card__body">
      <template v-if="data">
        <div class="engine-eval">
          {{ evalString }}
        </div>
        <div class="engine-bar">
          <div
            class="engine-bar__fill"
            :style="{ width: whitePct + '%' }"
          />
        </div>
        <div class="engine-row">
          <span>Глубина <span class="t-mono">{{ data.depth }}</span></span>
          <span class="t-mono">{{ data.bestMoveUci ?? '—' }}</span>
        </div>
        <div
          v-if="data.nodes"
          class="engine-row engine-row--nodes t-faint"
        >
          <span>{{ data.nodes.toLocaleString() }} узлов</span>
          <span>{{ data.elapsedMs }}мс</span>
        </div>
      </template>
      <span
        v-else
        class="t-faint t-mono engine-no-analysis"
      >Нет анализа</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EngineData } from '@app/features/game/types/engine.types.js';
import { computed } from 'vue';

export type { EngineData };

const props = defineProps<{
  isBusy: boolean;
  data: EngineData | null;
}>();

const evalString = computed(() => {
  if (!props.data) return '';
  const score = props.data.score;
  return score >= 0 ? `+${(score / 100).toFixed(2)}` : (score / 100).toFixed(2);
});

const whitePct = computed(() => {
  if (!props.data) return 50;
  return Math.max(5, Math.min(95, 50 + props.data.score / 20));
});
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;
@include m.card;
@include m.typography-helpers;

/* — badge — */
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  height: 20px;
  padding: 0 var(--sp-2);
  border-radius: var(--r-sm);
  background: var(--surface-3);
  color: var(--text-muted);
  font-family: var(--font-mono), sans-serif;
  font-size: var(--fs-2xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  font-weight: 500;
}

.badge--accent {
  background: var(--accent-glow);
  color: var(--accent);
}

.badge--success {
  background: rgb(110 194 138 / 0.15);
  color: var(--success);
}

.badge--warning {
  background: rgb(224 179 65 / 0.15);
  color: var(--warning);
}

.badge--danger {
  background: rgb(217 107 107 / 0.15);
  color: var(--danger);
}

.badge--info {
  background: rgb(110 168 217 / 0.15);
  color: var(--info);
}

/* — engine-panel — */
.engine-eval {
  font-family: var(--font-mono), sans-serif;
  font-size: var(--fs-xl);
  font-weight: 600;
  letter-spacing: var(--tracking-tight);
  margin-bottom: var(--sp-2);
}

.engine-bar {
  height: 6px;
  background: var(--surface-3);
  border-radius: var(--r-pill);
  overflow: hidden;
  position: relative;
  margin-bottom: var(--sp-3);
}

.engine-bar__fill {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  background: var(--accent);
  border-radius: var(--r-pill);
  transition: width var(--dur-slow) var(--ease-out);
  width: 50%;
}

.engine-row {
  display: flex;
  justify-content: space-between;
  font-size: var(--fs-xs);
  color: var(--text-muted);

  .t-mono { color: var(--text); }
}

.engine-no-analysis { font-size: var(--fs-xs); }
.engine-row--nodes { margin-top: var(--sp-1); }
</style>
