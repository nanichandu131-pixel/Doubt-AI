'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle2, Eye, EyeOff, Loader2, Mail, LockKeyhole, UserRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { GoogleOAuthButton } from './google-oauth-button';
import { createClient } from '@/lib/supabase/client';
import { getAuthBaseUrl } from '@/lib/site-url';
import { registerSchema } from '@/lib/validation/schemas';
import type { z } from 'zod';

type FormValues = z.infer<typeof registerSchema>;

/** Supabase/GoTrue returns this message when its mailer can't deliver the confirmation email. */
const CONFIRM_EMAIL_ERROR = /error sending confirmation email/i;

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(registerSchema), mode: 'onBlur' });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setSubmitError(null);

    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const message = 'Supabase is not configured yet. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment settings.';
        setSubmitError(message);
        toast.error(message);
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { full_name: values.fullName },
          emailRedirectTo: `${getAuthBaseUrl()}/auth/callback`,
        },
      });

      if (error) {
        const message =
          error.status === 500 || CONFIRM_EMAIL_ERROR.test(error.message)
            ? 'We couldn\u2019t send the confirmation email. Check your Supabase Authentication \u2192 SMTP settings, then try again.'
            : error.message;
        setSubmitError(message);
        toast.error(message);
        return;
      }

      // If a session is returned, the account was created and auto-confirmed
      // (email confirmation is disabled in Supabase). Log the user straight in.
      if (data.session) {
        toast.success('Account created — welcome aboard!');
        router.push('/chat');
        router.refresh();
        return;
      }

      // Otherwise email confirmation is required — prompt the user to verify.
      setSubmittedEmail(values.email);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create your account right now.';
      setSubmitError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (submittedEmail) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Card className="border-white/10 bg-slate-900/80 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-white">Check your inbox</h2>
              <p className="text-sm text-slate-300">
                We sent a confirmation link to <span className="font-medium text-white">{submittedEmail}</span>.
                Click it to activate your account.
              </p>
            </div>
            <Link href="/login" className="text-sm font-medium text-primary hover:underline">
              Back to login
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Card className="border-white/10 bg-slate-900/80 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
        <CardHeader className="space-y-3 pb-5">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <UserRound className="h-4 w-4" />
            </div>
            Create account
          </div>
          <CardTitle className="text-3xl font-semibold tracking-tight text-white">Create your account</CardTitle>
          <CardDescription className="text-sm text-slate-300">Start getting instant, step-by-step help with your doubts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <GoogleOAuthButton />
          <div className="flex items-center gap-3">
            <Separator className="flex-1 bg-white/10" />
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">Or</span>
            <Separator className="flex-1 bg-white/10" />
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium text-slate-200">
                Full name
              </Label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="fullName"
                  autoComplete="name"
                  placeholder="Ada Lovelace"
                  className="h-11 border-white/10 bg-slate-800/80 pl-10 text-white placeholder:text-slate-400 focus-visible:ring-primary/70"
                  {...register('fullName')}
                  aria-invalid={Boolean(errors.fullName)}
                />
              </div>
              {errors.fullName && <p className="text-sm text-red-400">{errors.fullName.message}</p>}
            </div>

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
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
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
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
          <p className="text-center text-sm text-slate-300">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
