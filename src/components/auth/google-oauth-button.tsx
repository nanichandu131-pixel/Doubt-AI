'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { getAuthBaseUrl } from '@/lib/site-url';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { AuthError } from '@supabase/supabase-js';

const PROVIDER_DISABLED_MESSAGE =
  "Google sign-in isn't enabled on the server yet. Please enable the Google provider in your Supabase dashboard (Authentication → Providers) and try again.";

/** Supabase returns 400 validation_failed when the Google provider is disabled on the project. */
function isProviderDisabled(error: AuthError): boolean {
  return (
    error.code === 'validation_failed' ||
    /provider is not enabled/i.test(error.message)
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v2.97h3.86c2.26-2.09 3.56-5.17 3.56-8.79z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-2.97c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.07C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.32A7.15 7.15 0 0 1 4.87 12c0-.8.14-1.58.4-2.32V6.61H1.29A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.29 5.39z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.98 3.07C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

export function GoogleOAuthButton({ redirect }: { redirect?: string }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const supabase = createClient();
    const callbackUrl = new URL('/auth/callback', getAuthBaseUrl());
    if (redirect) callbackUrl.searchParams.set('redirect', redirect);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      toast.error(isProviderDisabled(error) ? PROVIDER_DISABLED_MESSAGE : error.message);
      setLoading(false);
    }
  };

  return (
    <Button type="button" variant="outline" className="w-full" onClick={handleClick} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
      Continue with Google
    </Button>
  );
}
