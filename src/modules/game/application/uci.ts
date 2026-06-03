import type { PromotionPiece } from '@modules/game/domain/game';
import { Square } from '@modules/game/domain/game';

const PROMO_MAP: Record<string, PromotionPiece> = {
  q: 'queen',
  r: 'rook',
  b: 'bishop',
  n: 'knight',
};

export interface UciMove {
  from: Square;
  to: Square;
  promotion?: PromotionPiece;
}

export const parseUci = (uci: string): UciMove => {
  if (uci.length < 4 || uci.length > 5) {
    throw new Error(`Invalid UCI move: "${uci}"`);
  }
  const from = Square.fromAlgebraic(uci.slice(0, 2));
  const to = Square.fromAlgebraic(uci.slice(2, 4));
  if (uci.length === 5) {
    const promo = PROMO_MAP[uci[4] ?? ''];
    if (!promo) throw new Error(`Invalid promotion in UCI: "${uci}"`);
    return { from, to, promotion: promo };
  }
  return { from, to };
};
