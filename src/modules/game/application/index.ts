export type { EventBus, EventHandler, Unsubscribe } from '@shared/types/EventBus.js';
export type { MatchRepository } from './ports/MatchRepository.js';
export { OpeningBook } from './opening-book.js';
export type { OpeningDef, BookMove, LineStep, PrecomputedBook } from './opening-book.js';
export type { OpeningSource } from './ports/OpeningSource.js';
export {
  pickWeighted,
  sideToMoveFromFen,
  type Rng,
  type SideToMove,
} from './opening-weighting.js';
export {
  toTheoryMoves,
  DEFAULT_THEORY_FILTER,
  type RawMasterMove,
  type TheoryFilterOptions,
} from './opening-theory.js';
export { GetLegalMovesUseCase } from './use-cases/GetLegalMoves.js';
export { MakeMoveUseCase, type MakeMoveInput } from './use-cases/MakeMove.js';
export { RedoMoveUseCase } from './use-cases/RedoMove.js';
export { StartMatchUseCase, type StartMatchInput } from './use-cases/StartMatch.js';
export { UndoMoveUseCase } from './use-cases/UndoMove.js';
export {
  RankShvedkiDropsUseCase,
  BuildFenAfterShvedkiDropUseCase,
  type RankedDrop,
} from './use-cases/RankShvedkiDrops.js';
export {
  ComputeShvedkiAiMoveUseCase,
  type ComputeShvedkiAiMoveInput,
} from './use-cases/ComputeShvedkiAiMove.js';
export type {
  PuzzleRepository,
  PuzzleListFilter,
} from './ports/PuzzleRepository.js';
export { StartPuzzleSessionUseCase } from './use-cases/StartPuzzleSession.js';
export { SubmitPuzzleMoveUseCase } from './use-cases/SubmitPuzzleMove.js';
export { GetPuzzleHintUseCase } from './use-cases/GetPuzzleHint.js';
export { ListPuzzlesUseCase } from './use-cases/ListPuzzles.js';
export {
  SaveCustomPuzzleUseCase,
  DeleteCustomPuzzleUseCase,
} from './use-cases/SaveCustomPuzzle.js';
export {
  SolvePuzzleUseCase,
  type SolvePuzzleInput,
  type SolvePuzzleResult,
} from './use-cases/SolvePuzzle.js';
export {
  OBJECTIVE_KIND,
  type ObjectiveKind,
  type PuzzleObjective,
} from '@modules/game/domain/puzzles';
export {
  parseFen,
  isFenValid,
  applyUciMove,
  replayPv,
  uciToSan,
  snapshotFromFen,
  type ParsedFen,
  type FenSquare,
  type SnapshotHandle,
} from './fen.js';
export {
  PUZZLE_SOURCE,
  PUZZLE_STATUS,
  OPPONENT_MODE,
  type PuzzleSource,
  type PuzzleStatus,
  type OpponentMode,
} from '@modules/game/domain/puzzles';
