import type { Square } from '@modules/game/domain/game/value-objects/Square.js';
import type { BoardView } from './BoardView.js';

export type SquareClickHandler = (square: Square) => void;

/** Расширенный drag-and-drop поверх pointer-событий. См. docs/codebase/canvas-input.md */
export interface PointerDragHandler {
  onPickup?: (square: Square, event: PointerEvent) => boolean;
  onDrag?: (square: Square | null, event: PointerEvent) => void;
  onDrop?: (square: Square | null, event: PointerEvent) => void;
}

const DRAG_THRESHOLD_PX = 4;

export class InputController {
  private cleanup: (() => void) | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly view: BoardView,
    private orientation: () => 'white' | 'black',
  ) {}

  /** Tap/click поверх pointer-событий (mouse + touch + pen). */
  onSquareClick(handler: SquareClickHandler): void {
    this.detach();

    let downSquare: Square | null = null;
    let downX = 0;
    let downY = 0;
    let dragging = false;

    const onPointerDown = (e: PointerEvent): void => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      downSquare = this.view.squareAt(e.clientX, e.clientY, this.orientation());
      downX = e.clientX;
      downY = e.clientY;
      dragging = false;
    };

    const onPointerMove = (e: PointerEvent): void => {
      if (!downSquare) return;
      if (!dragging) {
        const dx = e.clientX - downX;
        const dy = e.clientY - downY;
        if (dx * dx + dy * dy > DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) {
          dragging = true;
        }
      }
    };

    const onPointerUp = (e: PointerEvent): void => {
      if (!downSquare) return;
      const upSquare = this.view.squareAt(e.clientX, e.clientY, this.orientation());
      if (upSquare) {
        if (dragging && !upSquare.equals(downSquare)) {
          // Drag из одного квадрата в другой — превращаем в пару кликов select + target.
          handler(downSquare);
          handler(upSquare);
        } else {
          handler(upSquare);
        }
      }
      downSquare = null;
      dragging = false;
    };

    const onPointerCancel = (): void => {
      downSquare = null;
      dragging = false;
    };

    this.canvas.addEventListener('pointerdown', onPointerDown);
    this.canvas.addEventListener('pointermove', onPointerMove);
    this.canvas.addEventListener('pointerup', onPointerUp);
    this.canvas.addEventListener('pointercancel', onPointerCancel);

    this.cleanup = (): void => {
      this.canvas.removeEventListener('pointerdown', onPointerDown);
      this.canvas.removeEventListener('pointermove', onPointerMove);
      this.canvas.removeEventListener('pointerup', onPointerUp);
      this.canvas.removeEventListener('pointercancel', onPointerCancel);
    };
  }

  detach(): void {
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
  }
}
