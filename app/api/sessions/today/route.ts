import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';


export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: sessions, error } = await supabase
    .from('sprint_sessions')
    .select('*, tasks(title, priority, ai_risk_level), subtasks(title)')
    .eq('user_id', user.id)
    .gte('planned_start', today.toISOString())
    .lt('planned_start', tomorrow.toISOString())
    .order('planned_start', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessions });
}
