import { createClient } from '@/lib/supabase/server';
import { TasksListClient } from './TasksListClient';

export const metadata = {
  title: 'Tasks — CrunchAI',
  description: 'Manage all your tasks and sprint plans',
};

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false });

  return <TasksListClient tasks={tasks || []} />;
}
