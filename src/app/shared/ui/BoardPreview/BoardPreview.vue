<template>
  <canvas
    ref="canvasEl"
    class="board-preview"
    :class="sizeClass"
  />
</template>

<script setup lang="ts">
import { snapshotFromFen } from '@modules/game/application/fen.js';
import {
  BoardView,
  preloadPieceImages,
} from '@modules/game/ui/canvas/BoardView.js';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

const props = withDefaults(defineProps<{
  fen: string;
  orientation?: 'white' | 'black';
  /**
   * Размер канваса в CSS-пикселях. Когда задан — фиксированный квадрат `size × size`.
   * Когда `0` — канвас тянется по ширине контейнера (используется в гридах задач).
   * Внутренний буфер пикселей всегда масштабируется под DPR для чёткости.
   */
  size?: number;
}>(), {
  orientation: 'white',
  size: 0,
});
const MAX_DPR = 3;
const FALLBACK_CSS_SIZE = 160;

const canvasEl = ref<HTMLCanvasElement | null>(null);
let view: BoardView | null = null;
let backingSize = 0;
let resizeObserver: ResizeObserver | null = null;

const sizeClass = computed<string>(() => (props.size === 0 ? 'board-preview--fluid' : ''));

function dpr(): number {
  return Math.max(1, Math.min(MAX_DPR, window.devicePixelRatio || 1));
}

function targetCssSize(canvas: HTMLCanvasElement): number {
  if (props.size !== 0) return props.size;
  return canvas.clientWidth || FALLBACK_CSS_SIZE;
}

function ensureView(): void {
  const canvas = canvasEl.value;
  if (!canvas) return;
  const cssSize = targetCssSize(canvas);
  const bufferSize = Math.round(cssSize * dpr());
  if (backingSize === bufferSize && view) return;
  canvas.width = bufferSize;
  canvas.height = bufferSize;
  if (props.size !== 0) {
    canvas.style.width = `${String(props.size)}px`;
    canvas.style.height = `${String(props.size)}px`;
  }
  backingSize = bufferSize;
  view = new BoardView(canvas);
}

function render(): void {
  ensureView();
  if (!view) return;
  try {
    const snapshot = snapshotFromFen(props.fen);
    view.render({
      snapshot,
      selected: null,
      legalDestinations: [],
      lastMove: null,
      checkSquare: null,
      orientation: props.orientation,
      showCoordinates: false,
      showLastMove: false,
      showHints: false,
    });
  } catch {
    // Неверный FEN — оставляем пустой canvas.
  }
}

onMounted(() => {
  if (!canvasEl.value) return;
  preloadPieceImages(() => { render(); });
  render();

  if (props.size === 0) {
    resizeObserver = new ResizeObserver(() => { render(); });
    resizeObserver.observe(canvasEl.value);
  }
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
});

watch(() => [props.fen, props.orientation, props.size], () => { render(); });
</script>

<style scoped lang="scss">
.board-preview {
  display: block;
  border-radius: var(--r-sm);
}

.board-preview--fluid {
  width: 100%;
  height: auto;
  aspect-ratio: 1 / 1;
}
</style>
