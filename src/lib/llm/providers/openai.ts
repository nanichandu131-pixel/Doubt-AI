import { createOpenAI } from '@ai-sdk/openai';
import type { LLMProvider } from '../types';

const defaultModel = 'gpt-4o-mini';

export const openaiProvider: LLMProvider = {
  id: 'openai',
  model: (process.env.OPENAI_MODEL ?? defaultModel).trim() || defaultModel,
  getModel() {
    const baseURL = process.env.OPENAI_BASE_URL?.trim();
    const apiKey = process.env.OPENAI_API_KEY?.trim();

    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY. Set a valid OpenAI API key in your environment.');
    }

    if (this.model.startsWith('custom/')) {
      throw new Error('Custom model names like custom/blackbox-base are not valid for the standard OpenAI provider. Use a standard OpenAI model such as gpt-4o-mini or gpt-4.1-mini.');
    }

    const provider = createOpenAI({
      apiKey,
      ...(baseURL ? { baseURL } : {}),
    });

    return provider(this.model);
  },
};
