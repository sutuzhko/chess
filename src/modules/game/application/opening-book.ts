import type {
  Move,
  PieceType,
  PromotionPiece,
} from '@modules/game/domain/game';
import { BoardSnapshot, MoveGenerator } from '@modules/game/domain/game';

/** Curated дебют. Линии — в человеко-читаемом SAN ("e4 e5 Nf3 Nc6 Bc4"). */
export interface OpeningDef {
  readonly eco?: string;
  readonly name: string;
  /** Основная линия — на неё прыгает доска при выборе дебюта. */
  readonly moves: string;
  /** Дополнительные линии для дерева вариантов и AI-книги. */
  readonly variations?: readonly string[];
}

export interface BookMove {
  readonly uci: string;
  readonly san: string;
  /** [white, draw, black] процент побед (сумма ≈ 100). Отсутствует, если статистика недоступна. */
  readonly wdl?: readonly [number, number, number];
  /** Сколько партий стоит за статистикой. У curated-ходов отсутствует. */
  readonly games?: number;
  /** Средний рейтинг игроков партий. Отсутствует, если неизвестен. */
  readonly rating?: number;
}

export interface LineStep {
  readonly uci: string;
  readonly san: string;
  readonly fen: string;
}

/** Сериализованная книга дебютов. См. docs/codebase/openings.md. */
export interface PrecomputedBook {
  readonly names: Readonly<Record<string, string>>;
  readonly responses: Readonly<Record<string, Readonly<Record<string, string>>>>;
}

const PIECE_LETTER: Readonly<Record<string, PieceType>> = {
  K: 'king',
  Q: 'queen',
  R: 'rook',
  B: 'bishop',
  N: 'knight',
};

const PROMO_LETTER: Readonly<Record<string, PromotionPiece>> = {
  Q: 'queen',
  R: 'rook',
  B: 'bishop',
  N: 'knight',
};

function positionKeyOf(fen: string): string {
  return fen.split(' ').slice(0, 4).join(' ');
}

function resolveSan(snap: BoardSnapshot, rawSan: string): Move | null {
  let san = rawSan.replace(/[+#!?]+$/, '');
  const legal = MoveGenerator.legalMoves(snap);

  if (san === 'O-O' || san === '0-0') {
    return legal.find((m) => m.special === 'castle-king') ?? null;
  }
  if (san === 'O-O-O' || san === '0-0-0') {
    return legal.find((m) => m.special === 'castle-queen') ?? null;
  }

  let promo: PromotionPiece | null = null;
  const stripped = san.replace(/=?[QRBN]$/, '');
  const promoMatch = /=?([QRBN])$/.exec(san);
  if (promoMatch && /[a-h][18]$/.test(stripped)) {
    promo = PROMO_LETTER[promoMatch[1] ?? ''] ?? null;
    san = stripped;
  }

  let pieceType: PieceType = 'pawn';
  const lead = PIECE_LETTER[san[0] ?? ''];
  if (lead) {
    pieceType = lead;
    san = san.slice(1);
  }
  san = san.replace('x', '');

  const target = san.slice(-2);
  const disamb = san.slice(0, -2);

  const candidates = legal.filter((m) => {
    if (m.to.algebraic !== target) return false;
    const piece = snap.pieceAt(m.from);
    if (piece?.type !== pieceType) return false;
    if (promo) {
      if (m.promotion !== promo) return false;
    } else if (m.promotion) {
      return false;
    }
    for (const ch of disamb) {
      if (ch >= 'a' && ch <= 'h') {
        if (!m.from.algebraic.startsWith(ch)) return false;
      } else if (ch >= '1' && ch <= '8') {
        if (m.from.algebraic[1] !== ch) return false;
      }
    }
    return true;
  });

  return candidates.length === 1 ? (candidates[0] ?? null) : null;
}

/** In-memory книга дебютов: explorer UI + AI book, без сети. См. docs/codebase/openings.md. */
export class OpeningBook {
  private readonly responses = new Map<string, Map<string, string>>();
  private readonly names = new Map<string, string>();

  constructor(defs: readonly OpeningDef[]) {
    for (const def of defs) {
      this.addLine(def.moves, def.name);
      for (const variation of def.variations ?? []) {
        this.addLine(variation, def.name);
      }
    }
  }

  /** Поднимает книгу из заранее подсчитанных карт без воспроизведения ходов. */
  static fromPrecomputed(data: PrecomputedBook): OpeningBook {
    const book = new OpeningBook([]);
    for (const [pos, name] of Object.entries(data.names)) {
      book.names.set(pos, name);
    }
    for (const [pos, bucket] of Object.entries(data.responses)) {
      book.responses.set(pos, new Map(Object.entries(bucket)));
    }
    return book;
  }

  private addLine(sanLine: string, name: string): void {
    const sans = sanLine.trim().split(/\s+/).filter(Boolean);
    let snap = BoardSnapshot.initial();
    for (const san of sans) {
      const move = resolveSan(snap, san);
      if (!move) return;
      const key = snap.positionKey();
      let bucket = this.responses.get(key);
      if (!bucket) {
        bucket = new Map<string, string>();
        this.responses.set(key, bucket);
      }
      bucket.set(move.toUci(), san);
      snap = snap.apply(move);
    }
    // Имя ставим только на терминальную позицию линии: иначе длинные линии перекрывают имена коротких,
    // разделяющих с ними начало (см. docs/codebase/openings.md).
    this.names.set(snap.positionKey(), name);
  }

  /** Curated-продолжения из заданной позиции. */
  movesAt(fen: string): BookMove[] {
    const bucket = this.responses.get(positionKeyOf(fen));
    if (!bucket) return [];
    return [...bucket.entries()].map(([uci, san]) => ({ uci, san }));
  }

  /** Имя дебюта на позицию, либо ''. */
  nameAt(fen: string): string {
    return this.names.get(positionKeyOf(fen)) ?? '';
  }

  /** Разрешает SAN-линию в массив (uci, san, fen) для навигации по доске. */
  resolveLine(sanLine: string): LineStep[] {
    const sans = sanLine.trim().split(/\s+/).filter(Boolean);
    const steps: LineStep[] = [];
    let snap = BoardSnapshot.initial();
    for (const san of sans) {
      const move = resolveSan(snap, san);
      if (!move) break;
      const uci = move.toUci();
      snap = snap.apply(move);
      steps.push({ uci, san, fen: snap.toFen() });
    }
    return steps;
  }
}
