'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const PUBLIC_PATHS = ['/', '/login', '/register'];

/**
 * Small client-side helper mounted in the root layout.
 *
 * It performs two jobs that the server cannot do on its own:
 *
 * 1. Captures **implicit-flow** sessions. Email-confirmation links (and some
 *    older OAuth flows) hand their tokens over via the URL hash
 *    (`/#access_token=...`). The hash never reaches the server, so a browser
 *    Supabase client has to read it and persist the session. Creating the
 *    client with `detectSessionInUrl` enabled does exactly that.
 *
 * 2. Bounces an already-signed-in visitor away from public entry pages
 *    (landing / login / register) straight into the app.
 */
export function SessionBootstrapper() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();

    const session = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (currentSession && PUBLIC_PATHS.includes(pathname)) {
        router.replace('/chat');
      }
    });

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (data.session && PUBLIC_PATHS.includes(pathname)) {
          router.replace('/chat');
        }
      })
      .catch(() => {
        // Session lookup is best-effort; ignore transient failures and let the
        // proxy / dashboard layout enforce auth on the routes that need it.
      });

    return () => {
      session.data.subscription.unsubscribe();
    };
  }, [pathname, router]);

  return null;
}