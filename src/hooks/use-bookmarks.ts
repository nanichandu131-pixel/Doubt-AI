'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export function useBookmarks(initialIds: string[]) {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => new Set(initialIds));

  const toggleBookmark = useCallback(
    async (messageId: string) => {
      const isBookmarked = bookmarkedIds.has(messageId);

      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (isBookmarked) {
          next.delete(messageId);
        } else {
          next.add(messageId);
        }
        return next;
      });

      try {
        if (isBookmarked) {
          const res = await fetch(`/api/bookmarks?messageId=${messageId}`, { method: 'DELETE' });
          if (!res.ok) throw new Error();
        } else {
          const res = await fetch('/api/bookmarks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageId }),
          });
          if (!res.ok) throw new Error();
          toast.success('Saved to bookmarks');
        }
      } catch {
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          if (isBookmarked) {
            next.add(messageId);
          } else {
            next.delete(messageId);
          }
          return next;
        });
        toast.error('Could not update bookmark');
      }
    },
    [bookmarkedIds],
  );

  return { bookmarkedIds, toggleBookmark };
}
