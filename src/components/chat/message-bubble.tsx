'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, BookmarkCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MarkdownRenderer } from './markdown-renderer';
import { StreamingIndicator } from './streaming-indicator';
import { cn } from '@/lib/utils';
import { extractText, extractFileParts, type AppUIMessage } from '@/types/chat';

export function MessageBubble({
  message,
  isStreaming,
  isBookmarked,
  onToggleBookmark,
  userInitial,
}: {
  message: AppUIMessage;
  isStreaming: boolean;
  isBookmarked: boolean;
  onToggleBookmark: (messageId: string) => void;
  userInitial: string;
}) {
  const [pending, setPending] = useState(false);
  const isUser = message.role === 'user';
  const text = extractText(message);
  const images = extractFileParts(message).filter((file) =>
    file.mediaType.toLowerCase().startsWith('image/'),
  );

  const handleBookmarkClick = async () => {
    setPending(true);
    try {
      await onToggleBookmark(message.id);
    } finally {
      setPending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn('flex gap-3', isUser && 'flex-row-reverse')}
    >
      <Avatar className="h-8 w-8 shrink-0">
        {isUser ? (
          <AvatarFallback>{userInitial}</AvatarFallback>
        ) : (
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </AvatarFallback>
        )}
      </Avatar>

      <div className={cn('group flex max-w-[85%] flex-col gap-1', isUser && 'items-end')}>
        <div
          className={cn(
            'flex max-w-full flex-col gap-2 rounded-2xl px-4 py-2.5 text-sm',
            isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
          )}
        >
          {images.length > 0 && (
            <div className={cn('flex flex-wrap gap-2', !isUser && 'flex-row-reverse')}>
              {images.map((image) => (
                <img
                  key={image.url}
                  src={image.url}
                  alt={image.filename ?? 'Uploaded image'}
                  className="max-h-48 max-w-[240px] rounded-lg object-cover"
                />
              ))}
            </div>
          )}
          {!isUser && !text && isStreaming ? (
            <StreamingIndicator />
          ) : isUser ? (
            text ? (
              <p className="whitespace-pre-wrap break-words">{text}</p>
            ) : (
              <span className="text-xs text-primary-foreground/70">Shared an image</span>
            )
          ) : (
            <MarkdownRenderer content={text} />
          )}
        </div>

        {!isUser && text && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="opacity-0 transition-opacity group-hover:opacity-100"
            disabled={pending}
            onClick={handleBookmarkClick}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this answer'}
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-4 w-4 text-primary" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
