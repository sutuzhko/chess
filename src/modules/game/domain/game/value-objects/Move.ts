import type { PieceType, PromotionPiece } from './PieceType.js';
import type { Square } from './Square.js';

export type MoveSpecial =
  | null
  | 'double-push'
  | 'en-passant'
  | 'castle-king'
  | 'castle-queen';

export class Move {
  constructor(
    readonly from: Square,
    readonly to: Square,
    readonly special: MoveSpecial = null,
    readonly promotion: PromotionPiece | null = null,
    readonly captured: PieceType | null = null,
  ) {}

  get isCapture(): boolean {
    return this.captured !== null;
  }

  get isPromotion(): boolean {
    return this.promotion !== null;
  }

  get isCastling(): boolean {
    return this.special === 'castle-king' || this.special === 'castle-queen';
  }

  get isEnPassant(): boolean {
    return this.special === 'en-passant';
  }

  get isDoublePush(): boolean {
    return this.special === 'double-push';
  }

  matches(from: Square, to: Square, promotion?: PromotionPiece | null): boolean {
    const promo = promotion ?? null;
    return this.from.equals(from) && this.to.equals(to) && this.promotion === promo;
  }

  equals(other: Move): boolean {
    return (
      this.from.equals(other.from) &&
      this.to.equals(other.to) &&
      this.special === other.special &&
      this.promotion === other.promotion &&
      this.captured === other.captured
    );
  }

  toUci(): string {
    const promoMap: Record<PromotionPiece, string> = {
      queen: 'q',
      rook: 'r',
      bishop: 'b',
      knight: 'n',
    };
    const promo = this.promotion ? promoMap[this.promotion] : '';
    return this.from.algebraic + this.to.algebraic + promo;
  }

  toString(): string {
    return this.toUci();
  }
}
