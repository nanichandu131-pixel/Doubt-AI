import { anthropic } from '@ai-sdk/anthropic';
import type { LLMProvider } from '../types';

export const anthropicProvider: LLMProvider = {
  id: 'anthropic',
  model: process.env.ANTHROPIC_MODEL ?? 'claude-3-5-haiku-latest',
  getModel() {
    return anthropic(this.model);
  },
};
