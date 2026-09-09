import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { bookmarkCreateSchema } from '@/lib/validation/schemas';

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const parsed = bookmarkCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('bookmarks')
    .upsert(
      { user_id: user.id, message_id: parsed.data.messageId, note: parsed.data.note },
      { onConflict: 'user_id,message_id' },
    )
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ message: 'Could not save bookmark' }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const messageId = new URL(req.url).searchParams.get('messageId');
  if (!messageId) {
    return NextResponse.json({ message: 'messageId is required' }, { status: 400 });
  }

  const { error } = await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('message_id', messageId);

  if (error) {
    return NextResponse.json({ message: 'Could not remove bookmark' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
