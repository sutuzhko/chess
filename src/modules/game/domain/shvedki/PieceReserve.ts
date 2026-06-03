import type { Color, PieceType } from '@modules/game/domain/game';

type ReservePieceType = Exclude<PieceType, 'king'>;

export class PieceReserve {
  private constructor(
    private readonly counts: ReadonlyMap<ReservePieceType, number>,
  ) {}

  static empty(): PieceReserve {
    return new PieceReserve(new Map());
  }

  static fromEntries(entries: readonly (readonly [ReservePieceType, number])[]): PieceReserve {
    const map = new Map<ReservePieceType, number>();
    for (const [type, count] of entries) if (count > 0) map.set(type, count);
    return new PieceReserve(map);
  }

  entries(): readonly (readonly [ReservePieceType, number])[] {
    return Array.from(this.counts.entries());
  }

  add(type: PieceType): PieceReserve {
    if (type === 'king') return this;
    const next = new Map(this.counts);
    next.set(type, (next.get(type) ?? 0) + 1);
    return new PieceReserve(next);
  }

  remove(type: ReservePieceType): PieceReserve {
    const cur = this.counts.get(type) ?? 0;
    if (cur <= 0) throw new Error(`No ${type} in reserve`);
    const next = new Map(this.counts);
    if (cur === 1) next.delete(type);
    else next.set(type, cur - 1);
    return new PieceReserve(next);
  }

  count(type: PieceType): number {
    if (type === 'king') return 0;
    return this.counts.get(type) ?? 0;
  }

  available(): readonly ReservePieceType[] {
    return Array.from(this.counts.keys());
  }

  isEmpty(): boolean {
    return this.counts.size === 0;
  }
}

export interface DualReserves {
  readonly white: PieceReserve;
  readonly black: PieceReserve;
}

export const emptyReserves = (): DualReserves => ({
  white: PieceReserve.empty(),
  black: PieceReserve.empty(),
});

export const addToReserve = (
  reserves: DualReserves,
  color: Color,
  type: PieceType,
): DualReserves => ({
  white: color === 'white' ? reserves.white.add(type) : reserves.white,
  black: color === 'black' ? reserves.black.add(type) : reserves.black,
});
