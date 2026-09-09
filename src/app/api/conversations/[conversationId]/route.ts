import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { conversationId } = await params;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conversationId);
  if (!isUuid) {
    return NextResponse.json({ message: 'Invalid conversation id' }, { status: 400 });
  }

  // Deleting a conversation cascades to its messages and bookmarks (FK on delete cascade).
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId)
    .eq('user_id', user.id);

  if (error) {
    console.error('[api/conversations] failed to delete conversation:', error);
    return NextResponse.json({ message: 'Could not delete the conversation' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}