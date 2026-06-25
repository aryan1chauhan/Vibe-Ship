import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from './DashboardClient';

export const metadata = {
  title: 'Dashboard — CrunchAI',
  description: 'Your AI-powered productivity dashboard',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user!.id)
    .order('deadline', { ascending: true });

  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: todaySessions } = await supabase
    .from('sprint_sessions')
    .select('*, tasks(title)')
    .eq('user_id', user!.id)
    .gte('planned_start', today.toISOString())
    .lt('planned_start', tomorrow.toISOString())
    .order('planned_start', { ascending: true });

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    'there';

  return (
    <DashboardClient
      tasks={tasks || []}
      todaySessions={todaySessions || []}
      userName={userName}
    />
  );
}
