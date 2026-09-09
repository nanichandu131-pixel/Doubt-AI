import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Navbar } from '@/components/layout/navbar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [{ data: profile }, { data: conversations }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('conversations').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
  ]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:block">
        <AppSidebar conversations={conversations ?? []} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar profile={profile ?? null} email={user.email} conversations={conversations ?? []} />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
