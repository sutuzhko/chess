/**
 * Pinia-стор авторизации в Lichess через OAuth 2.0 PKCE.
 *
 * Что хранится:
 *  - `token`        — Bearer-токен для запросов к Lichess API (e.g. opening
 * explorer);
 *  - `expiresAt`    — UNIX-ms истечения; до него токен считается валидным;
 *  - `username`     — для UI ("подключено как @X"). Запрашивается один раз
 * после успешного логина из `GET /api/account`;
 *  - флоу-флаги     — `loading` для индикатора во время обмена кода на токен.
 *
 * Где хранится: `localStorage`. Verifier для PKCE живёт в `sessionStorage`
 * между редиректом на `/oauth` и возвратом на `/oauth/callback`.
 *
 * Когда токен истёк или сервер ответил 401 — он автоматически чистится.
 * Логика "если нет токена — fallback на локальную книгу" реализуется в
 * composition root (`main.ts`), а не здесь.
 */

import {
  computeChallengeS256,
  generateVerifier,
} from '@app/shared/lib/oauth/pkce.js';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

const LICHESS_AUTHORIZE_URL = 'https://lichess.org/oauth';
const LICHESS_TOKEN_URL = 'https://lichess.org/api/token';
const LICHESS_ACCOUNT_URL = 'https://lichess.org/api/account';

/** Произвольный `client_id` — Lichess его показывает юзеру в окне согласия. */
const CLIENT_ID = 'chess-duplicate-sutuzhko';

const STORAGE_TOKEN_KEY = 'chess.lichess.token';
const STORAGE_EXPIRES_KEY = 'chess.lichess.expiresAt';
const STORAGE_USERNAME_KEY = 'chess.lichess.username';
const SESSION_VERIFIER_KEY = 'chess.lichess.pkceVerifier';
const SESSION_RETURN_TO_KEY = 'chess.lichess.returnTo';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number; // seconds
}

interface AccountResponse {
  username?: string;
  id?: string;
}

function buildRedirectUri(): string {
  // Совпадает байт в байт с тем что мы пошлём в /oauth.
  // BASE_URL у Vite заканчивается на `/`, поэтому склейка даёт корректный путь
  // для prod (gh-pages) и dev (localhost) одинаково.
  return `${window.location.origin}${import.meta.env.BASE_URL}oauth/callback`;
}

function loadInitial(): {
  token: string | null;
  expiresAt: number | null;
  username: string | null;
} {
  try {
    const token = localStorage.getItem(STORAGE_TOKEN_KEY);
    const expiresRaw = localStorage.getItem(STORAGE_EXPIRES_KEY);
    const username = localStorage.getItem(STORAGE_USERNAME_KEY);
    const expiresAt = expiresRaw ? Number.parseInt(expiresRaw, 10) : null;
    if (token && expiresAt && Number.isFinite(expiresAt) && expiresAt > Date.now()) {
      return { token, expiresAt, username };
    }
  } catch { /* ignore */ }
  return { token: null, expiresAt: null, username: null };
}

function persistToken(token: string, expiresAt: number, username: string | null): void {
  try {
    localStorage.setItem(STORAGE_TOKEN_KEY, token);
    localStorage.setItem(STORAGE_EXPIRES_KEY, String(expiresAt));
    if (username) localStorage.setItem(STORAGE_USERNAME_KEY, username);
  } catch { /* quota / disabled storage — silent */ }
}

function clearPersistedToken(): void {
  try {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_EXPIRES_KEY);
    localStorage.removeItem(STORAGE_USERNAME_KEY);
  } catch { /* ignore */ }
}

export const useLichessAuthStore = defineStore('lichess-auth', () => {
  const initial = loadInitial();
  const token = ref<string | null>(initial.token);
  const expiresAt = ref<number | null>(initial.expiresAt);
  const username = ref<string | null>(initial.username);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  const isAuthorized = computed<boolean>(() => {
    if (!token.value || !expiresAt.value) return false;
    return expiresAt.value > Date.now();
  });

  /**
   * Запускает OAuth-флоу: генерирует verifier, кладёт в sessionStorage,
   * редиректит на Lichess. После возврата `OAuthCallbackView` вызовет
   * `exchangeCodeForToken`.
   */
  async function login(returnTo?: string): Promise<void> {
    const verifier = generateVerifier();
    const challenge = await computeChallengeS256(verifier);

    sessionStorage.setItem(SESSION_VERIFIER_KEY, verifier);
    if (returnTo) sessionStorage.setItem(SESSION_RETURN_TO_KEY, returnTo);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      redirect_uri: buildRedirectUri(),
      code_challenge: challenge,
      code_challenge_method: 'S256',
      // scope пустой: для opening explorer достаточно Bearer-токена без прав.
      scope: '',
    });
    window.location.assign(`${LICHESS_AUTHORIZE_URL}?${params.toString()}`);
  }

  /**
   * Завершает OAuth-флоу: меняет `code` на access_token.
   * Возвращает путь, на который нужно отредиректить пользователя (`returnTo`
   * или `/`).
   */
  async function exchangeCodeForToken(code: string): Promise<string> {
    const verifier = sessionStorage.getItem(SESSION_VERIFIER_KEY);
    if (!verifier) throw new Error('PKCE verifier отсутствует — флоу прерван');

    loading.value = true;
    error.value = null;
    try {
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: buildRedirectUri(),
        client_id: CLIENT_ID,
        code_verifier: verifier,
      });

      const res = await fetch(LICHESS_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Lichess token endpoint returned ${String(res.status)}: ${text}`);
      }
      const payload = await res.json() as TokenResponse;
      const expiresIn = payload.expires_in ?? 60 * 60 * 24 * 365; // дефолт: год
      const newExpiresAt = Date.now() + expiresIn * 1000;

      token.value = payload.access_token;
      expiresAt.value = newExpiresAt;

      // Опционально — подтянуть username для UI. Падение не критично.
      let resolvedUsername: string | null = null;
      try {
        const accountRes = await fetch(LICHESS_ACCOUNT_URL, {
          headers: { Authorization: `Bearer ${payload.access_token}` },
        });
        if (accountRes.ok) {
          const account = await accountRes.json() as AccountResponse;
          resolvedUsername = account.username ?? account.id ?? null;
        }
      } catch { /* username — украшение, не блокер */ }
      username.value = resolvedUsername;

      persistToken(payload.access_token, newExpiresAt, resolvedUsername);

      sessionStorage.removeItem(SESSION_VERIFIER_KEY);
      const returnTo = sessionStorage.getItem(SESSION_RETURN_TO_KEY) ?? '/';
      sessionStorage.removeItem(SESSION_RETURN_TO_KEY);
      return returnTo;
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Логаут: пытается инвалидировать токен на сервере, потом чистит локально.
   * Если сетевой запрос упал — всё равно чистим: главное чтобы клиент забыл.
   */
  async function logout(): Promise<void> {
    const previousToken = token.value;
    token.value = null;
    expiresAt.value = null;
    username.value = null;
    clearPersistedToken();

    if (previousToken) {
      try {
        await fetch(LICHESS_TOKEN_URL, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${previousToken}` },
        });
      } catch { /* network — silent */ }
    }
  }

  /** Вызывается из API-слоя когда Lichess ответил 401 — токен считаем мёртвым. */
  function invalidate(): void {
    token.value = null;
    expiresAt.value = null;
    username.value = null;
    clearPersistedToken();
  }

  return {
    token,
    expiresAt,
    username,
    loading,
    error,
    isAuthorized,
    login,
    exchangeCodeForToken,
    logout,
    invalidate,
  };
});
