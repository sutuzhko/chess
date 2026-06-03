import { BoardSnapshot, MoveGenerator } from '@modules/game/domain/game';
import { moveToSan } from '@modules/game/domain/game/notation/San.js';

/**
 * Opaque handle to a parsed board position.
 * UI code passes this back to canvas/render helpers without inspecting the
 * shape.
 */
export type SnapshotHandle = BoardSnapshot;

export function snapshotFromFen(fen: string): SnapshotHandle {
  return BoardSnapshot.fromFen(fen);
}

export interface ParsedFen {
  readonly fen: string;
  readonly sideToMove: 'white' | 'black';
}

export interface FenSquare {
  readonly file: number;
  readonly rank: number;
  readonly piece: { color: 'white' | 'black'; type: string } | null;
}

/**
 * Validates a FEN string and returns light-weight UI-safe data.
 * Throws on invalid FEN — callers should wrap in try/catch.
 */
export function parseFen(fen: string): ParsedFen {
  const snap = BoardSnapshot.fromFen(fen);
  return { fen, sideToMove: snap.sideToMove };
}

export function isFenValid(fen: string): boolean {
  try {
    BoardSnapshot.fromFen(fen);
    return true;
  } catch {
    return false;
  }
}

/**
 * Applies a UCI move (e.g. "e2e4", "e7e8q") to a FEN and returns the resulting
 * FEN. Stateless — lets the Vue shell navigate positions without touching the
 * domain. Throws if the move is not legal in the given position.
 */
export function applyUciMove(fen: string, uci: string): string {
  const snap = BoardSnapshot.fromFen(fen);
  const move = MoveGenerator.legalMoves(snap).find((m) => m.toUci() === uci);
  if (!move) throw new Error(`Illegal move "${uci}" for FEN "${fen}"`);
  return snap.apply(move).toFen();
}

/**
 * Воспроизводит цепочку UCI-ходов от стартовой FEN-позиции и возвращает
 * массив непрозрачных снапшотов (включая стартовый) для пошаговой визуализации.
 * Игнорирует нелегальные ходы — прерывает воспроизведение на первой ошибке
 * и возвращает уже накопленные снапшоты. UI-слой может рендерить snap[i] для
 * кадра i (0 — исходная позиция).
 */
/**
 * Конвертирует UCI в SAN относительно заданной FEN-позиции.
 * Бросает, если ход нелегален. Используется UI-слоем для красивого отображения
 * истории ходов без вытаскивания доменных типов в `src/app`.
 */
export function uciToSan(fen: string, uci: string): string {
  const snap = BoardSnapshot.fromFen(fen);
  const move = MoveGenerator.legalMoves(snap).find((m) => m.toUci() === uci);
  if (!move) throw new Error(`Illegal move "${uci}" for FEN "${fen}"`);
  return moveToSan(snap, move);
}

export function replayPv(fen: string, uciLine: readonly string[]): readonly SnapshotHandle[] {
  let snap = BoardSnapshot.fromFen(fen);
  const out: SnapshotHandle[] = [snap];
  for (const uci of uciLine) {
    const move = MoveGenerator.legalMoves(snap).find((m) => m.toUci() === uci);
    if (!move) break;
    snap = snap.apply(move);
    out.push(snap);
  }
  return out;
}
