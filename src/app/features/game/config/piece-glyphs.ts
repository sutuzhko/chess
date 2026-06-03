import type {
  PieceType,
} from '@modules/game/domain/game/value-objects/PieceType.js';
import { figureUrl } from '@shared/config/asset-path.js';

export function pieceImageSrc(type: PieceType, color: 'white' | 'black'): string {
  return figureUrl(`${type}-${color}`);
}

export const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0,
} as const;

export const PIECE_SORT_ORDER: Record<PieceType, number> = {
  queen: 0,
  rook: 1,
  bishop: 2,
  knight: 3,
  pawn: 4,
  king: 5,
} as const;
