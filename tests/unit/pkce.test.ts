import {
  base64UrlEncode,
  computeChallengeS256,
  generateVerifier,
} from '@/app/shared/lib/oauth/pkce.js';
import { describe, expect, it } from 'vitest';

describe('pkce.base64UrlEncode', () => {
  it('кодирует без = / +', () => {
    // SHA-256("") = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    // в этих байтах есть символы, которые в обычном base64 дают `+` или `/`.
    const bytes = new Uint8Array([0xff, 0xfb, 0xff]);
    const out = base64UrlEncode(bytes);
    expect(out).not.toContain('+');
    expect(out).not.toContain('/');
    expect(out).not.toContain('=');
  });

  it('конкретный пример из RFC 7636', () => {
    // RFC 7636 Appendix B даёт verifier→challenge мэппинг. Возьмём verifier байты
    // и проверим что наш encoder совпадает с эталоном для известного входа.
    const sample = new Uint8Array([0x03, 0xef]);
    expect(base64UrlEncode(sample)).toBe('A-8');
  });
});

describe('pkce.generateVerifier', () => {
  it('возвращает 43-символьную строку base64url', () => {
    const v = generateVerifier();
    expect(v).toHaveLength(43);
    expect(v).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('два вызова не совпадают (вероятностно)', () => {
    expect(generateVerifier()).not.toBe(generateVerifier());
  });
});

describe('pkce.computeChallengeS256', () => {
  it('RFC 7636 Appendix B reference vector', async () => {
    // Из RFC 7636 §B (PKCE reference example):
    //   code_verifier  = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
    //   code_challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    const challenge = await computeChallengeS256(verifier);
    expect(challenge).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });

  it('детерминированно для одного входа', async () => {
    const v = 'fixed-test-verifier-value-no-special-chars-1234';
    const a = await computeChallengeS256(v);
    const b = await computeChallengeS256(v);
    expect(a).toBe(b);
  });
});
