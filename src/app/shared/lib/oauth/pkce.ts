/**
 * OAuth 2.0 PKCE (RFC 7636) helpers.
 *
 * Используется для авторизации в Lichess из браузерного SPA: `client_secret`
 * хранить в клиенте нельзя, поэтому связку с сервером авторизации защищает
 * пара `code_verifier`/`code_challenge`. Genrate verifier перед редиректом на
 * `/oauth`, кладём в `sessionStorage`, после возврата на callback подставляем
 * verifier в POST к `/api/token`.
 *
 * См. docs/codebase/lichess-oauth.md (если файл существует) и
 * https://datatracker.ietf.org/doc/html/rfc7636
 */

const VERIFIER_BYTES = 32; // → 43 символа base64url, в пределах 43–128 по RFC

/**
 * Кодирует `Uint8Array` в base64url (без `=`-паддинга и с `-_` вместо `+/`).
 * RFC 7636 §4.1 требует именно base64url.
 */
export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** Генерирует криптостойкий `code_verifier` (32 байта → 43 символа base64url). */
export function generateVerifier(): string {
  const bytes = new Uint8Array(VERIFIER_BYTES);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

/**
 * `code_challenge = BASE64URL(SHA256(code_verifier))` — метод `S256` по RFC 7636.
 * Lichess поддерживает только `S256`, plain не принимает.
 */
export async function computeChallengeS256(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}
