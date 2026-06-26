import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { runAgentLoop } from '@/lib/agent';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*, subtasks(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tasks });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, deadline, task_type } = body;

  if (!title || !deadline) {
    return NextResponse.json(
      { error: 'Title and deadline are required' },
      { status: 400 }
    );
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      title,
      description: description || null,
      deadline,
      task_type: task_type || 'assignment',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const userPrefs = {
    daily_available_hours: profile?.daily_available_hours ?? 4,
    work_start_hour: profile?.work_start_hour ?? 9,
    work_end_hour: profile?.work_end_hour ?? 22,
    timezone: profile?.timezone ?? 'Asia/Kolkata',
  };

  runAgentLoop(supabase, task.id, user.id, userPrefs);

  return NextResponse.json({ task }, { status: 201 });
}
