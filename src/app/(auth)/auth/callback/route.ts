import { NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getSiteUrl } from '@/lib/site-url';

/**
 * Auth callback for OAuth + email-confirmation flows.
 *
 * Supabase/GoTrue can hand over the result of a flow in several shapes:
 *
 * 1. PKCE / OAuth (`?code=...`): a one-time code exchanged for a session server-side.
 *    The browser keeps the PKCE code-verifier in a cookie, which `createClient()` reads.
 *
 * 2. Implicit email confirmation (`/auth/callback#access_token=...`): GoTrue delivers
 *    tokens in the URL **fragment**, which never reaches the server. A 3xx redirect
 *    would drop the fragment, so we reply with a document (200) that hands the hash to
 *    the app root, where the browser session client captures it.
 *
 * 3. GoTrue error (`?error=...&error_code=...&error_description=...`): the flow failed
 *    (expired/invalid confirmation link, OAuth denial, …). We forward the failure to the
 *    login screen with a readable reason instead of silently looping.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const nextPath = url.searchParams.get('next') ?? url.searchParams.get('redirect') ?? '/chat';
  const safeNext = nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/chat';
  const origin = getSiteUrl(url.origin);
  const redirect = (path: string) => NextResponse.redirect(new URL(path, origin));

  if (code) {
    const supabase = await createClient();
    let exchangeError: { message: string; code?: string } | null = null;

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      exchangeError = error ? { message: error.message, code: error.code } : null;

      if (!exchangeError && data.user) {
        await syncProfile(data.user);
      }
    } catch (cause) {
      console.error('Auth callback: unexpected error while exchanging code.', cause);
      exchangeError = { message: 'unexpected error while exchanging code' };
    }

    if (!exchangeError) {
      return redirect(safeNext);
    }

    console.error('Auth callback: code exchange failed.', exchangeError.message, exchangeError.code);
    return redirect('/login?error=auth_exchange_failed');
  }

  // GoTrue surfaces failed flows (stale/expired link, OAuth denial, token replay) through
  // the query string. Map the raw params to a friendlier reason before redirecting.
  const errorCode = url.searchParams.get('error_code');
  const errorDescription = url.searchParams.get('error_description') ?? url.searchParams.get('error');
  if (url.searchParams.get('error') !== null) {
    const reason =
      errorCode === 'otp_expired' || errorCode === 'otp_state_param_mismatch'
        ? 'verification_link_expired'
        : errorCode === 'otp_mismatch' || errorCode === 'otp_not_found'
          ? 'verification_failed'
          : 'auth_failed';
    console.warn('Auth callback: GoTrue reported a flow error.', { errorCode, errorDescription });
    return redirect(`/login?error=${reason}`);
  }

  // No `code` and no reported error: this is an implicit-flow email confirmation (tokens in
  // `location.hash`) or a direct visit. We must not redirect — a Location header would drop
  // the fragment — so serve a minimal page that forwards the hash to the app root where the
  // client-side session capture can read it, and otherwise falls back to login.
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Signing you in…</title>
    <script>
      (function () {
        var hash = window.location.hash;
        if (hash) {
          try {
            var params = new URLSearchParams(hash.slice(1));
            if (params.has('access_token') || params.has('refresh_token')) {
              window.location.replace('/' + hash);
              return;
            }
          } catch (e) {
            /* ignore malformed fragment */
          }
        }
        window.location.replace('/login');
      })();
    </script>
  </head>
  <body></body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

/**
 * Create-or-sync the `profiles` row for the authenticated user after any
 * successful auth flow (OAuth and email confirmation).
 *
 * The auth.users insert trigger already creates a profile for brand-new users,
 * but it does not fire for users that predate the trigger, and it never
 * refreshes metadata on later sign-ins. This upsert closes both gaps so every
 * Google (and email) user is guaranteed a profile, with the latest name/avatar.
 *
 * Uses the service-role client so the upsert is idempotent and RLS-safe; it
 * only writes the row owned by the just-verified session user.
 */
async function syncProfile(user: { id: string; user_metadata?: Record<string, unknown> }) {
  try {
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const fullName =
      (typeof meta.full_name === 'string' && meta.full_name) ||
      (typeof meta.name === 'string' && meta.name) ||
      null;
    const avatarUrl =
      (typeof meta.avatar_url === 'string' && meta.avatar_url) ||
      (typeof meta.picture === 'string' && meta.picture) ||
      null;

    if (!fullName && !avatarUrl) return;

    const admin = createServiceRoleClient();
    const { error } = await admin
      .from('profiles')
      .upsert({ id: user.id, full_name: fullName, avatar_url: avatarUrl }, { onConflict: 'id' });

    if (error) {
      console.warn('Auth callback: could not sync profile.', error.message);
    }
  } catch (cause) {
    console.warn('Auth callback: profile sync failed.', cause);
  }
}