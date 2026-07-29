import { createClient } from '@/lib/supabase/server';
import { NextResponse, after } from 'next/server';
import { runReplanLoop } from '@/lib/agent';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { taskId } = body;

    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
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

    after(async () => {
      await runReplanLoop(supabase, taskId, user.id, userPrefs);
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
