import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}


export async function PATCH(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { status, notes } = body;

  if (!status || !['completed', 'missed', 'in_progress'].includes(status)) {
    return NextResponse.json(
      { error: 'Invalid status. Must be: completed, missed, or in_progress' },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = { status };

  if (status === 'in_progress') {
    updates.actual_start = new Date().toISOString();
  }

  if (status === 'completed') {
    updates.actual_end = new Date().toISOString();
  }

  if (notes) {
    updates.notes = notes;
  }

  const { data: session, error } = await supabase
    .from('sprint_sessions')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  
  
  
  

  return NextResponse.json({ session });
}
