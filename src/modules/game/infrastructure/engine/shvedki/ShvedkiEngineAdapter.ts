import {
  type BoardSnapshot,
  Move,
  type PromotionPiece,
  Square,
} from '@modules/game/domain/game';
import {
  type DualReserves,
  type ShvedkiMove,
} from '@modules/game/domain/shvedki';
import type {
  ShvedkiSerializedMove,
  ShvedkiWorkerMessage,
} from '@modules/game/infrastructure/workers/shvedki-ai.worker.js';

export interface ShvedkiBestMoveRequest {
  readonly snap: BoardSnapshot;
  readonly reserves: DualReserves;
  /** Профиль AI-уровня (тот же, что у стандартного движка). */
  readonly profile: {
    readonly depth: number;
    readonly multiPV: number;
    readonly temperature: number;
    readonly noiseCP: number;
    readonly blunderProb: number;
  };
}

export interface ShvedkiBestMoveResult {
  readonly move: ShvedkiMove;
  readonly score: number;
}

type ReservePieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen';

const clampDepth = (rawDepth: number): number => {
  // У шведок ветвление куда больше обычных шахмат — режем глубину, чтобы поиск возвращался за разумное время.
  if (rawDepth <= 3) return 2;
  if (rawDepth <= 5) return 3;
  if (rawDepth <= 7) return 4;
  return 5;
};

const dropsPerNode = (depth: number): number => {
  if (depth <= 2) return 24;
  if (depth <= 3) return 12;
  return 8;
};

const serializeReserveEntries = (
  entries: readonly (readonly [ReservePieceType, number])[],
): readonly (readonly [ReservePieceType, number])[] =>
  entries.map(([t, c]) => [t, c] as const);

const deserializeMove = (
  serialized: ShvedkiSerializedMove,
  snap: BoardSnapshot,
): ShvedkiMove => {
  if (serialized.kind === 'drop') {
    return {
      kind: 'drop',
      piece: serialized.piece,
      to: Square.fromAlgebraic(serialized.to),
    };
  }
  const from = Square.fromAlgebraic(serialized.from);
  const to = Square.fromAlgebraic(serialized.to);
  const promotion = (serialized.promotion ?? null) as PromotionPiece | null;
  // Восстанавливаем полный Move через live-board, чтобы metadata (captured, special) сошлась с результатом поиска.
  const target = snap.pieceAt(to);
  const movingPiece = snap.pieceAt(from);
  let special: Move['special'] = null;
  if (movingPiece?.type === 'king' && Math.abs(to.file - from.file) === 2) {
    special = to.file > from.file ? 'castle-king' : 'castle-queen';
  } else if (
    movingPiece?.type === 'pawn' &&
    !target &&
    from.file !== to.file
  ) {
    special = 'en-passant';
  } else if (
    movingPiece?.type === 'pawn' &&
    Math.abs(to.rank - from.rank) === 2
  ) {
    special = 'double-push';
  }
  const captured = target?.type
    ?? (special === 'en-passant' ? 'pawn' : null);
  return {
    kind: 'normal',
    move: new Move(from, to, special, promotion, captured),
  };
};

/** Адаптер запускает ShvedkiSearch в Web Worker. См. docs/codebase/shvedki.md */
export class ShvedkiEngineAdapter {
  private worker: Worker | null = null;
  private nextId = 1;

  private getWorker(): Worker {
    if (this.worker) return this.worker;
    this.worker = new Worker(
      new URL('../../workers/shvedki-ai.worker.ts', import.meta.url),
      { type: 'module' },
    );
    return this.worker;
  }

  async bestMove(req: ShvedkiBestMoveRequest): Promise<ShvedkiBestMoveResult | null> {
    const depth = clampDepth(req.profile.depth);
    const id = this.nextId++;
    const worker = this.getWorker();

    const message = {
      type: 'analyze' as const,
      id,
      fen: req.snap.toFen(),
      whiteReserve: serializeReserveEntries(req.reserves.white.entries()),
      blackReserve: serializeReserveEntries(req.reserves.black.entries()),
      maxDepth: depth,
      multiPV: Math.max(1, req.profile.multiPV),
      temperature: req.profile.temperature,
      noiseCP: req.profile.noiseCP,
      blunderProb: req.profile.blunderProb,
      maxDropsPerNode: dropsPerNode(depth),
    };

    return new Promise<ShvedkiBestMoveResult | null>((resolve, reject) => {
      const handler = (event: MessageEvent<ShvedkiWorkerMessage>): void => {
        const data = event.data;
        if (data.id !== id) return;
        worker.removeEventListener('message', handler);
        if (data.type === 'error') {
          reject(new Error(data.message));
          return;
        }
        if (!data.move) {
          resolve(null);
          return;
        }
        resolve({
          move: deserializeMove(data.move, req.snap),
          score: data.score,
        });
      };
      worker.addEventListener('message', handler);
      worker.postMessage(message);
    });
  }

  terminate(): void {
    this.worker?.terminate();
    this.worker = null;
  }
}
