import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { profileUpdateSchema } from '@/lib/validation/schemas';

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const parsed = profileUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 });
  }

  const { data, error } = await supabase.from('profiles').update(parsed.data).eq('id', user.id).select().single();

  if (error) {
    return NextResponse.json({ message: 'Could not update profile' }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
