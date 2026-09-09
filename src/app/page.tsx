import Link from 'next/link';
import { ArrowRight, BookMarked, MessageSquareText, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingReveal } from '@/components/landing/landing-reveal';

const features = [
  {
    icon: MessageSquareText,
    title: 'Ask anything, anytime',
    description: 'Type your doubt in plain language and get a clear, step-by-step explanation instantly.',
  },
  {
    icon: Zap,
    title: 'Streamed, live answers',
    description: 'Watch answers appear token-by-token, just like chatting with a real tutor.',
  },
  {
    icon: BookMarked,
    title: 'Never lose a good answer',
    description: 'Bookmark the explanations that click, and revisit your full chat history anytime.',
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="h-5 w-5 text-primary" />
          DoubtAI
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" nativeButton={false} render={<Link href="/login" />}>
            Sign in
          </Button>
          <Button nativeButton={false} render={<Link href="/register" />}>
            Get started
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center sm:px-10">
        <LandingReveal>
          <span className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Powered by AI, built for students
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Every doubt, <span className="text-primary">answered instantly.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            DoubtAI is your always-available tutor — ask a question, get a clear step-by-step explanation, and keep
            everything organized in one place.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" nativeButton={false} render={<Link href="/register" />}>
              Start asking doubts <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/login" />}>
              I already have an account
            </Button>
          </div>
        </LandingReveal>

        <div className="mt-24 grid w-full max-w-5xl gap-6 sm:grid-cols-3">
          {features.map((feature, index) => (
            <LandingReveal key={feature.title} delay={0.1 * (index + 1)}>
              <div className="flex h-full flex-col items-center gap-3 rounded-2xl border bg-card p-6 text-left sm:items-start">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </LandingReveal>
          ))}
        </div>
      </main>

      <footer className="border-t px-6 py-6 text-center text-sm text-muted-foreground sm:px-10">
        Built for curious minds. Answers are AI-generated — always verify anything critical.
      </footer>
    </div>
  );
}
