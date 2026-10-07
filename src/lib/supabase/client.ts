import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

let browserClient: SupabaseClient<Database> | undefined;

/**
 * Supabase browser client — a stable singleton per page load.
 *
 * Every `createBrowserClient()` boots an independent auth pipeline (initial
 * refresh, auto-refresh ticker, auth listeners). When several instances hold
 * the same refresh token, Supabase's one-time-use rotation makes all but one
 * of them fail — typically with `refresh_token_not_found` — and the loser can
 * then clear the winner's freshly stored session. One shared instance keeps a
 * single refresh pipeline (and a single failure cooldown) per tab.
 *
 * Never cached during SSR: server-side renders must not share state.
 */
export function createClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    'placeholder-anon-key';

  if (typeof window === 'undefined') {
    return createBrowserClient<Database>(url, key);
  }

  browserClient ??= createBrowserClient<Database>(url, key);
  return browserClient;
}
