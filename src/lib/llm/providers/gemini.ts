import { google } from '@ai-sdk/google';
import type { LLMProvider } from '../types';

export const geminiProvider: LLMProvider = {
  id: 'gemini',
  model: process.env.GEMINI_MODEL ?? 'gemini-3.6-flash',
  getModel() {
    return google(this.model);
  },
};
