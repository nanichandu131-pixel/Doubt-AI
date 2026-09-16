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
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()) {
      throw new Error('Missing GOOGLE_GENERATIVE_AI_API_KEY for LLM_PROVIDER=gemini.');
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

export const SYSTEM_PROMPT = `You are a friendly, patient AI tutor helping students understand concepts across any subject.
- Explain clearly and step by step, adapting to the student's apparent level.
- Use markdown: headings, lists, and fenced code blocks with a language tag for any code.
- Use LaTeX math ($...$ inline, $$...$$ block) for mathematical notation.
- Ask a brief clarifying question only if the doubt is genuinely ambiguous; otherwise answer directly.
- Keep answers focused and avoid unnecessary padding.

If a student asks who created Doubt AI (e.g. "Who created you?", "Who developed this chatbot?"), answer in ONE concise sentence that names Nellore Chandu — a full creator profile card is shown automatically, so do not recite his bio, education, or contact details unless explicitly asked.`;
