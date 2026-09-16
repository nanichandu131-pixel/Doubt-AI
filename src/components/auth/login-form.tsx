'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Mail, LockKeyhole } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { GoogleOAuthButton } from './google-oauth-button';
import { createClient } from '@/lib/supabase/client';
import { loginSchema } from '@/lib/validation/schemas';
import type { z } from 'zod';

type FormValues = z.infer<typeof loginSchema>;

/** Query-string error reasons set by the auth callback / middleware, mapped to a friendly hint. */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  auth_exchange_failed: 'Your confirmation link could not be completed. Please sign in with your email and password.',
  auth_callback_error: 'Something went wrong while finishing the sign-in. Please try again.',
  auth_failed: 'The sign-in was not completed. Please try again.',
  verification_link_expired: 'That verification link has expired. Sign in below — a new confirmation email was triggered.',
  verification_failed: 'We could not verify that link. Please sign in below.',
  auth: 'Please sign in to continue.',
};

export function LoginForm() {
  const router = useRouter();
  // Read query params directly instead of `useSearchParams()` — that hook requires a
  // `Suspense` boundary, and this app's streaming setup was leaving Suspense-wrapped
  // content stuck in a hidden, never-revealed node. Avoiding the hook sidesteps the bug.
  // The lazy initializer only sees a real URL on the client; it's fine that it resolves to
  // the fallback during SSR since these values are never rendered directly.
  const params = typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search);
  const [redirect] = useState(() => params.get('redirect') || '/chat');
  const [initialError] = useState(() => AUTH_ERROR_MESSAGES[params.get('error') ?? ''] ?? null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(initialError);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(loginSchema), mode: 'onBlur' });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setSubmitError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword(values);

      if (error) {
        setSubmitError(error.message);
        toast.error(error.message);
        return;
      }

      toast.success('Welcome back!');
      router.push(redirect);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in right now.';
      setSubmitError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Card className="border-white/10 bg-slate-900/80 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
        <CardHeader className="space-y-3 pb-5">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Mail className="h-4 w-4" />
            </div>
            Sign in
          </div>
          <CardTitle className="text-3xl font-semibold tracking-tight text-white">Welcome back</CardTitle>
          <CardDescription className="text-sm text-slate-300">Sign in to continue getting your doubts solved.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <GoogleOAuthButton redirect={redirect} />

          <div className="flex items-center gap-3">
            <Separator className="flex-1 bg-white/10" />
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">Or</span>
            <Separator className="flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-200">
                Email
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="h-11 border-white/10 bg-slate-800/80 pl-10 text-white placeholder:text-slate-400 focus-visible:ring-primary/70"
                  {...register('email')}
                  aria-invalid={Boolean(errors.email)}
                />
              </div>
              {errors.email && <p className="text-sm text-red-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-200">
                Password
              </Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="h-11 border-white/10 bg-slate-800/80 pl-10 pr-11 text-white placeholder:text-slate-400 focus-visible:ring-primary/70"
                  {...register('password')}
                  aria-invalid={Boolean(errors.password)}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-400">{errors.password.message}</p>}
            </div>

            {submitError && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{submitError}</p>}

            <Button type="submit" className="h-11 w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-300">
            New here?{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
