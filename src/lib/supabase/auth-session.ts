/**
 * Shared helpers for recognizing Supabase Auth errors that mean "this session
 * can never be revived locally" and for clearing the cookies that hold it.
 *
 * Importable from both server code (middleware) and client components: nothing
 * here touches the network, logs, or any token/secret material.
 */

/**
 * GoTrue error codes after which no local retry can ever succeed — the refresh
 * token is gone (rotated away, revoked, signed out elsewhere, or the session
 * row was deleted). Retrying with the same cookie only re-triggers the error.
 */
const INVALID_SESSION_CODES = new Set([
  'refresh_token_not_found',
  'refresh_token_already_used',
  'session_not_found',
  'session_expired',
]);

/**
 * True when an auth error means the stored session is permanently unusable
 * (as opposed to a transient failure — network, rate limit, 5xx — after which
 * the existing session should be preserved and retried later).
 */
export function isInvalidSessionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const { code, name } = error as { code?: unknown; name?: unknown };
  if (typeof code === 'string' && INVALID_SESSION_CODES.has(code)) return true;
  return name === 'AuthSessionMissingError';
}

/**
 * Matches ONLY Supabase session cookies: `sb-<ref>-auth-token`, its chunks
 * (`.0`, `.1`, …) and the separate `-user` cookie. Deliberately excludes the
 * PKCE verifier cookies (`…-code-verifier`, `…-flows-code-verifier`) — clearing
 * those mid-flow would break an in-progress OAuth callback.
 */
const SESSION_COOKIE_PATTERN = /^sb-.+-auth-token(-user)?(\.\d+)?$/;

export function isSessionCookieName(name: string): boolean {
  return SESSION_COOKIE_PATTERN.test(name);
}

/**
 * Client-side belt-and-braces: expire every Supabase session cookie directly
 * via `document.cookie`. Supabase session cookies are not httpOnly (the browser
 * client reads them), so this is always possible. No-op when nothing matches.
 */
export function clearBrowserAuthCookies(): void {
  if (typeof document === 'undefined') return;
  for (const entry of document.cookie.split(';')) {
    const separator = entry.indexOf('=');
    const name = (separator === -1 ? entry : entry.slice(0, separator)).trim();
    if (name && isSessionCookieName(name)) {
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
    }
  }
}

/**
 * Call with the `error` from `signOut()` / `getSession()` / any auth method:
 * when it reports a dead session, make sure the cookie is gone so neither this
 * tab nor the server proxy retries it on every request. Transient errors are
 * ignored — a reachable-but-failing session must be preserved, not dropped.
 */
export function clearSessionIfInvalid(error: unknown): void {
  if (isInvalidSessionError(error)) {
    clearBrowserAuthCookies();
  }
}
