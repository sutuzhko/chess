/** Пересчитывает размер квадратной доски через CSS-var `--board-size`. См. docs/codebase/game-shell.md */
import { onUnmounted, ref, type Ref } from 'vue';

export interface UseSquareBoardOptions {
  /** Дополнительная высота строк внутри stage'а (резерв-панели в шведках). */
  extraRowHeight?: number;
  /** Ширина горизонтальной eval-bar колонки слева от доски. */
  evalBarW?: number;
  /** Зазор между eval-bar и доской. */
  wrapGap?: number;
  /** Зазор между рядами (player-card / board / player-card). */
  rowGap?: number;
}

export interface UseSquareBoardResult {
  /** Привязать к корневому контейнеру stage'а (template-ref). */
  stageRef: Ref<HTMLElement | null>;
}

export function useSquareBoard(opts: UseSquareBoardOptions = {}): UseSquareBoardResult {
  const {
    extraRowHeight = 0,
    evalBarW = 0,
    wrapGap = 0,
    rowGap = 12,
  } = opts;

  const stageRef = ref<HTMLElement | null>(null);
  let observer: ResizeObserver | null = null;

  function recompute(stage: HTMLElement): void {
    const sH = stage.clientHeight;
    const sW = stage.clientWidth;
    if (!sH || !sW) return;
    const cards = stage.querySelectorAll<HTMLElement>('.player-card');
    const pcH = cards.length >= 2 && cards[0] && cards[1]
      ? Math.max(cards[0].offsetHeight, cards[1].offsetHeight)
      : 56;
    const numRows = 2 + (extraRowHeight ? 2 : 0) + 1;
    const totalGap = (numRows - 1) * rowGap;
    const availH = sH - 2 * pcH - (extraRowHeight ? 2 * extraRowHeight : 0) - totalGap;
    const availW = sW - evalBarW - wrapGap;
    const size = Math.min(availH, availW);
    if (size <= 0) return;
    const stageW = size + evalBarW + wrapGap;
    const next = `${String(size)}px`;
    if (stage.style.getPropertyValue('--board-size') === next) return;
    stage.style.setProperty('--board-size', next);
    stage.style.setProperty('--stage-w', `${String(stageW)}px`);
  }

  function setup(stage: HTMLElement): void {
    recompute(stage);
    observer = new ResizeObserver(() => { recompute(stage); });
    observer.observe(stage);
  }

  // Stage прилетает через template-ref. Поднимаем его в microtask + RAF
  // вместо watch/nextTick — это проще и срабатывает раньше первого пейнта.
  const stop = ref<(() => void) | null>(null);
  function ensure(): void {
    const stage = stageRef.value;
    if (!stage) return;
    setup(stage);
  }

  queueMicrotask(ensure);
  requestAnimationFrame(ensure);

  onUnmounted(() => {
    observer?.disconnect();
    observer = null;
    stop.value?.();
  });

  return { stageRef };
}
