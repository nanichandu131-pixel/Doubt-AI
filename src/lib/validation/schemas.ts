import { z } from 'zod';

export const chatRequestSchema = z.object({
  id: z.string().uuid(),
  messages: z
    .array(
      z.object({
        id: z.string(),
        role: z.enum(['user', 'assistant', 'system']),
        parts: z.array(z.record(z.string(), z.unknown())),
      }),
    )
    .min(1),
});

export const profileUpdateSchema = z.object({
  full_name: z.string().trim().min(1, 'Name is required').max(80).optional(),
  avatar_url: z.string().url().optional(),
  theme: z.enum(['system', 'light', 'dark']).optional(),
});

export const bookmarkCreateSchema = z.object({
  messageId: z.string().uuid(),
  note: z.string().max(500).optional(),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(1, 'Name is required').max(80),
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
