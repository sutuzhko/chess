import { getAiProfile } from '@app/features/game/config/ai-config.js';
import { useShvedkiAiService } from '@app/stores/services/shvedki-ai.js';
import type { Color } from '@modules/game/domain/game';
import type { ShellCtx } from './types.js';

/**
 * Шведки: человек всегда играет за Команду 1 (Белые·A + Чёрные·B), поэтому
 * AI всегда ведёт Команду 2 (Чёрные·A + Белые·B), вне зависимости от настройки
 * стороны.
 */
export function aiColorOnBoard(ctx: ShellCtx, boardId: 'A' | 'B'): Color | null {
  if (ctx.form.aiSideValue.value === 'off') return null;
  return boardId === 'A' ? 'black' : 'white';
}

export function maybeRunShvedkiAiForBoard(ctx: ShellCtx, boardId: 'A' | 'B'): void {
  const { mut, ui, form } = ctx;
  if (!mut.shvedkiController || mut.shvedkiAiBusy || form.aiSideValue.value === 'off') return;
  const phase = mut.shvedkiController.getPhase();
  if (phase.kind === 'finished') return;

  const aiColor = aiColorOnBoard(ctx, boardId);
  if (!aiColor) return;

  if (phase.kind === 'last-move') {
    if (phase.boardId !== boardId || phase.color !== aiColor) return;
  } else {
    const currentSnap = mut.shvedkiController.getSnapshot(boardId);
    if (currentSnap.sideToMove !== aiColor) return;
  }

  mut.shvedkiAiBusy = true;
  ui.engineBusy = true;
  const profile = getAiProfile(form.aiDepthValue.value);
  const snap = mut.shvedkiController.getSnapshot(boardId);
  const reserves = mut.shvedkiController.getReserves(boardId);
  const ctrl = mut.shvedkiController;
  const useCase = useShvedkiAiService().useCase();

  void (async () => {
    try {
      const result = await useCase.execute({ snap, reserves, aiColor, profile });
      if (!result) {
        // Терминал: нет легальных ходов вообще, включая дропы.
        return;
      }
      if (result.move.kind === 'drop') {
        ctrl.applyAiDrop(boardId, result.move.piece, result.move.to);
      } else {
        const m = result.move.move;
        ctrl.applyAiMove(boardId, m.from, m.to, m.promotion ?? undefined);
      }
    } catch (e) {
      console.error('Shvedki AI error', e);
    } finally {
      mut.shvedkiAiBusy = false;
      ui.engineBusy = false;
      maybeRunShvedkiAiForBoard(ctx, 'A');
      maybeRunShvedkiAiForBoard(ctx, 'B');
    }
  })();
}
