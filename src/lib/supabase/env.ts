// Server / proxy only. Never import from client components.
// NEXT_PUBLIC_* values are frozen at build time by Next.js. Prefer live runtime
// values so a deployment is no longer hostage to what was inlined during build.
// Use truthy fallthrough (`||`) so a variable that exists but is EMPTY is treated
// as MISSING instead of silently bypassing the fallback and breaking the client.

const INLINE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const INLINE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const INLINE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function runtimeGet(name: string): string | undefined {
  const env = typeof process !== 'undefined' ? process.env : undefined;
  if (!env) return undefined;
  return (env as Record<string, string | undefined>)[name];
}

export function getSupabaseUrl(): string {
  return runtimeGet('NEXT_PUBLIC_SUPABASE_URL') || INLINE_URL || '';
}

export function getAnonKey(): string {
  return (
    runtimeGet('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
    runtimeGet('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ||
    INLINE_ANON_KEY ||
    INLINE_PUBLISHABLE_KEY ||
    ''
  );
}

export function getServiceRoleKey(): string {
  return runtimeGet('SUPABASE_SERVICE_ROLE_KEY') || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

type VarReport = { state: 'PRESENT' | 'MISSING'; length: number };

function describeEnv(name: string): VarReport {
  const value = runtimeGet(name);
  return value ? { state: 'PRESENT', length: value.length } : { state: 'MISSING', length: 0 };
}

function resolvedUrlSource(): 'runtime' | 'fallback' | 'missing' {
  if (runtimeGet('NEXT_PUBLIC_SUPABASE_URL')) return 'runtime';
  if (INLINE_URL) return 'fallback';
  return 'missing';
}

function resolvedAnonKeySource(): 'anon' | 'publishable' | 'missing' {
  if (runtimeGet('NEXT_PUBLIC_SUPABASE_ANON_KEY')) return 'anon';
  if (runtimeGet('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')) return 'publishable';
  if (INLINE_ANON_KEY) return 'anon';
  if (INLINE_PUBLISHABLE_KEY) return 'publishable';
  return 'missing';
}

const loggedLabels = new Set<string>();

/**
 * Safe, value-free diagnostic for production. Reports PRESENT / MISSING plus
 * string length per variable, which resolved source fed the client, and which
 * client type is being created. Never prints the actual value or any secret.
 * Logged once per process.
 */
export function logSupabaseEnvDiagnostics(label: 'middleware' | 'server' | 'service-role'): void {
  if (loggedLabels.has(label)) return;
  loggedLabels.add(label);

  const report = {
    client: label,
    supabaseUrl: describeEnv('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: describeEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    publishableKey: describeEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
    serviceRoleKey: describeEnv('SUPABASE_SERVICE_ROLE_KEY'),
    resolvedUrlSource: resolvedUrlSource(),
    resolvedAnonKeySource: resolvedAnonKeySource(),
  };
  console.error('[supabase-env]', JSON.stringify(report));
}