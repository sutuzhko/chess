import { BoardSnapshot } from '@modules/game/domain/game/BoardSnapshot.js';
import { type DualReserves, emptyReserves } from './PieceReserve.js';

export type BoardId = 'A' | 'B';

export interface DualBoardState {
  readonly snapshotA: BoardSnapshot;
  readonly snapshotB: BoardSnapshot;
  readonly reservesA: DualReserves;
  readonly reservesB: DualReserves;
}

export class DualBoard {
  constructor(
    private _snapshotA: BoardSnapshot,
    private _snapshotB: BoardSnapshot,
    private _reservesA: DualReserves = emptyReserves(),
    private _reservesB: DualReserves = emptyReserves(),
  ) {}

  static initial(): DualBoard {
    return new DualBoard(BoardSnapshot.initial(), BoardSnapshot.initial());
  }

  state(): DualBoardState {
    return {
      snapshotA: this._snapshotA,
      snapshotB: this._snapshotB,
      reservesA: this._reservesA,
      reservesB: this._reservesB,
    };
  }

  snapshot(boardId: BoardId): BoardSnapshot {
    return boardId === 'A' ? this._snapshotA : this._snapshotB;
  }

  reserves(boardId: BoardId): DualReserves {
    return boardId === 'A' ? this._reservesA : this._reservesB;
  }

  setSnapshot(boardId: BoardId, snap: BoardSnapshot): void {
    if (boardId === 'A') this._snapshotA = snap;
    else this._snapshotB = snap;
  }

  setReserves(boardId: BoardId, reserves: DualReserves): void {
    if (boardId === 'A') this._reservesA = reserves;
    else this._reservesB = reserves;
  }
}
