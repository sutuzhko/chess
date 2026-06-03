/** Service-store для use-cases. См. docs/codebase/service-stores.md */
import {
  GetLegalMovesUseCase,
  MakeMoveUseCase,
  RedoMoveUseCase,
  StartMatchUseCase,
  UndoMoveUseCase,
} from '@modules/game/application';
import {
  ForfeitMatchUseCase,
} from '@modules/game/application/use-cases/ForfeitMatch.js';
import {
  RequestBestMoveUseCase,
} from '@modules/game/application/use-cases/RequestBestMove.js';
import {
  ResignMatchUseCase,
} from '@modules/game/application/use-cases/ResignMatch.js';
import { defineStore } from 'pinia';
import { computed } from 'vue';
import { useEngineService } from './engine.js';
import { useEventBusService } from './event-bus.js';
import { usePersistenceService } from './persistence.js';

export const useUseCasesService = defineStore('services/use-cases', () => {
  const engineSvc = useEngineService();
  const busSvc = useEventBusService();
  const persistSvc = usePersistenceService();

  const startMatch = computed(() => new StartMatchUseCase(persistSvc.persistence().matchRepository));
  const makeMove = computed(() => new MakeMoveUseCase(persistSvc.persistence().matchRepository, busSvc.eventBus()));
  const undoMove = computed(() => new UndoMoveUseCase(persistSvc.persistence().matchRepository, busSvc.eventBus()));
  const redoMove = computed(() => new RedoMoveUseCase(persistSvc.persistence().matchRepository, busSvc.eventBus()));
  const getLegalMoves = computed(() => new GetLegalMovesUseCase(persistSvc.persistence().matchRepository));
  const forfeitMatch = computed(() => new ForfeitMatchUseCase(persistSvc.persistence().matchRepository, busSvc.eventBus()));
  const resignMatch = computed(() => new ResignMatchUseCase(persistSvc.persistence().matchRepository, busSvc.eventBus()));
  const requestBest = computed(() => new RequestBestMoveUseCase(
    persistSvc.persistence().matchRepository,
    engineSvc.engine(),
    busSvc.eventBus(),
  ));

  return {
    startMatch,
    makeMove,
    undoMove,
    redoMove,
    getLegalMoves,
    forfeitMatch,
    resignMatch,
    requestBest,
  };
});
