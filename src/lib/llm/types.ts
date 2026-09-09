import type { LanguageModel } from 'ai';

export type LLMProviderId = 'openai' | 'gemini' | 'anthropic';

export interface LLMProvider {
  readonly id: LLMProviderId;
  readonly model: string;
  /** Returns an AI-SDK-compatible language model instance for use with `streamText`. */
  getModel(): LanguageModel;
}
