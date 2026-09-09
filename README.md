# DoubtAI — AI-Powered Student Doubt Platform

A production-ready, ChatGPT-style AI tutor. Students sign in, ask doubts, and get streamed,
markdown-formatted, step-by-step answers with full conversation history and bookmarking.

## Stack

- **Framework**: Next.js (App Router, TypeScript, React 19)
- **Auth / Database / Storage**: [Supabase](https://supabase.com) (Postgres + Row Level Security, Email/Password + Google OAuth, Storage for avatars)
- **AI**: [Vercel AI SDK](https://ai-sdk.dev) with a provider-agnostic abstraction — OpenAI by default, swappable to Google Gemini or Anthropic Claude via one env var
- **UI**: Tailwind CSS, shadcn/ui, Framer Motion
- **Validation**: Zod + React Hook Form

## 1. Install dependencies

```bash
npm install
```

## 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project (the free tier is enough to start).
2. In **Project Settings → API**, copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key (click "Reveal") → `SUPABASE_SERVICE_ROLE_KEY` — treat this like a password, never commit or share it.

## 3. Run the database schema

1. In the Supabase dashboard, open **SQL Editor → New query**.
2. Paste the contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) and click **Run**.
3. Verify under **Table Editor** that `profiles`, `conversations`, `messages`, `bookmarks` exist, and under **Storage** that an `avatars` bucket exists.

## 4. Enable Google sign-in

1. In [Google Cloud Console](https://console.cloud.google.com), create/select a project → **APIs & Services → OAuth consent screen** → configure it (External is fine for personal use).
2. **APIs & Services → Credentials → Create Credentials → OAuth client ID** → type "Web application".
3. In the Supabase dashboard, go to **Authentication → Providers → Google** and copy the **Redirect URL** shown there.
4. Paste that URL into Google's **Authorized redirect URIs**, save, then copy the generated **Client ID** and **Client Secret** into the Supabase Google provider settings, and toggle it **Enabled**.

## 5. Get an OpenAI API key

1. Go to [platform.openai.com](https://platform.openai.com) → **Settings → Billing** → add a payment method (set a usage budget alert).
2. **API keys → Create new secret key** → copy it immediately → `OPENAI_API_KEY`.

## 6. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in the values gathered above. `.env.local` is gitignored — never commit it.

## 7. Run the app

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Switching the LLM provider

Set `LLM_PROVIDER` in `.env.local` to `openai`, `gemini`, or `anthropic`, and provide the matching API key
(`OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, or `ANTHROPIC_API_KEY`). No code changes required —
see [`src/lib/llm/provider.ts`](src/lib/llm/provider.ts).

## Project structure

```
src/
  app/            Routes (App Router) — (auth), (dashboard), api/*
  components/     UI, grouped by feature (auth, chat, dashboard, layout) + shadcn primitives in ui/
  lib/            Framework-agnostic logic: Supabase clients, LLM abstraction, validation, rate limiting
  hooks/          Client-side hooks
  types/          Database and chat types
supabase/
  migrations/     SQL schema, RLS policies, and storage bucket setup
```

## Scripts

```bash
npm run dev     # start the dev server
npm run build   # production build
npm run start   # run the production build
npm run lint    # ESLint
```
