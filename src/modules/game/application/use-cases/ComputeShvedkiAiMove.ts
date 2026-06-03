import {
  pickWeighted,
  sideToMoveFromFen,
} from '@modules/game/application/opening-weighting.js';
import type {
  OpeningSource,
} from '@modules/game/application/ports/OpeningSource.js';
import { parseUci } from '@modules/game/application/uci.js';
import type { BoardSnapshot, Color } from '@modules/game/domain/game';
import { MoveGenerator } from '@modules/game/domain/game';
import type { DualReserves, ShvedkiMove } from '@modules/game/domain/shvedki';
import type {
  ShvedkiBestMoveResult,
  ShvedkiEngineAdapter,
} from '@modules/game/infrastructure/engine/shvedki';

export interface ComputeShvedkiAiMoveInput {
  readonly snap: BoardSnapshot;
  readonly reserves: DualReserves;
  readonly aiColor: Color;
  readonly profile: {
    readonly depth: number;
    readonly multiPV: number;
    readonly temperature: number;
    readonly noiseCP: number;
    readonly blunderProb: number;
  };
}

/**
 * Гибридный выбор хода для AI в шведках:
 * 1. Master book — пытаемся только если резервы пусты с обеих сторон
 *    (партия в чистом дебюте, без шведочной динамики).
 * 2. ShvedkiEngineAdapter — всегда, если книга не сработала.
 *
 * Возвращает `null` если в позиции нет ни одного легального хода
 * (мат/пат — терминальное состояние).
 */
export class ComputeShvedkiAiMoveUseCase {
  constructor(
    private readonly engine: ShvedkiEngineAdapter,
    private readonly book: OpeningSource | null = null,
  ) {}

  async execute(input: ComputeShvedkiAiMoveInput): Promise<ShvedkiBestMoveResult | null> {
    const { snap, reserves } = input;
    const reservesEmpty = reserves.white.isEmpty() && reserves.black.isEmpty();

    if (this.book && reservesEmpty) {
      const bookMove = await this.tryBook(snap);
      if (bookMove) return bookMove;
    }

    return this.engine.bestMove({
      snap,
      reserves,
      profile: input.profile,
    });
  }

  private async tryBook(snap: BoardSnapshot): Promise<ShvedkiBestMoveResult | null> {
    if (!this.book) return null;
    try {
      const fen = snap.toFen();
      const moves = await this.book.movesAt(fen);
      const pickedUci = pickWeighted(moves, sideToMoveFromFen(fen));
      if (!pickedUci) return null;
      const parsed = parseUci(pickedUci);
      const legal = MoveGenerator.legalMoves(snap).find((m) =>
        m.matches(parsed.from, parsed.to, parsed.promotion ?? null),
      );
      if (!legal) return null;
      const move: ShvedkiMove = { kind: 'normal', move: legal };
      return { move, score: 0 };
    } catch {
      return null;
    }
  }
}
