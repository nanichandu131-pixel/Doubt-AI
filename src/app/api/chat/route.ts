import { NextResponse } from 'next/server';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { getProvider, SYSTEM_PROMPT } from '@/lib/llm/provider';
import { checkRateLimit } from '@/lib/rate-limit';
import { chatRequestSchema } from '@/lib/validation/schemas';
import { getCreatorIntro, getCreatorMode, isCreatorQuestion } from '@/lib/creator';
import { extractText } from '@/types/chat';

export const maxDuration = 60;

function errorMessage(error: unknown): string {
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

    const result = streamText({
      model: provider.getModel(),
      instructions: SYSTEM_PROMPT,
      messages: modelMessages,
      onError: ({ error }) => {
        console.error('[api/chat] model call failed:', error);
      },
      onFinish: async ({ text }) => {
        if (text.trim()) {
          const { error } = await supabase
            .from('messages')
            .insert({ id: assistantMessageId, conversation_id: conversationId, role: 'assistant', content: text });
          if (error) {
            console.error('[api/chat] failed to save assistant message:', error);
          }
        }
      },
    });

    return result.toUIMessageStreamResponse({
      generateMessageId: () => assistantMessageId,
      onError: (error) => {
        console.error('[api/chat] stream error:', error);
        return errorMessage(error);
      },
    });
  } catch (error) {
    console.error('[api/chat] unhandled error:', error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 500 });
  }
}
