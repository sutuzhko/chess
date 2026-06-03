const MASK64 = (1n << 64n) - 1n;

const splitmix64 = (seed: bigint) => {
  let state = seed & MASK64;
  return (): bigint => {
    state = (state + 0x9e3779b97f4a7c15n) & MASK64;
    let z = state;
    z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & MASK64;
    z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & MASK64;
    z = (z ^ (z >> 31n)) & MASK64;
    return z;
  };
};

const rng = splitmix64(0xc0ffee_1234_5678n);

const PIECE_KEYS: BigInt64Array = (() => {
  const arr = new BigInt64Array(15 * 64);
  for (let p = 0; p < 15; p++) {
    for (let s = 0; s < 64; s++) {
      arr[p * 64 + s] = BigInt.asIntN(64, rng());
    }
  }
  return arr;
})();

const CASTLING_KEYS: BigInt64Array = (() => {
  const arr = new BigInt64Array(16);
  for (let i = 0; i < 16; i++) arr[i] = BigInt.asIntN(64, rng());
  return arr;
})();

const EP_FILE_KEYS: BigInt64Array = (() => {
  const arr = new BigInt64Array(8);
  for (let i = 0; i < 8; i++) arr[i] = BigInt.asIntN(64, rng());
  return arr;
})();

const SIDE_KEY: bigint = BigInt.asIntN(64, rng());

import type { EnginePosition } from './EnginePosition.js';

export const Zobrist = {
  piece(piece: number, square: number): bigint {
    return PIECE_KEYS[piece * 64 + square]!;
  },
  castling(rights: number): bigint {
    return CASTLING_KEYS[rights & 15]!;
  },
  epFile(file: number): bigint {
    return EP_FILE_KEYS[file]!;
  },
  side(): bigint {
    return SIDE_KEY;
  },
  computeHash(p: EnginePosition): bigint {
    let h = 0n;
    for (let s = 0; s < 64; s++) {
      const piece = p.pieces[s]!;
      if (piece !== 0) h ^= Zobrist.piece(piece, s);
    }
    h ^= Zobrist.castling(p.castling);
    if (p.epSquare !== -1) h ^= Zobrist.epFile(p.epSquare & 7);
    if (p.sideToMove === 1) h ^= Zobrist.side();
    return h;
  },
};
