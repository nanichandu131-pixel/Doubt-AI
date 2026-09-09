import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ChatView } from '@/components/chat/chat-view';
import { rowsToUIMessages } from '@/types/chat';

export default async function ChatConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [{ data: messageRows }, { data: bookmarkRows }, { data: profile }] = await Promise.all([
    supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true }),
    supabase.from('bookmarks').select('message_id').eq('user_id', user.id),
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
  ]);

  const initialMessages = rowsToUIMessages(messageRows ?? []);
  const initialBookmarkedIds = (bookmarkRows ?? []).map((row) => row.message_id);
  const userInitial = profile?.full_name?.trim()?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?';

  return (
    <ChatView
      key={conversationId}
      conversationId={conversationId}
      initialMessages={initialMessages}
      initialBookmarkedIds={initialBookmarkedIds}
      userInitial={userInitial}
    />
  );
}
