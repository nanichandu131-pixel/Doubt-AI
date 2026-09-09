import { redirect } from 'next/navigation';
import { Bookmark } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { BookmarkCard } from '@/components/dashboard/bookmark-card';

interface BookmarkWithMessage {
  id: string;
  message_id: string;
  messages: {
    content: string;
    conversation_id: string;
    conversations: { title: string } | null;
  } | null;
}

export default async function BookmarksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data } = await supabase
    .from('bookmarks')
    .select('id, message_id, messages(content, conversation_id, conversations(title))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const bookmarks = (data ?? []) as unknown as BookmarkWithMessage[];

  return (
    <div className="h-full overflow-y-auto px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-2xl font-semibold">Bookmarks</h1>

        {bookmarks.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card py-20 text-center">
            <Bookmark className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No bookmarks yet. Save answers you want to revisit.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bookmarks
              .filter((bookmark) => bookmark.messages)
              .map((bookmark) => (
                <BookmarkCard
                  key={bookmark.id}
                  messageId={bookmark.message_id}
                  conversationId={bookmark.messages!.conversation_id}
                  conversationTitle={bookmark.messages!.conversations?.title ?? 'Conversation'}
                  content={bookmark.messages!.content}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
