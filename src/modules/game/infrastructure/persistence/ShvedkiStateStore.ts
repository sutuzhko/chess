import type { Color, PieceType } from '@modules/game/domain/game';

type ReservePieceType = Exclude<PieceType, 'king'>;

export interface SerializedShvedkiPhase {
  readonly kind: 'playing' | 'last-move' | 'finished';
  readonly boardId?: 'A' | 'B';
  readonly color?: Color;
  readonly result?: 'team-1-wins' | 'team-2-wins' | 'draw';
  /** Кол-во полуходов, сделанных в фазе спасения (последний шанс на второй доске). */
  readonly plies?: number;
}

export interface SerializedShvedkiMove {
  readonly boardId: 'A' | 'B';
  readonly color: Color;
  readonly san: string;
  readonly index: number;
}

export interface SerializedShvedkiState {
  readonly version: 1;
  readonly fenA: string;
  readonly fenB: string;
  readonly reservesA: { white: [ReservePieceType, number][]; black: [ReservePieceType, number][] };
  readonly reservesB: { white: [ReservePieceType, number][]; black: [ReservePieceType, number][] };
  readonly capturedByA: { white: PieceType[]; black: PieceType[] };
  readonly capturedByB: { white: PieceType[]; black: PieceType[] };
  readonly movesA: SerializedShvedkiMove[];
  readonly movesB: SerializedShvedkiMove[];
  readonly phase: SerializedShvedkiPhase;
  readonly mateBoardId: 'A' | 'B' | null;
}

export class ShvedkiStateStore {
  constructor(
    private readonly storage: Storage,
    private readonly prefix = 'chess.shvedki-state.',
  ) {}

  private key(id: string): string {
    return this.prefix + id;
  }

  save(matchId: string, state: SerializedShvedkiState): void {
    this.storage.setItem(this.key(matchId), JSON.stringify(state));
  }

  load(matchId: string): SerializedShvedkiState | null {
    const raw = this.storage.getItem(this.key(matchId));
    if (!raw) return null;
    try {
      const data = JSON.parse(raw) as SerializedShvedkiState;
      if ((data.version as number) !== 1) return null;
      return data;
    } catch {
      return null;
    }
  }

  delete(matchId: string): void {
    this.storage.removeItem(this.key(matchId));
  }
}
