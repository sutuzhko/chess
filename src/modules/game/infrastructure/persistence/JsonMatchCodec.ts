import type { MoveMade, PromotionPiece } from '@modules/game/domain/game';
import {
  BoardSnapshot,
  isTerminal,
  Match,
  Square,
} from '@modules/game/domain/game';

export interface SerializedMatch {
  readonly version: 1;
  readonly id: string;
  readonly initialFen: string;
  readonly movesUci: readonly string[];
  readonly cursor: number;
  readonly savedAt?: string;
  readonly isFinished?: boolean;
}

const PROMO_TO_LETTER: Record<PromotionPiece, string> = {
  queen: 'q',
  rook: 'r',
  bishop: 'b',
  knight: 'n',
};

const LETTER_TO_PROMO: Record<string, PromotionPiece> = {
  q: 'queen',
  r: 'rook',
  b: 'bishop',
  n: 'knight',
};

export class JsonMatchCodec {
  static serialize(match: Match): SerializedMatch {
    const initialFen = match.timeline.entryAt(0).snapshot.toFen();
    const moves: string[] = [];
    for (let i = 1; i < match.timeline.length; i++) {
      const entry = match.timeline.entryAt(i);
      const moveEvent = entry.events.find((e): e is MoveMade => e.type === 'MoveMade');
      if (!moveEvent) throw new Error(`Timeline entry ${i} has no MoveMade event`);
      let uci = moveEvent.move.from.algebraic + moveEvent.move.to.algebraic;
      if (moveEvent.move.promotion) uci += PROMO_TO_LETTER[moveEvent.move.promotion];
      moves.push(uci);
    }
    return {
      version: 1,
      id: match.id,
      initialFen,
      movesUci: moves,
      cursor: match.timeline.currentIndex,
      isFinished: isTerminal(match.status),
    };
  }

  static deserialize(data: SerializedMatch): Match {
    if ((data.version as number) !== 1) {
      throw new Error(`Unsupported serialization version: ${String(data.version)}`);
    }
    const initial = BoardSnapshot.fromFen(data.initialFen);
    const match = Match.start(data.id, initial);
    for (const uci of data.movesUci) {
      const from = Square.fromAlgebraic(uci.slice(0, 2));
      const to = Square.fromAlgebraic(uci.slice(2, 4));
      const promoLetter = uci[4];
      const promotion = promoLetter ? LETTER_TO_PROMO[promoLetter] : undefined;
      match.applyMove(
        promotion ? { from, to, promotion } : { from, to },
      );
    }
    if (data.cursor < 0 || data.cursor >= match.timeline.length) {
      throw new Error(`Invalid cursor: ${data.cursor}`);
    }
    if (data.cursor !== match.timeline.currentIndex) {
      match.jumpTo(data.cursor);
    }
    return match;
  }
}
