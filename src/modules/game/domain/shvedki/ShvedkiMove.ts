import type { Move, PieceType, Square } from '@modules/game/domain/game';
import {
  PIECE_LETTER,
} from '@modules/game/domain/game/value-objects/PieceType.js';

type ReservePieceType = Exclude<PieceType, 'king'>;

export type ShvedkiMove =
  | { readonly kind: 'normal'; readonly move: Move }
  | { readonly kind: 'drop'; readonly piece: ReservePieceType; readonly to: Square };

export const shvedkiMoveToUci = (m: ShvedkiMove): string =>
  m.kind === 'normal' ? m.move.toUci() : `${PIECE_LETTER[m.piece]}@${m.to.algebraic}`;

export const shvedkiMoveEquals = (a: ShvedkiMove, b: ShvedkiMove): boolean => {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'normal' && b.kind === 'normal') return a.move.equals(b.move);
  if (a.kind === 'drop' && b.kind === 'drop') {
    return a.piece === b.piece && a.to.equals(b.to);
  }
  return false;
};
