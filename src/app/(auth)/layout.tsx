import Link from 'next/link';
import { ArrowRight, BookOpenText, ShieldCheck, Sparkles } from 'lucide-react';

const highlights = [
  { icon: BookOpenText, title: 'AI study support', text: 'Get clear explanations for your doubts in seconds.' },
  { icon: ShieldCheck, title: 'Your progress stays safe', text: 'Secure sessions and saved conversations in one place.' },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020817] px-4 py-8 sm:px-6 lg:px-8">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.2),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_26%)]" />

      <div className="grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-2xl shadow-slate-950/30 backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden flex-col justify-between border-r border-white/10 bg-slate-950/60 p-8 lg:flex">
          <div className="flex items-center gap-3 text-lg font-semibold text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            DoubtAI
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary/80">Welcome back</p>
              <h1 className="max-w-sm text-4xl font-semibold tracking-tight text-white">Your doubts deserve clear answers.</h1>
            </div>

            <div className="space-y-4">
              {highlights.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{title}</p>
                    <p className="mt-1 text-sm text-slate-300">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-300">
            <span>Need an account?</span>
            <Link href="/register" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              Create one <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center bg-slate-950/70 p-5 sm:p-8 lg:p-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
