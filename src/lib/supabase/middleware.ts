import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getAnonKey, getSupabaseUrl, logSupabaseEnvDiagnostics } from './env';

const PROTECTED_PATHS = ['/chat', '/bookmarks', '/settings', '/profile'];

export async function updateSession(request: NextRequest) {
  const url = getSupabaseUrl();
  const anonKey = getAnonKey();

  if (!url || !anonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  logSupabaseEnvDiagnostics('middleware');
  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));

  if (!user && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && (pathname === '/login' || pathname === '/register')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/chat';
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
