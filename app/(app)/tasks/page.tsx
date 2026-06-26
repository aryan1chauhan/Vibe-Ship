import { createClient } from '@/lib/supabase/server';
import { TasksListClient } from './TasksListClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Tasks — CrunchAI',
  description: 'Manage all your tasks and sprint plans',
};

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, subtasks(*)')
    .eq('user_id', user!.id)
    .order('deadline', { ascending: true });

  return <TasksListClient tasks={tasks || []} />;
}
