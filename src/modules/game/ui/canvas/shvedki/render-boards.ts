import type { Color, Move, PieceType, Square } from '@modules/game/domain/game';
import { GameRules, MoveGenerator } from '@modules/game/domain/game';
import type { BoardId, DualBoard } from '@modules/game/domain/shvedki';
import type { BoardDisplayOptions } from '../BoardController.js';
import type { BoardView } from '../BoardView.js';
import { renderReservoir } from './reservoir-renderer.js';
import type { ShvedkiGamePhase } from './serialization.js';

export interface RenderBoardsArgs {
  readonly dualBoard: DualBoard;
  readonly viewA: BoardView;
  readonly viewB: BoardView;
  readonly selectedA: Square | null;
  readonly selectedB: Square | null;
  readonly lastMoveA: Move | null;
  readonly lastMoveB: Move | null;
  readonly display: BoardDisplayOptions;
}

export function renderBoards(args: RenderBoardsArgs): { snapA: ReturnType<DualBoard['snapshot']>; snapB: ReturnType<DualBoard['snapshot']> } {
  const { dualBoard, viewA, viewB, selectedA, selectedB, lastMoveA, lastMoveB, display } = args;
  const snapA = dualBoard.snapshot('A');
  const snapB = dualBoard.snapshot('B');

  viewA.render({
    snapshot: snapA,
    selected: selectedA,
    legalDestinations: selectedA
      ? MoveGenerator.legalMoves(snapA).filter((m) => m.from.equals(selectedA))
      : [],
    lastMove: lastMoveA,
    checkSquare: GameRules.isInCheck(snapA, snapA.sideToMove) ? snapA.findKing(snapA.sideToMove) : null,
    orientation: 'white',
    showCoordinates: display.showCoordinates,
    showLastMove: display.showLastMove,
    showHints: display.showHints,
  });
  viewB.render({
    snapshot: snapB,
    selected: selectedB,
    legalDestinations: selectedB
      ? MoveGenerator.legalMoves(snapB).filter((m) => m.from.equals(selectedB))
      : [],
    lastMove: lastMoveB,
    checkSquare: GameRules.isInCheck(snapB, snapB.sideToMove) ? snapB.findKing(snapB.sideToMove) : null,
    orientation: 'black',
    showCoordinates: display.showCoordinates,
    showLastMove: display.showLastMove,
    showHints: display.showHints,
  });

  return { snapA, snapB };
}

export interface RenderReservesArgs {
  readonly dualBoard: DualBoard;
  readonly phase: ShvedkiGamePhase;
  readonly dropPending: { boardId: BoardId; piece: PieceType } | null;
  readonly reserveAWhiteEl: HTMLElement | null;
  readonly reserveABlackEl: HTMLElement | null;
  readonly reserveBWhiteEl: HTMLElement | null;
  readonly reserveBBlackEl: HTMLElement | null;
  readonly isHumanColor: (boardId: BoardId, color: Color) => boolean;
  readonly onPick: (boardId: BoardId, piece: PieceType) => void;
}

export function renderReserves(args: RenderReservesArgs): void {
  const pairs: { el: HTMLElement | null; boardId: BoardId; side: Color }[] = [
    { el: args.reserveAWhiteEl, boardId: 'A', side: 'white' },
    { el: args.reserveABlackEl, boardId: 'A', side: 'black' },
    { el: args.reserveBWhiteEl, boardId: 'B', side: 'white' },
    { el: args.reserveBBlackEl, boardId: 'B', side: 'black' },
  ];
  for (const { el, boardId, side } of pairs) {
    if (!el) continue;
    renderReservoir({
      panelEl: el,
      boardId, side,
      dualBoard: args.dualBoard,
      phase: args.phase,
      dropPending: args.dropPending,
      isHumanColor: args.isHumanColor,
      onPick: (piece) => { args.onPick(boardId, piece); },
    });
  }
}
