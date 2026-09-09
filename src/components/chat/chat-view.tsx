'use client';

import { useRouter } from 'next/navigation';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type FileUIPart } from 'ai';
import { toast } from 'sonner';
import { MessageList } from './message-list';
import { ChatComposer } from './chat-composer';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { generateUUID } from '@/lib/utils';
import { attachmentsToFileParts, type AppUIMessage, type ChatAttachment } from '@/types/chat';

export function ChatView({
  conversationId,
  initialMessages,
  initialBookmarkedIds,
  userInitial,
}: {
  conversationId: string;
  initialMessages: AppUIMessage[];
  initialBookmarkedIds: string[];
  userInitial: string;
}) {
  const router = useRouter();
  const { bookmarkedIds, toggleBookmark } = useBookmarks(initialBookmarkedIds);

  const { messages, sendMessage, status, stop } = useChat<AppUIMessage>({
    id: conversationId,
    messages: initialMessages,
    generateId: () => generateUUID(),
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    onFinish: () => router.refresh(),
    onError: (error) => toast.error(error.message || 'Something went wrong. Please try again.'),
  });

  const isBusy = status === 'submitted' || status === 'streaming';

  const handleSend = (text: string, attachments: ChatAttachment[]) => {
    const files: FileUIPart[] = attachmentsToFileParts(attachments);
    if (files.length > 0) {
      if (text.trim()) {
        sendMessage({ text, files });
      } else {
        sendMessage({ files });
      }
    } else {
      sendMessage({ text });
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          status={status}
          bookmarkedIds={bookmarkedIds}
          onToggleBookmark={toggleBookmark}
          onSuggestionClick={(text) => handleSend(text, [])}
          userInitial={userInitial}
        />
      </div>
      <ChatComposer onSend={handleSend} onStop={stop} disabled={isBusy} isStreaming={isBusy} />
    </div>
  );
}
