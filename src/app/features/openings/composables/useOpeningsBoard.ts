/** Канвас-доска для openings explorer-а. Подробности — docs/codebase/openings.md */
import { useBoardTheme } from '@app/features/game/composables/useBoardTheme.js';
import {
  OPENINGS_START_FEN,
} from '@app/features/openings/config/openings-constants.js';
import { useSettingsStore } from '@app/stores/settings.js';
import {
  GetLegalMovesUseCase,
  MakeMoveUseCase,
  StartMatchUseCase,
} from '@modules/game/application';
import { parseUci } from '@modules/game/application/uci.js';
import {
  InMemoryMatchRepository,
} from '@modules/game/infrastructure/persistence/InMemoryMatchRepository.js';
import { BoardController } from '@modules/game/ui/canvas/BoardController.js';
import {
  BoardView,
  preloadPieceImages,
} from '@modules/game/ui/canvas/BoardView.js';
import { InputController } from '@modules/game/ui/canvas/InputController.js';
import { PromotionDialog } from '@modules/game/ui/canvas/PromotionDialog.js';
import { InMemoryEventBus } from '@shared/lib/event-bus/InMemoryEventBus.js';
import { nextTick, onBeforeUnmount, onMounted, type Ref, watch } from 'vue';

const OPENINGS_MATCH_ID = '__openings_explorer__';

interface UseOpeningsBoardArgs {
  canvas: Ref<HTMLCanvasElement | null>;
  promo: Ref<HTMLElement | null>;
  moves: () => readonly string[];
  flipped: () => boolean;
  /** UCI кандидата для hover-подсветки, либо null для очистки. */
  preview?: () => string | null;
  onUserMove: (uci: string) => void;
}

export function useOpeningsBoard(args: UseOpeningsBoardArgs): void {
  let controller: BoardController | null = null;
  let cleanup: (() => void) | null = null;

  useBoardTheme(() => controller);

  onMounted(() => {
    void mount();
  });

  onBeforeUnmount(() => {
    cleanup?.();
  });

  async function mount(): Promise<void> {
    await nextTick();
    const canvas = args.canvas.value;
    const promoNode = args.promo.value;
    if (!canvas || !promoNode) return;

    const settings = useSettingsStore();
    const repo = new InMemoryMatchRepository();
    const bus = new InMemoryEventBus();
    const startMatch = new StartMatchUseCase(repo);
    const makeMove = new MakeMoveUseCase(repo, bus);
    const getLegal = new GetLegalMovesUseCase(repo);
    startMatch.execute({ matchId: OPENINGS_MATCH_ID, fen: OPENINGS_START_FEN });

    const view = new BoardView(canvas);
    const input = new InputController(canvas, view, () => (args.flipped() ? 'black' : 'white'));
    const promo = new PromotionDialog(promoNode);

    const c = new BoardController({
      boardView: view,
      input,
      bus,
      repo,
      makeMove,
      getLegalMoves: getLegal,
      promo,
      matchId: () => OPENINGS_MATCH_ID,
      canvas,
      orientation: () => (args.flipped() ? 'black' : 'white'),
      displayOptions: () => ({
        showCoordinates: settings.gameplay.coordinates,
        showLastMove: true,
        showHints: settings.gameplay.hints,
      }),
    });
    controller = c;
    c.mount();
    preloadPieceImages(() => { c.rerender(); });

    // Сообщаем наверх только ходы пользователя, не наши собственные replay-ходы.
    let suppress = false;
    const unsub = bus.subscribe('MoveMade', (event) => {
      if (suppress) return;
      args.onUserMove(event.move.toUci());
    });

    function rebuild(): void {
      suppress = true;
      try {
        if (repo.has(OPENINGS_MATCH_ID)) repo.delete(OPENINGS_MATCH_ID);
        startMatch.execute({ matchId: OPENINGS_MATCH_ID, fen: OPENINGS_START_FEN });
        c.reset();
        for (const uci of args.moves()) {
          const m = parseUci(uci);
          makeMove.execute({
            matchId: OPENINGS_MATCH_ID,
            from: m.from,
            to: m.to,
            ...(m.promotion ? { promotion: m.promotion } : {}),
          });
        }
      } finally {
        suppress = false;
      }
    }

    rebuild();
    const stop = watch([args.moves, args.flipped], rebuild);

    const stopPreview = args.preview
      ? watch(args.preview, (uci) => {
          if (!uci) {
            c.setPreview(null);
            return;
          }
          try {
            const m = parseUci(uci);
            c.setPreview({ from: m.from, to: m.to });
          } catch {
            c.setPreview(null);
          }
        })
      : null;

    cleanup = (): void => {
      stop();
      stopPreview?.();
      unsub();
      c.detach();
    };
  }
}
