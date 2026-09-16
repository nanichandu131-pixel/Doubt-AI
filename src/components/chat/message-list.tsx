'use client';

import { useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './message-bubble';
import { StreamingIndicator } from './streaming-indicator';
import { getCreatorMode, isCreatorQuestion } from '@/lib/creator';
import { extractText, type AppUIMessage } from '@/types/chat';

const SUGGESTIONS = [
  'Explain photosynthesis like I\'m 12 years old',
  'Walk me through solving a quadratic equation',
  'Why does time dilation happen in special relativity?',
  'Debug this: my Python loop never terminates',
];

export function MessageList({
  messages,
  status,
  bookmarkedIds,
  onToggleBookmark,
  onSuggestionClick,
  userInitial,
}: {
  messages: AppUIMessage[];
  status: 'submitted' | 'streaming' | 'ready' | 'error';
  bookmarkedIds: Set<string>;
  onToggleBookmark: (messageId: string) => void;
  onSuggestionClick: (text: string) => void;
  userInitial: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessage = messages[messages.length - 1];
  const lastText = lastMessage ? extractText(lastMessage) : '';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, lastText, status]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">What&apos;s your doubt today?</h2>
          <p className="mt-1 text-sm text-muted-foreground">Ask anything — I&apos;ll break it down step by step.</p>
        </div>
        <div className="grid w-full max-w-xl gap-2 sm:grid-cols-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => onSuggestionClick(suggestion)}
              className="rounded-xl border bg-card px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
        {messages.map((message, index) => {
          const previousUserText =
            message.role === 'assistant' && index > 0 && messages[index - 1].role === 'user'
              ? extractText(messages[index - 1])
              : '';
          const creatorMode = previousUserText
            ? isCreatorQuestion(previousUserText)
              ? getCreatorMode(previousUserText)
              : null
            : null;

          return (
            <MessageBubble
              key={message.id}
              message={message}
              isStreaming={status === 'streaming' && index === messages.length - 1 && message.role === 'assistant'}
              isBookmarked={bookmarkedIds.has(message.id)}
              onToggleBookmark={onToggleBookmark}
              userInitial={userInitial}
              creatorMode={creatorMode}
            />
          );
        })}
        {status === 'submitted' && (
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="rounded-2xl bg-muted px-4 py-2.5">
              <StreamingIndicator />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
