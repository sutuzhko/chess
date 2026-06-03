import { BoardSnapshot } from '@modules/game/domain/game';
import { PieceReserve } from '@modules/game/domain/shvedki';
import {
  ShvedkiSearch,
} from '@modules/game/infrastructure/engine/shvedki/ShvedkiSearch.js';

type ReservePieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen';
type ReserveEntries = readonly (readonly [ReservePieceType, number])[];

export interface ShvedkiAnalyzeRequest {
  type: 'analyze';
  id: number;
  fen: string;
  whiteReserve: ReserveEntries;
  blackReserve: ReserveEntries;
  maxDepth: number;
  multiPV: number;
  temperature: number;
  noiseCP: number;
  blunderProb: number;
  maxDropsPerNode: number;
}

export interface ShvedkiCancelRequest {
  type: 'cancel';
  id: number;
}

export type ShvedkiWorkerRequest = ShvedkiAnalyzeRequest | ShvedkiCancelRequest;

export type ShvedkiSerializedMove =
  | { readonly kind: 'normal'; readonly from: string; readonly to: string; readonly promotion: string | null }
  | { readonly kind: 'drop'; readonly piece: ReservePieceType; readonly to: string };

export interface ShvedkiResultMessage {
  type: 'result';
  id: number;
  move: ShvedkiSerializedMove | null;
  score: number;
}

export interface ShvedkiErrorMessage {
  type: 'error';
  id: number;
  message: string;
}

export type ShvedkiWorkerMessage = ShvedkiResultMessage | ShvedkiErrorMessage;

self.addEventListener('message', (event: MessageEvent<ShvedkiWorkerRequest>) => {
  const data = event.data;
  if (data.type === 'cancel') return; // ShvedkiSearch is synchronous; no in-flight handle.

  try {
    const snap = BoardSnapshot.fromFen(data.fen);
    const reserves = {
      white: PieceReserve.fromEntries(data.whiteReserve),
      black: PieceReserve.fromEntries(data.blackReserve),
    };
    const search = new ShvedkiSearch();
    const result = search.search(
      { snap, reserves },
      {
        maxDepth: data.maxDepth,
        multiPV: data.multiPV,
        temperature: data.temperature,
        noiseCP: data.noiseCP,
        blunderProb: data.blunderProb,
        maxDropsPerNode: data.maxDropsPerNode,
      },
    );

    let serialized: ShvedkiSerializedMove | null = null;
    if (result.bestMove) {
      if (result.bestMove.kind === 'normal') {
        const m = result.bestMove.move;
        serialized = {
          kind: 'normal',
          from: m.from.algebraic,
          to: m.to.algebraic,
          promotion: m.promotion,
        };
      } else {
        serialized = {
          kind: 'drop',
          piece: result.bestMove.piece,
          to: result.bestMove.to.algebraic,
        };
      }
    }

    const final: ShvedkiResultMessage = {
      type: 'result',
      id: data.id,
      move: serialized,
      score: result.score,
    };
    (self as unknown as Worker).postMessage(final);
  } catch (e) {
    const err: ShvedkiErrorMessage = {
      type: 'error',
      id: data.id,
      message: e instanceof Error ? e.message : String(e),
    };
    (self as unknown as Worker).postMessage(err);
  }
});
