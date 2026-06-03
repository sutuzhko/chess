/** Завершение партии шведок: мат с учётом дропов, фаза «спасения» на второй доске,
 *  определение проигравшей команды. См. docs/codebase/shvedki.md
 *
 *  Правило (custom-вариант проекта):
 *    1. На доске X получен «мат». Но это считается финальным только если ни
 * одной фигурой (любого типа, даже не имеющейся сейчас в резерве — потому что
 * её может перехватить партнёр на доске Y) нельзя перекрыть шах. Если
 * перекрыть можно — это ещё не финал и партия продолжается обычным порядком.
 *    2. Если это финальный мат — на доске Y начинается окно спасения длиной в
 *       RESCUE_PLIES_BUDGET полуходов. За это время кто-то на доске Y может
 * тоже поставить мат.
 *    3. Если за окно спасения на доске Y был поставлен мат:
 *       – по разным командам → «ничья» (обе команды получили мат);
 *       – по той же команде, что и на X (та же команда получила мат на обеих
 *         досках) → побеждает противоположная команда.
 *    4. Если за окно мата на Y не случилось — побеждает команда, поставившая
 *       первый финальный мат на доске X.
 *
 *  Запись `state.phase = { kind: 'last-move', boardId, color, plies }`
 * сохраняет:
 *    – `boardId` — доска, где идёт окно спасения (другая, не mateBoardId);
 *    – `color`   — цвет, получивший мат на mateBoardId; используется лишь для
 *                  подсчёта проигравшей команды через `teamOf(mateBoardId,
 * color)`;
 *    – `plies`   — сколько полуходов уже сделано в окне.
 */
import type { Color } from '@modules/game/domain/game';
import { GameRules } from '@modules/game/domain/game';
import type { BoardId, DualReserves } from '@modules/game/domain/shvedki';
import {
  PieceReserve,
  ShvedkiMoveGenerator,
} from '@modules/game/domain/shvedki';
import type {
  ShvedkiEndReason,
  ShvedkiGameResult,
  ShvedkiSerializableState,
} from './serialization.js';

/** Бюджет полуходов на «спасение» партии после первого финального мата. */
export const RESCUE_PLIES_BUDGET = 2;

/** Гипотетический резерв со всеми типами фигур — используется в `isFinalMate`,
 *  чтобы проверить, может ли хоть какая-то фигура из будущих захватов партнёра
 *  перекрыть шах на этой доске. */
const VIRTUAL_FULL_RESERVE: DualReserves = {
  white: PieceReserve.fromEntries([
    ['queen', 1], ['rook', 1], ['bishop', 1], ['knight', 1], ['pawn', 1],
  ]),
  black: PieceReserve.fromEntries([
    ['queen', 1], ['rook', 1], ['bishop', 1], ['knight', 1], ['pawn', 1],
  ]),
};

// Команда 1 = Белые·A + Чёрные·B. Команда 2 = Чёрные·A + Белые·B.
export function teamOf(boardId: BoardId, color: Color): 1 | 2 {
  if (boardId === 'A') return color === 'white' ? 1 : 2;
  return color === 'white' ? 2 : 1;
}

function otherBoard(boardId: BoardId): BoardId {
  return boardId === 'A' ? 'B' : 'A';
}

function resultForWinningTeam(team: 1 | 2): ShvedkiGameResult {
  return team === 1 ? 'team-1-wins' : 'team-2-wins';
}

export interface CheckGameEndArgs {
  state: ShvedkiSerializableState;
  movedBoardId: BoardId;
  /** Заголовок «Мат на доске X! Команда Y…» — приходит из app-слоя через i18n. */
  formatMateStatus: (movedBoardId: BoardId, otherBoardId: BoardId, losingTeam: 1 | 2) => string;
  onStatusUpdate: (text: string) => void;
  onLastMoveStarted?: (boardId: BoardId, color: Color) => void;
  onGameEnd?: (result: ShvedkiGameResult, reason: ShvedkiEndReason) => void;
}

/** Мутирует state.phase, state.mateBoardId и счётчик полуходов; вызывает callback'и. */
export function checkGameEnd(args: CheckGameEndArgs): void {
  const { state, movedBoardId, formatMateStatus, onStatusUpdate, onLastMoveStarted, onGameEnd } = args;

  if (state.phase.kind === 'last-move') {
    resolveRescueMove({ state, boardId: movedBoardId, onGameEnd });
    return;
  }
  if (state.phase.kind !== 'playing') return;

  if (!isFinalMate(state, movedBoardId)) return;

  const losingColor = state.dualBoard.snapshot(movedBoardId).sideToMove;
  const rescueBoardId = otherBoard(movedBoardId);
  state.mateBoardId = movedBoardId;
  state.phase = { kind: 'last-move', boardId: rescueBoardId, color: losingColor, plies: 0 };
  const losingTeam = teamOf(movedBoardId, losingColor);
  onStatusUpdate(formatMateStatus(movedBoardId, rescueBoardId, losingTeam));
  onLastMoveStarted?.(rescueBoardId, losingColor);

  // Граничный случай: на доске спасения у текущей стороны нет ни одного легального
  // хода (даже с её собственным резервом). Окно не может быть прожато — финализируем.
  if (!hasAnyShvedkiMove(state, rescueBoardId)) {
    resolveRescueMove({ state, boardId: rescueBoardId, onGameEnd });
  }
}

interface ResolveArgs {
  state: ShvedkiSerializableState;
  boardId: BoardId;
  onGameEnd: ((result: ShvedkiGameResult, reason: ShvedkiEndReason) => void) | undefined;
}

/** «Финальный» мат: сторона на ходу под шахом, не имеет ни одного легального
 *  обычного хода и не может перекрыть шах ни одной фигурой даже с виртуальным
 *  полным резервом (а значит и партнёр не сможет помочь дропом). */
export function isFinalMate(state: ShvedkiSerializableState, boardId: BoardId): boolean {
  const snap = state.dualBoard.snapshot(boardId);
  if (!GameRules.isInCheck(snap, snap.sideToMove)) return false;
  return ShvedkiMoveGenerator.legalMoves(snap, VIRTUAL_FULL_RESERVE).length === 0;
}

/** Есть ли у текущей стороны хотя бы один легальный ход с учётом её РЕАЛЬНОГО резерва. */
function hasAnyShvedkiMove(state: ShvedkiSerializableState, boardId: BoardId): boolean {
  const snap = state.dualBoard.snapshot(boardId);
  const reserves = state.dualBoard.reserves(boardId);
  return ShvedkiMoveGenerator.hasAnyMove(snap, reserves);
}

/** Стандартный мат с учётом текущего резерва доски Y (без виртуальных фигур). */
function isRescueBoardMate(state: ShvedkiSerializableState, boardId: BoardId): boolean {
  const snap = state.dualBoard.snapshot(boardId);
  if (!GameRules.isInCheck(snap, snap.sideToMove)) return false;
  return !hasAnyShvedkiMove(state, boardId);
}

function finalizeRescueOutcome(args: ResolveArgs, matedOnRescue: boolean): void {
  const { state, boardId, onGameEnd } = args;
  if (state.phase.kind !== 'last-move') return;
  const mateBoard = state.mateBoardId;
  const initialLosingColor = state.phase.color;
  if (!mateBoard) {
    state.phase = { kind: 'finished', result: 'draw' };
    onGameEnd?.('draw', 'draw');
    return;
  }

  const losingTeamOnX = teamOf(mateBoard, initialLosingColor);

  if (matedOnRescue) {
    const matedColorOnY = state.dualBoard.snapshot(boardId).sideToMove;
    const losingTeamOnY = teamOf(boardId, matedColorOnY);
    if (losingTeamOnX !== losingTeamOnY) {
      // Маты по разным командам — ничья.
      state.phase = { kind: 'finished', result: 'draw' };
      onGameEnd?.('draw', 'draw');
      return;
    }
    // Маты по одной и той же команде — побеждает другая команда.
    const winningTeam: 1 | 2 = losingTeamOnX === 1 ? 2 : 1;
    state.phase = { kind: 'finished', result: resultForWinningTeam(winningTeam) };
    onGameEnd?.(state.phase.result, 'mate');
    return;
  }

  // Спасения не случилось — побеждает команда, поставившая первый мат на X.
  const winningTeam: 1 | 2 = losingTeamOnX === 1 ? 2 : 1;
  state.phase = { kind: 'finished', result: resultForWinningTeam(winningTeam) };
  onGameEnd?.(state.phase.result, 'mate');
}

function resolveRescueMove(args: ResolveArgs): void {
  const { state, boardId } = args;
  if (state.phase.kind !== 'last-move' || state.phase.boardId !== boardId) return;

  const matedOnRescue = isRescueBoardMate(state, boardId);

  if (matedOnRescue) {
    finalizeRescueOutcome(args, true);
    return;
  }

  const nextPlies = (state.phase.plies ?? 0) + 1;
  if (nextPlies >= RESCUE_PLIES_BUDGET) {
    finalizeRescueOutcome(args, false);
    return;
  }

  // Окно ещё открыто — продолжаем играть на доске Y.
  state.phase = { ...state.phase, plies: nextPlies };
}
