/** Фабрика канвас-доски с Vue-lifecycle: BoardView + InputController + PromotionDialog + контроллер по выбору. */
import { BoardView } from '@modules/game/ui/canvas/BoardView.js';
import { InputController } from '@modules/game/ui/canvas/InputController.js';
import { PromotionDialog } from '@modules/game/ui/canvas/PromotionDialog.js';
import { onUnmounted } from 'vue';

export interface CanvasBoardHandles {
  boardView: BoardView;
  input: InputController;
  promo: PromotionDialog;
}

export interface CanvasBoardController {
  mount(): void;
  rerender(): void;
  detach(): void;
}

export interface UseCanvasBoardArgs<TController extends CanvasBoardController> {
  canvas: HTMLCanvasElement;
  promoNode: HTMLElement;
  orientation: () => 'white' | 'black';
  /** Получает примитивы, возвращает игровой controller. */
  buildController: (handles: CanvasBoardHandles) => TController;
}

export interface UseCanvasBoardResult<TController extends CanvasBoardController> {
  handles: CanvasBoardHandles;
  controller: TController;
}

export function useCanvasBoard<TController extends CanvasBoardController>(
  args: UseCanvasBoardArgs<TController>,
): UseCanvasBoardResult<TController> {
  const boardView = new BoardView(args.canvas);
  const input = new InputController(args.canvas, boardView, args.orientation);
  const promo = new PromotionDialog(args.promoNode);
  const handles: CanvasBoardHandles = { boardView, input, promo };
  const controller = args.buildController(handles);

  onUnmounted(() => {
    controller.detach();
    input.detach();
  });

  return { handles, controller };
}
