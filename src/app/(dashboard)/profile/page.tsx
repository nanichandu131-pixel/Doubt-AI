import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfileForm } from '@/components/dashboard/profile-form';

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();

  return (
    <div className="h-full overflow-y-auto px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <ProfileForm profile={profile} userId={user.id} email={user.email} />
      </div>
    </div>
  );
}
