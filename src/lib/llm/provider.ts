import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';
import type { LLMProvider, LLMProviderId } from './types';
import { openaiProvider } from './providers/openai';
import { geminiProvider } from './providers/gemini';
import { anthropicProvider } from './providers/anthropic';

const providers: Record<LLMProviderId, LLMProvider> = {
  openai: openaiProvider,
  gemini: geminiProvider,
  anthropic: anthropicProvider,
};

function normalizeProviderId(value: string | undefined): LLMProviderId {
  if (!value) {
    if ((process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY) && !process.env.OPENAI_API_KEY) {
      return 'gemini';
    }
  }
  const normalized = (value ?? 'openai').trim().toLowerCase();
  return normalized === 'google' ? 'gemini' : normalized === 'claude' ? 'anthropic' : normalized === 'openai' || normalized === 'gemini' || normalized === 'anthropic' ? normalized : 'openai';
}

function validateRuntimeConfig(id: LLMProviderId): void {
  if (id === 'openai') {
    const openAiKey = process.env.OPENAI_API_KEY?.trim();
    if (!openAiKey) {
      throw new Error('Missing OPENAI_API_KEY. Set a valid OpenAI API key in .env.local or your deployment env.');
    }

    const model = (process.env.OPENAI_MODEL ?? 'gpt-4o-mini').trim();
    if (model.startsWith('custom/')) {
      throw new Error('The app is not configured for a Vercel AI Gateway custom model. Set OPENAI_MODEL to a standard OpenAI model like gpt-4o-mini or gpt-4.1-mini and keep OPENAI_API_KEY as the real OpenAI key.');
    }
  }

  if (id === 'gemini') {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() && !process.env.GEMINI_API_KEY?.trim()) {
      throw new Error('Missing GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY for LLM_PROVIDER=gemini.');
    }
  }

  if (id === 'anthropic') {
    if (!process.env.ANTHROPIC_API_KEY?.trim()) {
      throw new Error('Missing ANTHROPIC_API_KEY for LLM_PROVIDER=anthropic.');
    }
  }
}

/** Selects the active LLM provider from `LLM_PROVIDER` (defaults to OpenAI). Swap providers with a single env var — no code changes. */
export function getProvider(): LLMProvider {
  const id = normalizeProviderId(process.env.LLM_PROVIDER);
  validateRuntimeConfig(id);
  return providers[id] ?? providers.openai;
}

/**
 * Returns an alternative model for automatic fallback when the primary provider
 * hits a quota or rate-limit error. Uses `ALTERNATIVE_AI_API_KEY`.
 * Returns `null` when no alternative key is configured — caller skips fallback.
 */
export function getFallbackModel(): LanguageModel | null {
  const apiKey = process.env.ALTERNATIVE_AI_API_KEY?.trim();
  if (!apiKey) return null;
  const model = (process.env.ALTERNATIVE_MODEL ?? 'gpt-5-mini').trim();
  const baseURL = process.env.ALTERNATIVE_BASE_URL?.trim();
  return createOpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) })(model);
}

export const SYSTEM_PROMPT = `You are a friendly, patient AI tutor helping students understand concepts across any subject.
- Explain clearly and step by step, adapting to the student's apparent level.
- Use markdown: headings, lists, and fenced code blocks with a language tag for any code.
- Use LaTeX math ($...$ inline, $$...$$ block) for mathematical notation.
- Ask a brief clarifying question only if the doubt is genuinely ambiguous; otherwise answer directly.
- Keep answers focused and avoid unnecessary padding.
- Be time-aware: general-knowledge facts can go stale. If a question depends on the present (current office-holders, appointments, latest events, statistics, awards, leaders), rely on the connected web-search tool when it is enabled and anchor time-sensitive facts with "As of <Month Year>, ...". Never present outdated knowledge as current — if the current status cannot be verified, say so clearly instead of guessing. Answer past questions from historical knowledge, and for future questions state clearly that the outcome cannot be confirmed yet.

If a student asks who created Doubt AI (e.g. "Who created you?", "Who developed this chatbot?"), answer in ONE concise sentence that names Nellore Chandu — a full creator profile card is shown automatically, so do not recite his bio, education, or contact details unless explicitly asked.`;
