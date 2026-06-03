const FILE_A = 'a'.charCodeAt(0);

export class Square {
  private constructor(
    readonly file: number,
    readonly rank: number,
  ) {}

  private static readonly cache: readonly Square[] = (() => {
    const arr: Square[] = [];
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        arr.push(new Square(f, r));
      }
    }
    return arr;
  })();

  static of(file: number, rank: number): Square {
    if (file < 0 || file > 7 || rank < 0 || rank > 7) {
      throw new RangeError(`Square out of range: file=${file}, rank=${rank}`);
    }
    const sq = Square.cache[rank * 8 + file];
    if (!sq) throw new RangeError(`Square.of: cache miss at (${file},${rank})`);
    return sq;
  }

  static fromIndex(index: number): Square {
    if (index < 0 || index > 63) {
      throw new RangeError(`Square index out of range: ${index}`);
    }
    const sq = Square.cache[index];
    if (!sq) throw new RangeError(`Square.fromIndex: cache miss at ${index}`);
    return sq;
  }

  static fromAlgebraic(s: string): Square {
    if (s.length !== 2) {
      throw new Error(`Invalid algebraic square: "${s}"`);
    }
    const file = s.charCodeAt(0) - FILE_A;
    const rank = Number.parseInt(s[1] ?? '', 10) - 1;
    if (Number.isNaN(rank)) {
      throw new Error(`Invalid algebraic square: "${s}"`);
    }
    return Square.of(file, rank);
  }

  get index(): number {
    return this.rank * 8 + this.file;
  }

  get algebraic(): string {
    return `${String.fromCharCode(FILE_A + this.file)}${this.rank + 1}`;
  }

  equals(other: Square): boolean {
    return this.file === other.file && this.rank === other.rank;
  }

  offset(df: number, dr: number): Square | null {
    const f = this.file + df;
    const r = this.rank + dr;
    if (f < 0 || f > 7 || r < 0 || r > 7) return null;
    const sq = Square.cache[r * 8 + f];
    if (!sq) throw new RangeError(`Square.offset: cache miss at (${f},${r})`);
    return sq;
  }

  toString(): string {
    return this.algebraic;
  }
}
