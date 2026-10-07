import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getAnonKey, getSupabaseUrl, logSupabaseEnvDiagnostics } from './env';
import { isInvalidSessionError, isSessionCookieName } from './auth-session';

const PROTECTED_PATHS = ['/chat', '/bookmarks', '/settings', '/profile'];

/**
 * The auth callback establishes the session itself (PKCE code exchange).
 * Probing the stored session on this path would race a pointless refresh — and
 * a clear of the OLD cookie — against the exchange that is about to write the
 * new one, so the session check is skipped entirely here.
 */
const AUTH_CALLBACK_PATH = '/auth/callback';

export async function updateSession(request: NextRequest) {
  const url = getSupabaseUrl();
  const anonKey = getAnonKey();

  if (!url || !anonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  // Every cookie write the Supabase client asks for (tokens rotated by a
  // refresh, or the clear that follows a dead refresh token) is recorded here
  // so it can be replayed onto whichever response we eventually return —
  // redirects included. Redirects used to be built as fresh responses, silently
  // dropping Set-Cookie headers: the browser kept an already-rotated refresh
  // token that GoTrue had invalidated, and the next refresh failed with
  // `refresh_token_not_found`. `setAll` may also fire several times per request
  // (PKCE verifier cleanup, then the session clear) while re-creating
  // `supabaseResponse` keeps only the last batch — the record keeps them all.
  const pendingCookies: { name: string; value: string; options: CookieOptions }[] = [];
  let pendingHeaders: Record<string, string> = {};

  logSupabaseEnvDiagnostics('middleware');
  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          pendingCookies.push(...cookiesToSet);
          pendingHeaders = { ...pendingHeaders, ...headers };
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
        },
      },
    },
  );

  const pathname = request.nextUrl.pathname;

  const authResult =
    pathname === AUTH_CALLBACK_PATH
      ? { data: { user: null }, error: null }
      : await supabase.auth.getUser();

  const user = authResult.data.user;
  const sessionInvalid = isInvalidSessionError(authResult.error);

  /**
   * Attach all recorded auth state to a response: replayed cookie writes (in
   * order, so the last write per name wins), the no-cache headers Supabase
   * requires for responses carrying auth cookies, and — when the session is
   * confirmed dead — an explicit clear of any session cookie still present.
   * The explicit clear is idempotent: on already-clean requests it matches
   * nothing and does nothing.
   */
  const withAuthState = (response: NextResponse): NextResponse => {
    for (const { name, value, options } of pendingCookies) {
      response.cookies.set(name, value, options);
    }
    for (const [key, value] of Object.entries(pendingHeaders)) {
      response.headers.set(key, value);
    }
    if (sessionInvalid) {
      // A dead refresh token must be dropped immediately, otherwise every
      // subsequent request replays the same failing refresh. Clearing here (on
      // the response the browser actually receives — redirect or not) is what
      // stops the retry loop; protected paths then land on /login below.
      for (const { name } of request.cookies.getAll()) {
        if (isSessionCookieName(name)) {
          response.cookies.set(name, '', { path: '/', sameSite: 'lax', maxAge: 0 });
        }
      }
    }
    return response;
  };

  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));

  if (!user && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', pathname);
    return withAuthState(NextResponse.redirect(redirectUrl));
  }

  if (user && (pathname === '/login' || pathname === '/register')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/chat';
    redirectUrl.search = '';
    return withAuthState(NextResponse.redirect(redirectUrl));
  }

  return withAuthState(supabaseResponse);
}
