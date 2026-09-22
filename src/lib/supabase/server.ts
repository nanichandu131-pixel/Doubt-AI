import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { getAnonKey, getServiceRoleKey, getSupabaseUrl, logSupabaseEnvDiagnostics } from './env';

/** Server Components / Route Handlers / Server Actions — respects RLS via the caller's session. */
export async function createClient() {
  const cookieStore = await cookies();
  logSupabaseEnvDiagnostics('server');

  const url = getSupabaseUrl() || 'https://placeholder.supabase.co';
  const anonKey = getAnonKey() || 'placeholder-anon-key';

  return createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component — middleware handles session refresh instead.
          }
        },
      },
    },
  );
}

/**
 * Service-role client — bypasses RLS. Server-only, never import from client components.
 * Use only for privileged operations (e.g. account deletion) after verifying the caller's session.
 */
export function createServiceRoleClient() {
  logSupabaseEnvDiagnostics('service-role');
  const url = getSupabaseUrl() || 'https://placeholder.supabase.co';
  const serviceRoleKey = getServiceRoleKey() || 'placeholder-service-role-key';

  return createSupabaseClient<Database>(
    url,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
