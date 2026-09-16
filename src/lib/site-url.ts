/**
 * Canonical base URL used to build auth redirect URLs.
 *
 * Supabase redirects (email confirmation links, OAuth callbacks) must point to a URL
 * that is listed in Authentication → URL Configuration → Redirect URLs. Keep
 * `NEXT_PUBLIC_SITE_URL` and the dashboard's Site URL / Redirect URLs in sync.
 *
 * `getSiteUrl` is origin-first because it resolves where a *request* actually arrived
 * (used server-side in the OAuth callback so we redirect back to the host the user
 * reached, never to a hardcoded address).
 *
 * `getAuthBaseUrl` is env-first because it builds URLs that *Supabase itself* will
 * redirect the browser to (OAuth `redirectTo`, email confirmation links). Those must
 * be a stable, dashboard-allowlisted value — never a machine-specific LAN IP such as
 * `http://192.168.1.3:3000`. `window.location.origin` is only a client-side fallback
 * when the env var is unset.
 */
export function getSiteUrl(origin?: string | null): string {
  const trimmed = origin?.trim().replace(/\/+$/, "");
  if (trimmed) return trimmed;

  return getAuthBaseUrl();
}

/**
 * Base URL for URLs that Supabase will bounce the browser back to (OAuth
 * `redirectTo` and email-confirmation links). Prefers `NEXT_PUBLIC_SITE_URL`;
 * for local development that should be `http://localhost:3000`. Falls back to the
 * browser origin on the client (or localhost on the server) only if unset.
 */
export function getAuthBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (fromEnv) return fromEnv;

  if (typeof window !== "undefined") {
    return window.location.origin.trim().replace(/\/+$/, "");
  }

  return "http://localhost:3000";
}

/** The full callback URL used by Supabase email confirmation and OAuth flows. */
export function getAuthCallbackUrl(origin?: string | null): string {
  return `${getSiteUrl(origin)}/auth/callback`;
}