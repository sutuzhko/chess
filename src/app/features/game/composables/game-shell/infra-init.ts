/** Сборка ShellInfra для одной партии. Подробности — docs/codebase/game-shell.md */
import { parseTimeControl } from '@app/features/game/config/time-controls.js';
import { useEngineService } from '@app/stores/services/engine.js';
import { useEventBusService } from '@app/stores/services/event-bus.js';
import { usePersistenceService } from '@app/stores/services/persistence.js';
import { useUseCasesService } from '@app/stores/services/use-cases.js';
import { BoardView } from '@modules/game/ui/canvas/BoardView.js';
import { InputController } from '@modules/game/ui/canvas/InputController.js';
import { GameClock } from '@modules/game/ui/clock/GameClock.js';
import { DevOverlay } from '@modules/game/ui/dev-mode/DevOverlay.js';
import { MoveListView } from '@modules/game/ui/MoveListView.js';
import {
  NotificationOverlay,
} from '@shared/ui/notifications/NotificationOverlay.js';
import type { ShellCtx, ShellInfra } from './types.js';
import { updateClockDisplay, updateUi } from './ui-display.js';

export function initializeInfra(
  ctx: ShellCtx,
  canvasA: HTMLCanvasElement,
  overlayNode: HTMLElement,
  notifNode: HTMLElement,
  listNode: HTMLElement,
): void {
  const enginesSvc = useEngineService();
  const busSvc = useEventBusService();
  const persistSvc = usePersistenceService();
  const usecases = useUseCasesService();
  const persist = persistSvc.persistence();

  const infra: ShellInfra = ctx.infra;
  infra.repo = persist.matchRepository;
  infra.configStore = persist.matchConfig;
  infra.shvedkiStore = persist.shvedkiState;
  infra.clockStore = persist.clockState;
  infra.bus = busSvc.eventBus();
  infra.engine = enginesSvc.engine();
  infra.startMatch = usecases.startMatch;
  infra.makeMove = usecases.makeMove;
  infra.undoMove = usecases.undoMove;
  infra.redoMove = usecases.redoMove;
  infra.requestBest = usecases.requestBest;
  infra.forfeitMatch = usecases.forfeitMatch;
  infra.resignMatch = usecases.resignMatch;
  infra.getLegalMoves = usecases.getLegalMoves;
  infra.boardView = new BoardView(canvasA);
  infra.inputA = new InputController(canvasA, infra.boardView, () => ctx.ui.orientation);
  infra.overlay = new DevOverlay(overlayNode);
  infra.notification = new NotificationOverlay(notifNode);
  infra.moveList = new MoveListView(listNode, (idx) => {
    if (ctx.ui.gameMode !== 'standard') return;
    if (!ctx.infra.repo.has(ctx.mut.matchId)) return;
    ctx.infra.repo.get(ctx.mut.matchId).jumpTo(idx);
    ctx.mut.boardController?.reset();
    updateUi(ctx);
  });
  infra.clock = new GameClock(parseTimeControl(ctx.form.selectedTimeControl.value));
  infra.clock.onTick = (w, b) => { updateClockDisplay(ctx, w, b); };
  infra.clock.onForfeit = (loser) => {
    if (ctx.ui.gameMode !== 'standard') return;
    infra.forfeitMatch.execute(ctx.mut.matchId, loser);
    infra.clock.stop();
    updateUi(ctx);
  };
}
