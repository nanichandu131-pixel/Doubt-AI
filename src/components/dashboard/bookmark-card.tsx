'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MarkdownRenderer } from '@/components/chat/markdown-renderer';

export function BookmarkCard({
  messageId,
  conversationId,
  conversationTitle,
  content,
}: {
  messageId: string;
  conversationId: string;
  conversationTitle: string;
  content: string;
}) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const res = await fetch(`/api/bookmarks?messageId=${messageId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      toast.error('Could not remove bookmark');
      setRemoving(false);
    }
  };

  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/chat/${conversationId}`}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="truncate">{conversationTitle}</span>
          </Link>
          <Button variant="ghost" size="icon-sm" onClick={handleRemove} disabled={removing} aria-label="Remove bookmark">
            {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
          </Button>
        </div>
        <div className="line-clamp-6 text-sm">
          <MarkdownRenderer content={content} />
        </div>
      </CardContent>
    </Card>
  );
}
