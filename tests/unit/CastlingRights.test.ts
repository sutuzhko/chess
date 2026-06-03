import {
  CastlingRights,
} from '@/modules/game/domain/game/value-objects/CastlingRights';
import { describe, expect, it } from 'vitest';

describe('CastlingRights', () => {
  it('начальные права — все четыре', () => {
    const r = CastlingRights.initial();
    expect(r.has('white', 'king')).toBe(true);
    expect(r.has('white', 'queen')).toBe(true);
    expect(r.has('black', 'king')).toBe(true);
    expect(r.has('black', 'queen')).toBe(true);
    expect(r.toFen()).toBe('KQkq');
  });

  it('removeColor стирает только указанный цвет', () => {
    const r = CastlingRights.initial().removeColor('white');
    expect(r.has('white', 'king')).toBe(false);
    expect(r.has('white', 'queen')).toBe(false);
    expect(r.has('black', 'king')).toBe(true);
    expect(r.toFen()).toBe('kq');
  });

  it('remove идемпотентен', () => {
    const r = CastlingRights.initial().remove('white', 'king');
    expect(r.remove('white', 'king')).toBe(r);
  });

  it('парсит поле рокировки FEN', () => {
    expect(CastlingRights.fromFen('-').toFen()).toBe('-');
    expect(CastlingRights.fromFen('Kq').toFen()).toBe('Kq');
  });
});
