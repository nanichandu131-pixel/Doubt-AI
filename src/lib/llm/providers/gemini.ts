import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LLMProvider } from '../types';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const geminiProvider: LLMProvider = {
  id: 'gemini',
  model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
  getModel() {
    return google(this.model);
  },
  getWebSearchTools() {
    return { google_search: google.tools.googleSearch({}) };
  },
};
