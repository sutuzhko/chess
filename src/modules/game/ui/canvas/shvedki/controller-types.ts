import type { Color, PieceType } from '@modules/game/domain/game';
import type { BoardId } from '@modules/game/domain/shvedki';
import type { BoardDisplayOptions } from '../BoardController.js';
import type { BoardView } from '../BoardView.js';
import type { InputController } from '../InputController.js';
import type {
  ShvedkiEndReason,
  ShvedkiGameResult,
  ShvedkiMoveRecord,
} from './serialization.js';

export interface ShvedkiCaptureMap {
  readonly whiteA: PieceType[];
  readonly blackA: PieceType[];
  readonly whiteB: PieceType[];
  readonly blackB: PieceType[];
}

export interface ShvedkiBoardControllerOptions {
  readonly viewA: BoardView;
  readonly viewB: BoardView;
  readonly inputA: InputController;
  readonly inputB: InputController;
  readonly canvasA: HTMLCanvasElement;
  readonly orientation: () => 'white' | 'black';
  readonly reserveAWhiteEl: () => HTMLElement | null;
  readonly reserveABlackEl: () => HTMLElement | null;
  readonly reserveBWhiteEl: () => HTMLElement | null;
  readonly reserveBBlackEl: () => HTMLElement | null;
  readonly onStatusUpdate: (status: string) => void;
  readonly onTurnUpdate: (aTurn: Color, bTurn: Color) => void;
  readonly onMoveMade?: (boardId: BoardId, movedColor: Color) => void;
  readonly onGameEnd?: (result: ShvedkiGameResult, reason: ShvedkiEndReason) => void;
  readonly onLastMoveStarted?: (boardId: BoardId, color: Color) => void;
  readonly onCapturesChanged?: (captures: ShvedkiCaptureMap) => void;
  readonly onMovesChanged?: (movesA: ShvedkiMoveRecord[], movesB: ShvedkiMoveRecord[]) => void;
  /** Сообщение о нелегальном drop'е — для toast'а. Текст приходит из app/i18n. */
  readonly onIllegalDrop: (reason: string) => void;
  /** Форматтер «Мат на доске {X}…» — должен прийти из app-слоя через $t. */
  readonly formatMateStatus: (movedBoardId: BoardId, otherBoardId: BoardId, losingTeam: 1 | 2) => string;
  /** Форматтер статуса «Доска A: Белые ходят · Доска B: …» — должен прийти из app-слоя через $t. */
  readonly formatPlayingStatus: (aSide: Color, bSide: Color) => string;
  /** Цвет AI на заданной доске, либо null если AI там не играет. */
  readonly aiColorOnBoard?: (boardId: BoardId) => Color | null;
  readonly displayOptions?: () => BoardDisplayOptions;
}
