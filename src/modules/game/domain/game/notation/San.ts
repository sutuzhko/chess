import type { BoardSnapshot } from '@modules/game/domain/game/BoardSnapshot.js';
import { GameRules } from '@modules/game/domain/game/GameRules.js';
import { MoveGenerator } from '@modules/game/domain/game/MoveGenerator.js';
import {
  oppositeColor,
} from '@modules/game/domain/game/value-objects/Color.js';
import type { Move } from '@modules/game/domain/game/value-objects/Move.js';
import {
  isPromotionPiece,
  PIECE_LETTER,
  type PieceType,
  pieceTypeFromLetter,
  type PromotionPiece,
} from '@modules/game/domain/game/value-objects/PieceType.js';
import { Square } from '@modules/game/domain/game/value-objects/Square.js';

const pieceMoveLetter = (t: PieceType): string => (t === 'pawn' ? '' : PIECE_LETTER[t]);

const letterToPromotion = (letter: string): PromotionPiece | null => {
  const t = pieceTypeFromLetter(letter);
  return t && isPromotionPiece(t) ? t : null;
};

export const moveToSan = (before: BoardSnapshot, move: Move): string => {
  const piece = before.pieceAt(move.from);
  if (!piece) throw new Error(`No piece on ${move.from.algebraic}`);

  let san: string;
  if (move.special === 'castle-king') {
    san = 'O-O';
  } else if (move.special === 'castle-queen') {
    san = 'O-O-O';
  } else if (piece.type === 'pawn') {
    san = move.captured ? `${move.from.algebraic[0]}x${move.to.algebraic}` : move.to.algebraic;
    if (move.promotion) san += `=${PIECE_LETTER[move.promotion]}`;
  } else {
    let disambig = '';
    const legal = MoveGenerator.legalMoves(before);
    const peers = legal.filter(
      (m) =>
        !m.from.equals(move.from) &&
        m.to.equals(move.to) &&
        before.pieceAt(m.from)?.type === piece.type,
    );
    if (peers.length > 0) {
      const sameFile = peers.some((m) => m.from.file === move.from.file);
      const sameRank = peers.some((m) => m.from.rank === move.from.rank);
      if (!sameFile) disambig = move.from.algebraic[0] ?? '';
      else if (!sameRank) disambig = move.from.algebraic[1] ?? '';
      else disambig = move.from.algebraic;
    }
    san = `${pieceMoveLetter(piece.type)}${disambig}${move.captured ? 'x' : ''}${move.to.algebraic}`;
  }

  const after = before.apply(move);
  const opponent = oppositeColor(before.sideToMove);
  if (GameRules.isInCheck(after, opponent)) {
    const status = GameRules.status(after);
    san += status.kind === 'checkmate' ? '#' : '+';
  }
  return san;
};

const stripSuffix = (san: string): string => san.replace(/[+#!?]+$/, '');

export const sanToMove = (snap: BoardSnapshot, sanRaw: string): Move => {
  const san = stripSuffix(sanRaw.trim());
  const legal = MoveGenerator.legalMoves(snap);

  if (san === 'O-O' || san === '0-0') {
    const m = legal.find((mv) => mv.special === 'castle-king');
    if (!m) throw new Error(`Castling king-side not legal: ${sanRaw}`);
    return m;
  }
  if (san === 'O-O-O' || san === '0-0-0') {
    const m = legal.find((mv) => mv.special === 'castle-queen');
    if (!m) throw new Error(`Castling queen-side not legal: ${sanRaw}`);
    return m;
  }

  let body = san;
  let promotion: PromotionPiece | null = null;
  const eqIdx = body.indexOf('=');
  if (eqIdx >= 0) {
    const promoLetter = body[eqIdx + 1] ?? '';
    promotion = letterToPromotion(promoLetter);
    if (!promotion) throw new Error(`Invalid promotion in SAN: ${sanRaw}`);
    body = body.slice(0, eqIdx);
  }

  let pieceType: PieceType = 'pawn';
  let i = 0;
  if (body[0] && body[0] >= 'A' && body[0] <= 'Z' && !body.startsWith('O')) {
    const t = pieceTypeFromLetter(body[0]);
    if (t && t !== 'pawn') {
      pieceType = t;
      i = 1;
    }
  }

  let isCapture = false;
  let disambigFile: number | null = null;
  let disambigRank: number | null = null;
  let toSquare: Square | null = null;

  const rest = body.slice(i);
  const xIdx = rest.indexOf('x');
  let target = rest;
  if (xIdx >= 0) {
    isCapture = true;
    const before = rest.slice(0, xIdx);
    target = rest.slice(xIdx + 1);
    if (before.length === 1) {
      const bc = before[0] ?? '';
      if (bc >= 'a' && bc <= 'h') disambigFile = before.charCodeAt(0) - 97;
      else if (bc >= '1' && bc <= '8') disambigRank = Number(bc) - 1;
    } else if (before.length === 2) {
      disambigFile = before.charCodeAt(0) - 97;
      disambigRank = Number(before[1]) - 1;
    }
  } else if (rest.length > 2) {
    const head = rest.slice(0, rest.length - 2);
    target = rest.slice(rest.length - 2);
    if (head.length === 1) {
      const hc = head[0] ?? '';
      if (hc >= 'a' && hc <= 'h') disambigFile = head.charCodeAt(0) - 97;
      else if (hc >= '1' && hc <= '8') disambigRank = Number(hc) - 1;
    } else if (head.length === 2) {
      disambigFile = head.charCodeAt(0) - 97;
      disambigRank = Number(head[1]) - 1;
    }
  }
  toSquare = Square.fromAlgebraic(target);

  const candidates = legal.filter((m) => {
    const piece = snap.pieceAt(m.from);
    if (piece?.type !== pieceType) return false;
    if (!m.to.equals(toSquare)) return false;
    if (disambigFile !== null && m.from.file !== disambigFile) return false;
    if (disambigRank !== null && m.from.rank !== disambigRank) return false;
    if (promotion !== null && m.promotion !== promotion) return false;
    if (promotion === null && m.promotion !== null) return false;
    return !(isCapture && !m.isCapture && !m.isEnPassant);
    
  });

  if (candidates.length === 0) throw new Error(`No legal move matches SAN: ${sanRaw}`);
  if (candidates.length > 1) throw new Error(`Ambiguous SAN: ${sanRaw}`);
  const resolved = candidates[0];
  if (!resolved) throw new Error(`No legal move matches SAN: ${sanRaw}`);
  return resolved;
};
