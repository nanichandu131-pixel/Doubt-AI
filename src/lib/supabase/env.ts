// Server / proxy only. Never import from client components.
// NEXT_PUBLIC_* values are frozen at build time by Next.js. Prefer live runtime
// values so a deployment is no longer hostage to what was inlined during build.

const INLINE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const INLINE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const INLINE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function runtimeGet(name: string): string | undefined {
  const env = typeof process !== 'undefined' ? process.env : undefined;
  if (!env) return undefined;
  return (env as Record<string, string | undefined>)[name];
}

export function getSupabaseUrl(): string {
  return runtimeGet('NEXT_PUBLIC_SUPABASE_URL') ?? INLINE_URL ?? '';
}

export function getAnonKey(): string {
  return (
    runtimeGet('NEXT_PUBLIC_SUPABASE_ANON_KEY') ??
    runtimeGet('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ??
    INLINE_ANON_KEY ??
    INLINE_PUBLISHABLE_KEY ??
    ''
  );
}

export function getServiceRoleKey(): string {
  return runtimeGet('SUPABASE_SERVICE_ROLE_KEY') ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
}

type VarReport = { state: 'PRESENT' | 'MISSING'; length: number };

function describeEnv(name: string): VarReport {
  const value = runtimeGet(name);
  return value ? { state: 'PRESENT', length: value.length } : { state: 'MISSING', length: 0 };
}

function anonSource(): 'ANON_KEY' | 'PUBLISHABLE_KEY' | 'MISSING' {
  if (runtimeGet('NEXT_PUBLIC_SUPABASE_ANON_KEY')) return 'ANON_KEY';
  if (runtimeGet('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')) return 'PUBLISHABLE_KEY';
  return 'MISSING';
}

const loggedLabels = new Set<string>();

/**
 * Safe, value-free diagnostic for production. Reports PRESENT / MISSING plus
 * string length per variable and which resolved key source is in use.
 * Never prints the actual value or any secret. Logged once per process.
 */
export function logSupabaseEnvDiagnostics(label: string): void {
  if (loggedLabels.has(label)) return;
  loggedLabels.add(label);

  const report = {
    client: label,
    supabaseUrl: describeEnv('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: describeEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    publishableKey: describeEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
    serviceRoleKey: describeEnv('SUPABASE_SERVICE_ROLE_KEY'),
    resolvedAnonKeySource: anonSource(),
    resolvedUrlState: getSupabaseUrl() ? 'PRESENT' : 'MISSING',
    resolvedKeyState: getAnonKey() ? 'PRESENT' : 'MISSING',
  };
  console.error('[supabase-env]', JSON.stringify(report));
}