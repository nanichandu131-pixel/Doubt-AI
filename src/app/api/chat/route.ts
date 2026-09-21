import { NextResponse } from 'next/server';
import { streamText, convertToModelMessages, type UIMessage, type LanguageModel, type ToolSet } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { getProvider, getFallbackModel, SYSTEM_PROMPT } from '@/lib/llm/provider';
import { checkRateLimit } from '@/lib/rate-limit';
import { chatRequestSchema } from '@/lib/validation/schemas';
import { getCreatorIntro, getCreatorMode, isCreatorQuestion } from '@/lib/creator';
import { buildTimeAwareInstructions, classifyTimeSensitivity } from '@/lib/llm/current-affairs';
import { extractText } from '@/types/chat';

export const maxDuration = 60;

function isQuotaOrRateLimit(error: unknown): boolean {
  const candidates: unknown[] = [error];
  if (typeof error === 'object' && error !== null) {
    if ('lastError' in error) candidates.push((error as { lastError: unknown }).lastError);
    if ('cause' in error) candidates.push((error as { cause: unknown }).cause);
  }
  for (const e of candidates) {
    if (!(e instanceof Error)) continue;
    const msg = e.message.toLowerCase();
    if (msg.includes('quota') || msg.includes('429') || msg.includes('rate limit') || msg.includes('exceeded')) return true;
    if ('statusCode' in e && (e as { statusCode?: number }).statusCode === 429) return true;
  }
  return false;
}

/** Returns `true` when the error is a temporary provider/model overload (e.g. OpenAI "high demand"). */
function isProviderOverload(error: unknown): boolean {
  const candidates: unknown[] = [error];
  if (typeof error === 'object' && error !== null) {
    if ('lastError' in error) candidates.push((error as { lastError: unknown }).lastError);
    if ('cause' in error) candidates.push((error as { cause: unknown }).cause);
  }
  for (const e of candidates) {
    if (!(e instanceof Error)) continue;
    const msg = e.message.toLowerCase();
    if (msg.includes('high demand') || msg.includes('overloaded') || msg.includes('temporarily unavailable')) return true;
  }
  return false;
}

function errorMessage(error: unknown): string {
  if (isProviderOverload(error)) {
    return 'The AI service is temporarily unavailable. Please try again shortly.';
  }
  if (isQuotaOrRateLimit(error)) {
    return 'You\u2019ve reached the AI usage limit. Please try again in a few minutes, or contact support if this persists.';
  }
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error && 'message' in error) return String((error as { message: unknown }).message);
  return 'Something went wrong while generating a response.';
}

/** Extracts persisted file parts (data-URL images) that should be saved with the user message. */
function extractFilePartsOf(lastMessage: UIMessage): Array<{ type: 'file'; mediaType: string; filename?: string; url: string }> {
  return lastMessage.parts
    .filter((part) => part.type === 'file')
    .map((part) => ({
      type: 'file' as const,
      mediaType: part.mediaType,
      filename: part.filename,
      url: part.url,
    }));
}

/** Minimal SSE stream matching the AI SDK UI-message transport so `useChat` parses it natively. */
function creatorStreamResponse(responseMessageId: string, text: string): Response {
  const textId = `text-${responseMessageId}`;
  const chunks: unknown[] = [
    { type: 'start', messageId: responseMessageId },
    { type: 'text-start', id: textId },
    { type: 'text-delta', id: textId, delta: text },
    { type: 'text-end', id: textId },
    { type: 'finish', finishReason: 'stop' },
  ];
  const body = chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join('') + 'data: [DONE]\n\n';
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

/** Returns `true` when the accumulated SSE text contains a quota / rate-limit / overload error event. */
function hasRetryableProviderErrorInSSE(text: string): boolean {
  for (const line of text.split('\n')) {
    if (!line.startsWith('data: ')) continue;
    const json = line.slice(6).trim();
    if (!json || json === '[DONE]') continue;
    try {
      const event = JSON.parse(json);
      if (event.type === 'error' && (isQuotaOrRateLimit(event.error) || isProviderOverload(event.error))) return true;
    } catch {
      /* incomplete JSON fragment – ignore */
    }
  }
  return false;
}

/**
 * Creates a `streamText` call with the fallback model and returns its UI-message stream
 * response. Used when the primary provider hits a quota / rate-limit error.
 */
function fallbackStreamResponse(
  model: LanguageModel,
  instructions: string,
  messages: Awaited<ReturnType<typeof convertToModelMessages>>,
  saveMessage: (text: string) => Promise<void>,
  assistantMessageId: string,
): Response {
  const result = streamText({
    model,
    instructions,
    messages,
    maxRetries: 0,
    onError: ({ error }) => console.error('[api/chat] fallback model call failed:', error),
    onFinish: async ({ text }) => {
      if (text.trim()) await saveMessage(text);
    },
  });
  return result.toUIMessageStreamResponse({
    generateMessageId: () => assistantMessageId,
    onError: (error) => {
      console.error('[api/chat] fallback stream error:', error);
      return errorMessage(error);
    },
  });
}

/**
 * Attempts to stream with the primary model. Reads the first few SSE chunks to detect
 * quota / rate-limit errors **before** any text content is forwarded to the client.
 * If detected, transparently retries with the fallback model instead.
 */
async function streamWithFallback({
  model,
  fallbackModel,
  instructions,
  messages,
  tools,
  saveMessage,
  assistantMessageId,
}: {
  model: LanguageModel;
  fallbackModel: LanguageModel | null;
  instructions: string;
  messages: Awaited<ReturnType<typeof convertToModelMessages>>;
  tools?: ToolSet;
  saveMessage: (text: string) => Promise<void>;
  assistantMessageId: string;
}): Promise<Response> {
  const result = streamText({
    model,
    instructions,
    messages,
    maxRetries: 0,
    ...(tools ? { tools } : {}),
    onError: ({ error }) => console.error('[api/chat] model call failed:', error),
    onFinish: async ({ text }) => {
      if (text.trim()) await saveMessage(text);
    },
  });

  const response = result.toUIMessageStreamResponse({
    generateMessageId: () => assistantMessageId,
    onError: (error) => {
      console.error('[api/chat] stream error:', error);
      return errorMessage(error);
    },
  });

  if (!response.body || !fallbackModel) return response;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const headChunks: Uint8Array[] = [];

  try {
    let resolved = false;
    while (!resolved) {
      const { value, done } = await reader.read();
      if (done) {
        resolved = true;
        break;
      }

      headChunks.push(value);
      buffer += decoder.decode(value, { stream: true });

      // Text content is flowing — primary provider is healthy
      if (buffer.includes('"text-delta"')) {
        resolved = true;
        break;
      }

      // Quota / rate-limit / overload error detected before any text → switch to fallback
      if (hasRetryableProviderErrorInSSE(buffer)) {
        await reader.cancel();
        console.log('[api/chat] primary provider hit quota/rate/overload — trying fallback provider');
        return fallbackStreamResponse(fallbackModel, instructions, messages, saveMessage, assistantMessageId);
      }

      // Safety: stop checking after a reasonable amount of data
      if (buffer.length > 4096) {
        resolved = true;
      }
    }
  } catch (readError) {
    try {
      await reader.cancel();
    } catch {
      /* swallow cancel error */
    }
    if (isQuotaOrRateLimit(readError) || isProviderOverload(readError)) {
      console.log('[api/chat] primary provider stream failed — trying fallback provider');
      return fallbackStreamResponse(fallbackModel, instructions, messages, saveMessage, assistantMessageId);
    }
    throw readError;
  }

  // Primary provider is healthy — reassemble the stream from buffered chunks + remainder
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of headChunks) controller.enqueue(chunk);
      (async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } catch (err) {
          controller.error(err);
        }
        controller.close();
      })();
    },
  });

  return new Response(stream, { status: response.status, headers: response.headers });
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { allowed, retryAfterMs } = checkRateLimit(user.id);
    if (!allowed) {
      return NextResponse.json(
        { message: 'Too many requests. Please wait a moment before asking another doubt.' },
        { status: 429, headers: { 'Retry-After': Math.ceil(retryAfterMs / 1000).toString() } },
      );
    }

    const json = await req.json();
    const parsed = chatRequestSchema.safeParse(json);
    if (!parsed.success) {
      console.error('[api/chat] invalid request body:', parsed.error.flatten());
      return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
    }

    const conversationId = parsed.data.id;
    const messages = parsed.data.messages as UIMessage[];
    const lastMessage = messages[messages.length - 1];

    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json({ message: 'The last message must be from the user' }, { status: 400 });
    }

    const userText = extractText(lastMessage);
    const attachments = extractFilePartsOf(lastMessage);
    const hasContent = Boolean(userText.trim()) || attachments.length > 0;
    if (!hasContent) {
      return NextResponse.json({ message: 'Message cannot be empty' }, { status: 400 });
    }

    const provider = getProvider();

    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!existingConversation) {
      const title = userText.trim() ? userText.slice(0, 60) : undefined;
      const { error: insertConversationError } = await supabase
        .from('conversations')
        .insert({ id: conversationId, user_id: user.id, title, provider: provider.id });

      if (insertConversationError) {
        console.error('[api/chat] failed to create conversation:', insertConversationError);
        return NextResponse.json({ message: 'Could not start a new conversation' }, { status: 500 });
      }
    }

    // `lastMessage.id` is a client-generated UUID (see `generateId` in useChat) — using it as the
    // row's primary key makes this insert naturally idempotent against retries.
    const messageRow = { id: lastMessage.id, conversation_id: conversationId, role: 'user' as const, content: userText };
    const rowWithAttachments = attachments.length > 0 ? { ...messageRow, attachments } : messageRow;
    const { error: insertMessageError } = await supabase
      .from('messages')
      .upsert(rowWithAttachments, { onConflict: 'id', ignoreDuplicates: true });

    // Fallback for databases that haven't run the 0002_attachments migration yet:
    // save the message without the attachments column rather than failing the whole send.
    if (insertMessageError && attachments.length > 0) {
      const { error: retryWithoutAttachments } = await supabase
        .from('messages')
        .upsert(messageRow, { onConflict: 'id', ignoreDuplicates: true });
      if (retryWithoutAttachments) {
        console.error('[api/chat] failed to save user message:', retryWithoutAttachments);
        return NextResponse.json({ message: 'Could not save your message' }, { status: 500 });
      }
    } else if (insertMessageError) {
      console.error('[api/chat] failed to save user message:', insertMessageError);
      return NextResponse.json({ message: 'Could not save your message' }, { status: 500 });
    }

    // "About the creator" questions are answered instantly with a curated profile card instead of
    // the LLM — deterministic, free, and fast. The card itself is rendered client-side from the
    // preceding user message; only a short lead-in text is streamed here.
    if (isCreatorQuestion(userText)) {
      const creatorAnswer = getCreatorIntro(getCreatorMode(userText));
      const creatorMessageId = crypto.randomUUID();
      const { error: insertCreatorError } = await supabase
        .from('messages')
        .insert({ id: creatorMessageId, conversation_id: conversationId, role: 'assistant', content: creatorAnswer });

      if (insertCreatorError) {
        console.error('[api/chat] failed to save creator answer:', insertCreatorError);
      }

      return creatorStreamResponse(creatorMessageId, creatorAnswer);
    }

    const modelMessages = await convertToModelMessages(messages);
    const assistantMessageId = crypto.randomUUID();

    const timeSensitivity = classifyTimeSensitivity(userText);
    const webSearchTools = timeSensitivity.needsLiveData ? provider.getWebSearchTools?.() : undefined;
    const instructions = buildTimeAwareInstructions(SYSTEM_PROMPT, userText, new Date(), Boolean(webSearchTools));

    const fallbackModel = getFallbackModel();

    return streamWithFallback({
      model: provider.getModel(),
      fallbackModel,
      instructions,
      messages: modelMessages,
      tools: webSearchTools,
      assistantMessageId,
      saveMessage: async (text) => {
        const { error } = await supabase
          .from('messages')
          .insert({ id: assistantMessageId, conversation_id: conversationId, role: 'assistant', content: text });
        if (error) console.error('[api/chat] failed to save assistant message:', error);
      },
    });
  } catch (error) {
    console.error('[api/chat] unhandled error:', error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}
