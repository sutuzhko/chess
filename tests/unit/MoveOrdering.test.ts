import {
  type EngineMove,
  SP_NONE,
  WP,
  WQ,
} from '@/engine/core/EnginePosition';
import { MoveOrderer } from '@/engine/search/MoveOrdering';
import { describe, expect, it } from 'vitest';

const mv = (
  from: number,
  to: number,
  captured = 0,
  promotion = 0,
  special = SP_NONE,
): EngineMove => ({ from, to, captured, promotion, special });

describe('MoveOrderer', () => {
  it('hash-ход выше любого взятия и превращения', () => {
    const o = new MoveOrderer();
    const hash = mv(8, 16);
    const queenPromo = mv(48, 56, 0, 5);
    const capture = mv(0, 7, WQ);
    expect(o.score(hash, hash, 0)).toBeGreaterThan(o.score(queenPromo, null, 0));
    expect(o.score(hash, hash, 0)).toBeGreaterThan(o.score(capture, null, 0));
  });

  it('MVV: взятие ферзя выше взятия пешки', () => {
    const o = new MoveOrderer();
    const capQueen = mv(0, 7, WQ);
    const capPawn = mv(0, 7, WP);
    expect(o.score(capQueen, null, 0)).toBeGreaterThan(o.score(capPawn, null, 0));
  });

  it('превращение в ферзя выше любого тихого не-hash хода', () => {
    const o = new MoveOrderer();
    const quiet = mv(8, 16);
    const promo = mv(48, 56, 0, 5);
    expect(o.score(promo, null, 0)).toBeGreaterThan(o.score(quiet, null, 0));
  });

  it('killer-ход выше прочих тихих', () => {
    const o = new MoveOrderer();
    const killer = mv(8, 16);
    const quiet = mv(9, 17);
    o.updateKillers(killer, 0);
    expect(o.score(killer, null, 0)).toBeGreaterThan(o.score(quiet, null, 0));
  });

  it('killer slot 1 выше killer slot 2', () => {
    const o = new MoveOrderer();
    const first = mv(8, 16);
    const second = mv(9, 17);
    o.updateKillers(first, 0);
    o.updateKillers(second, 0);
    // second должен попасть в slot 0, first вытеснен в slot 1.
    expect(o.score(second, null, 0)).toBeGreaterThan(o.score(first, null, 0));
  });

  it('history поднимает ход, ранее показавший себя хорошо', () => {
    const o = new MoveOrderer();
    const m = mv(8, 16);
    const other = mv(9, 17);
    o.updateHistory(m, 4);
    o.updateHistory(m, 4);
    expect(o.score(m, null, 5)).toBeGreaterThan(o.score(other, null, 5));
  });

  it('взятия выше killers и history', () => {
    const o = new MoveOrderer();
    const killer = mv(8, 16);
    const capture = mv(20, 28, WP);
    o.updateKillers(killer, 0);
    o.updateHistory(killer, 8);
    expect(o.score(capture, null, 0)).toBeGreaterThan(o.score(killer, null, 0));
  });

  it('order() ставит hash-ход первым', () => {
    const o = new MoveOrderer();
    const hash = mv(10, 20);
    const moves: EngineMove[] = [mv(8, 16), mv(9, 17), hash, mv(11, 19)];
    o.order(moves, hash, 0);
    expect(moves[0]).toBe(hash);
  });

  it('clear() сбрасывает killers и history', () => {
    const o = new MoveOrderer();
    const killer = mv(8, 16);
    o.updateKillers(killer, 0);
    o.updateHistory(killer, 8);
    o.clear();
    const other = mv(9, 17);
    expect(o.score(killer, null, 0)).toBe(o.score(other, null, 0));
  });

  it('взятия и превращения игнорируются для killer-update', () => {
    const o = new MoveOrderer();
    const capture = mv(0, 7, WQ);
    o.updateKillers(capture, 0);
    // Killer slot не должен запомнить взятие.
    const other = mv(8, 16);
    expect(o.score(capture, null, 0)).toBeGreaterThan(o.score(other, null, 0));
    // Но дополнительный quiet получит killer-bonus, если бы там сидело capture — нет.
    // Проверяем, что quiet `other` не равен killer-score.
    expect(o.score(other, null, 0)).toBeLessThan(80_000);
  });
});
