import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { TaskDetailClient } from './TaskDetailClient';

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TaskDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();

  return {
    title: task ? `${task.title} — CrunchAI` : 'Task — CrunchAI',
  };
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (!task) {
    notFound();
  }

  const { data: subtasks } = await supabase
    .from('subtasks')
    .select('*')
    .eq('task_id', id)
    .order('sequence_order', { ascending: true });

  const { data: sessions } = await supabase
    .from('sprint_sessions')
    .select('*')
    .eq('task_id', id)
    .order('planned_start', { ascending: true });

  const { data: agentEvents } = await supabase
    .from('agent_events')
    .select('*')
    .eq('task_id', id)
    .order('created_at', { ascending: true });

  return (
    <TaskDetailClient
      task={task}
      subtasks={subtasks || []}
      sessions={sessions || []}
      agentEvents={agentEvents || []}
    />
  );
}
