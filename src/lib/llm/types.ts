import type { LanguageModel, ToolSet } from 'ai';

export type LLMProviderId = 'openai' | 'gemini' | 'anthropic';

export interface LLMProvider {
  readonly id: LLMProviderId;
  readonly model: string;
  /** Returns an AI-SDK-compatible language model instance for use with `streamText`. */
  getModel(): LanguageModel;
  /** Provider-connected live web-search tools (e.g. Gemini Search Grounding) for current-affairs questions. */
  getWebSearchTools?(): ToolSet | undefined;
}
