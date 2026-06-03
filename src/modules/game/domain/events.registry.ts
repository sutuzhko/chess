/** Реестр доменных событий модуля game. См. docs/codebase/domain-events.md */
import type { AnalysisCompleted } from './analysis/events/AnalysisCompleted.js';

import type { AnalysisStarted } from './analysis/events/AnalysisStarted.js';
import type { EvaluationUpdated } from './analysis/events/EvaluationUpdated.js';
import type { CheckDeclared } from './game/events/CheckDeclared.js';
import type { MatchEnded } from './game/events/MatchEnded.js';
import type { MoveMade } from './game/events/MoveMade.js';
import type { PawnPromoted } from './game/events/PawnPromoted.js';
import type { UndoMoveMade } from './game/events/UndoMoveMade.js';
import type {
  PuzzleAwaitingOpponent,
} from './puzzles/events/PuzzleAwaitingOpponent.js';
import type { PuzzleFailed } from './puzzles/events/PuzzleFailed.js';
import type {
  PuzzleHintRevealed,
} from './puzzles/events/PuzzleHintRevealed.js';

import type {
  PuzzleMoveAccepted,
} from './puzzles/events/PuzzleMoveAccepted.js';
import type {
  PuzzleMoveRejected,
} from './puzzles/events/PuzzleMoveRejected.js';
import type {
  PuzzleOpponentReplied,
} from './puzzles/events/PuzzleOpponentReplied.js';
import type { PuzzleSolved } from './puzzles/events/PuzzleSolved.js';

declare module '../../../shared/types/EventBus.js' {
  interface DomainEventMap {
    MoveMade: MoveMade;
    UndoMoveMade: UndoMoveMade;
    CheckDeclared: CheckDeclared;
    PawnPromoted: PawnPromoted;
    MatchEnded: MatchEnded;

    AnalysisStarted: AnalysisStarted;
    AnalysisCompleted: AnalysisCompleted;
    EvaluationUpdated: EvaluationUpdated;

    PuzzleMoveAccepted: PuzzleMoveAccepted;
    PuzzleMoveRejected: PuzzleMoveRejected;
    PuzzleOpponentReplied: PuzzleOpponentReplied;
    PuzzleSolved: PuzzleSolved;
    PuzzleFailed: PuzzleFailed;
    PuzzleHintRevealed: PuzzleHintRevealed;
    PuzzleAwaitingOpponent: PuzzleAwaitingOpponent;
  }
}

export {};
