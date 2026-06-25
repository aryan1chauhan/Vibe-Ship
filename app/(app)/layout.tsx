import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/ui/Sidebar';
import { Providers } from '../providers';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const userName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0];
  const userAvatar = user.user_metadata?.avatar_url || null;

  return (
    <Providers>
      <div className="flex min-h-screen">
        <Sidebar
          userName={userName}
          userEmail={user.email}
          userAvatar={userAvatar}
        />
        <main className="flex-1 min-h-screen overflow-auto">
          <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </Providers>
  );
}
