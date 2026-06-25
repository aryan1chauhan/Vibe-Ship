import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/tasks — Fetch all tasks for authenticated user
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
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tasks });
}

// POST /api/tasks — Create a new task
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

  // TODO (Day 2): Trigger agent planning loop here
  // await triggerAgentPlan(task.id, user.id);

  return NextResponse.json({ task }, { status: 201 });
}
