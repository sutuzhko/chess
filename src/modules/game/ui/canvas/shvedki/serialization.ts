/** Сериализация/восстановление состояния шведок. Отдельный файл — чтобы контроллер не пух. */
import type { Color, PieceType } from '@modules/game/domain/game';
import { BoardSnapshot } from '@modules/game/domain/game';
import type { BoardId } from '@modules/game/domain/shvedki';
import { DualBoard, PieceReserve } from '@modules/game/domain/shvedki';
import type {
  SerializedShvedkiState,
} from '@modules/game/infrastructure/persistence/ShvedkiStateStore.js';

export type ShvedkiGameResult = 'team-1-wins' | 'team-2-wins' | 'draw';

/** Причина завершения партии — нужна для текста в модалке «Конец игры». */
export type ShvedkiEndReason = 'mate' | 'resign' | 'time' | 'draw';

export type ShvedkiGamePhase =
  | { readonly kind: 'playing' }
  | {
      readonly kind: 'last-move';
      /** Доска, на которой делается «спасательный» ход. */
      readonly boardId: BoardId;
      /** Цвет, получивший мат на mateBoardId — для определения проигравшей команды. */
      readonly color: Color;
      /** Сколько полуходов уже сделано в фазе спасения. По умолчанию 0 — для совместимости со старыми сейвами. */
      readonly plies?: number;
    }
  | { readonly kind: 'finished'; readonly result: ShvedkiGameResult };

export interface ShvedkiMoveRecord {
  readonly boardId: BoardId;
  readonly color: Color;
  readonly san: string;
  readonly index: number;
}

export interface ShvedkiSerializableState {
  dualBoard: DualBoard;
  capturedByA: { white: PieceType[]; black: PieceType[] };
  capturedByB: { white: PieceType[]; black: PieceType[] };
  movesA: ShvedkiMoveRecord[];
  movesB: ShvedkiMoveRecord[];
  mateBoardId: BoardId | null;
  phase: ShvedkiGamePhase;
}

export function serializeShvedki(state: ShvedkiSerializableState): SerializedShvedkiState {
  const stateA = state.dualBoard.snapshot('A');
  const stateB = state.dualBoard.snapshot('B');
  const resA = state.dualBoard.reserves('A');
  const resB = state.dualBoard.reserves('B');
  const phase: SerializedShvedkiState['phase'] =
    state.phase.kind === 'playing' ? { kind: 'playing' }
    : state.phase.kind === 'last-move'
      ? {
          kind: 'last-move',
          boardId: state.phase.boardId,
          color: state.phase.color,
          plies: state.phase.plies ?? 0,
        }
      : { kind: 'finished', result: state.phase.result };
  return {
    version: 1,
    fenA: stateA.toFen(),
    fenB: stateB.toFen(),
    reservesA: {
      white: resA.white.entries().map(([t, c]) => [t, c]),
      black: resA.black.entries().map(([t, c]) => [t, c]),
    },
    reservesB: {
      white: resB.white.entries().map(([t, c]) => [t, c]),
      black: resB.black.entries().map(([t, c]) => [t, c]),
    },
    capturedByA: { white: [...state.capturedByA.white], black: [...state.capturedByA.black] },
    capturedByB: { white: [...state.capturedByB.white], black: [...state.capturedByB.black] },
    movesA: [...state.movesA],
    movesB: [...state.movesB],
    mateBoardId: state.mateBoardId,
    phase,
  };
}

export function restoreShvedki(data: SerializedShvedkiState): ShvedkiSerializableState {
  const snapA = BoardSnapshot.fromFen(data.fenA);
  const snapB = BoardSnapshot.fromFen(data.fenB);
  const dualBoard = DualBoard.initial();
  dualBoard.setSnapshot('A', snapA);
  dualBoard.setSnapshot('B', snapB);
  dualBoard.setReserves('A', {
    white: PieceReserve.fromEntries(data.reservesA.white),
    black: PieceReserve.fromEntries(data.reservesA.black),
  });
  dualBoard.setReserves('B', {
    white: PieceReserve.fromEntries(data.reservesB.white),
    black: PieceReserve.fromEntries(data.reservesB.black),
  });

  let phase: ShvedkiGamePhase;
  if (data.phase.kind === 'playing') phase = { kind: 'playing' };
  else if (data.phase.kind === 'last-move' && data.phase.boardId && data.phase.color) {
    phase = {
      kind: 'last-move',
      boardId: data.phase.boardId,
      color: data.phase.color,
      plies: typeof data.phase.plies === 'number' ? data.phase.plies : 0,
    };
  } else if (data.phase.kind === 'finished' && data.phase.result) {
    phase = { kind: 'finished', result: data.phase.result };
  } else {
    phase = { kind: 'playing' };
  }

  return {
    dualBoard,
    capturedByA: { white: [...data.capturedByA.white], black: [...data.capturedByA.black] },
    capturedByB: { white: [...data.capturedByB.white], black: [...data.capturedByB.black] },
    movesA: [...data.movesA],
    movesB: [...data.movesB],
    mateBoardId: data.mateBoardId,
    phase,
  };
}
