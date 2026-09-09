'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bookmark, MessageSquarePlus, MessagesSquare, Settings, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn, generateUUID } from '@/lib/utils';
import type { Conversation } from '@/types/database.types';

const navItems = [
  { href: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppSidebar({
  conversations,
  onNavigate,
}: {
  conversations: Conversation[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [items, setItems] = useState<Conversation[]>(conversations);
  const [previousConversations, setPreviousConversations] = useState(conversations);

  // Sync local list when the server-side layout passes fresh conversations (e.g. after router.refresh()).
  if (conversations !== previousConversations) {
    setPreviousConversations(conversations);
    setItems(conversations);
  }

  const startNewChat = () => {
    router.push(`/chat/${generateUUID()}`);
    onNavigate?.();
  };

  const handleDelete = async (conversation: Conversation) => {
    try {
      const response = await fetch(`/api/conversations/${conversation.id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('delete failed');
      }
      setItems((previous) => previous.filter((item) => item.id !== conversation.id));
      toast.success('Chat deleted');
      if (pathname === `/chat/${conversation.id}`) {
        router.push(`/chat/${generateUUID()}`);
      }
      router.refresh();
    } catch {
      toast.error('Could not delete this chat. Please try again.');
    }
  };

  return (
    <div className="flex h-full w-72 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-4 py-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="text-lg font-semibold">DoubtAI</span>
      </div>

      <div className="px-3">
        <Button className="w-full justify-start gap-2" onClick={startNewChat}>
          <MessageSquarePlus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      <div className="mt-4 flex-1 overflow-hidden">
        <p className="px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Recent</p>
        <ScrollArea className="h-[calc(100%-2rem)] px-2">
          <div className="flex flex-col gap-1 py-2">
            {items.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No conversations yet. Ask your first doubt!
              </p>
            )}
            {items.map((conversation) => {
              const href = `/chat/${conversation.id}`;
              const active = pathname === href;
              return (
                <div
                  key={conversation.id}
                  className="group flex items-center gap-1 rounded-md pr-1 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <Link
                    href={href}
                    onClick={onNavigate}
                    className={cn(
                      'flex min-w-0 flex-1 items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                      active && 'bg-sidebar-accent text-sidebar-accent-foreground',
                    )}
                  >
                    <MessagesSquare className="h-4 w-4 shrink-0 opacity-70" />
                    <span className="truncate">{conversation.title}</span>
                  </Link>

                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:bg-transparent hover:text-destructive group-hover:opacity-100 group-focus-within:opacity-100"
                          aria-label={`Delete chat ${conversation.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
                        <AlertDialogDescription>
                          &quot;{conversation.title}&quot; and all of its messages will be permanently
                          removed. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={() => handleDelete(conversation)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <Separator />
      <nav className="flex flex-col gap-1 p-2">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                active && 'bg-sidebar-accent text-sidebar-accent-foreground',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}