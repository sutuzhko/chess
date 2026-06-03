import type { BoardSnapshot } from './BoardSnapshot.js';
import { type GameStatus } from './GameStatus.js';
import { MoveGenerator } from './MoveGenerator.js';
import { type Color, oppositeColor } from './value-objects/Color.js';

export class GameRules {
  static isInCheck(snap: BoardSnapshot, color: Color): boolean {
    const kingSq = snap.findKing(color);
    return MoveGenerator.isSquareAttacked(snap, kingSq, oppositeColor(color));
  }

  static status(snap: BoardSnapshot): GameStatus {
    const moves = MoveGenerator.legalMoves(snap);
    if (moves.length === 0) {
      if (GameRules.isInCheck(snap, snap.sideToMove)) {
        return { kind: 'checkmate', winner: oppositeColor(snap.sideToMove) };
      }
      return { kind: 'stalemate' };
    }
    if (snap.halfmoveClock >= 100) return { kind: 'draw-50-move' };
    if (GameRules.isInsufficientMaterial(snap)) {
      return { kind: 'draw-insufficient-material' };
    }
    return { kind: 'in-progress' };
  }

  static isInsufficientMaterial(snap: BoardSnapshot): boolean {
    let whiteMinors = 0;
    let blackMinors = 0;
    let whiteBishopOnLight = false;
    let whiteBishopOnDark = false;
    let blackBishopOnLight = false;
    let blackBishopOnDark = false;
    for (const { square, piece } of snap.pieces()) {
      switch (piece.type) {
        case 'king':
          break;
        case 'pawn':
        case 'rook':
        case 'queen':
          return false;
        case 'knight':
          if (piece.color === 'white') whiteMinors++;
          else blackMinors++;
          if (whiteMinors > 1 || blackMinors > 1) return false;
          break;
        case 'bishop': {
          const light = (square.file + square.rank) % 2 === 0;
          if (piece.color === 'white') {
            whiteMinors++;
            if (light) whiteBishopOnLight = true;
            else whiteBishopOnDark = true;
          } else {
            blackMinors++;
            if (light) blackBishopOnLight = true;
            else blackBishopOnDark = true;
          }
          break;
        }
      }
    }
    if (whiteMinors === 0 && blackMinors === 0) return true;
    if (whiteMinors === 1 && blackMinors === 0) return true;
    if (whiteMinors === 0 && blackMinors === 1) return true;
    if (whiteMinors === 1 && blackMinors === 1) {
      const whiteBishopOnly =
        (whiteBishopOnLight ? 1 : 0) + (whiteBishopOnDark ? 1 : 0) === 1;
      const blackBishopOnly =
        (blackBishopOnLight ? 1 : 0) + (blackBishopOnDark ? 1 : 0) === 1;
      if (whiteBishopOnly && blackBishopOnly) {
        const sameColor =
          (whiteBishopOnLight && blackBishopOnLight) ||
          (whiteBishopOnDark && blackBishopOnDark);
        if (sameColor) return true;
      }
    }
    return false;
  }
}
