import { applyUciMove, uciToSan } from '@modules/game/application';
import type { Move } from '@modules/game/domain/game';

export interface PuzzleAttempt {
  /** Порядковый номер попытки (1..N). */
  readonly index: number;
  readonly uci: string;
  readonly san: string;
  /** true — принят, false — провал/отклонён. */
  readonly ok: boolean;
}

export interface SessionLike {
  readonly puzzle: { readonly fen: string };
  readonly movesPlayed: readonly Move[];
}

/** Стейтлесс-хелперы для конвертации UCI → SAN в контексте текущей сессии. */
export function preFenBeforeLastMove(session: SessionLike): string {
  const moves = session.movesPlayed;
  let fen = session.puzzle.fen;
  for (let i = 0; i < moves.length - 1; i++) {
    const m = moves[i];
    if (!m) continue;
    try { fen = applyUciMove(fen, m.toUci()); } catch { /* skip */ }
  }
  return fen;
}

export function currentSessionFen(session: SessionLike): string {
  let fen = session.puzzle.fen;
  for (const m of session.movesPlayed) {
    try { fen = applyUciMove(fen, m.toUci()); } catch { /* skip */ }
  }
  return fen;
}

export function makeAttempt(
  list: PuzzleAttempt[],
  uci: string,
  ok: boolean,
  preFen: string,
): PuzzleAttempt {
  let san = uci;
  try { san = uciToSan(preFen, uci); } catch { /* нелегальный — оставим UCI */ }
  return { index: list.length + 1, uci, san, ok };
}
