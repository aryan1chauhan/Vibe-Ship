import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { geminiModel } from '@/lib/gemini';

export const dynamic = 'force-dynamic';
import { SchemaType } from '@google/generative-ai';
import { DAILY_BRIEF_PROMPT } from '@/lib/agent/prompts';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

    const { data: dbSessions } = await supabase
      .from('sprint_sessions')
      .select('*, subtasks(title)')
      .eq('user_id', user.id)
      .gte('planned_start', startOfDay)
      .lte('planned_start', endOfDay)
      .order('planned_start');

    const { data: atRiskTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .in('ai_risk_level', ['high', 'critical']);

    const sessionsData = (dbSessions || []).map((s: any) => ({
      subtaskTitle: s.subtasks?.title || 'Subtask',
      plannedStart: s.planned_start,
      plannedEnd: s.planned_end,
      estimatedMinutes: Math.round((new Date(s.planned_end).getTime() - new Date(s.planned_start).getTime()) / (60 * 1000)),
    }));

    const tasksData = (atRiskTasks || []).map((t: any) => ({
      taskId: t.id,
      title: t.title,
      riskLevel: t.ai_risk_level,
      reason: t.ai_risk_reason || '',
    }));

    const prompt = `${DAILY_BRIEF_PROMPT}

Context:
Today's Sessions: ${JSON.stringify(sessionsData)}
Tasks at Risk: ${JSON.stringify(tasksData)}`;

    const result = await geminiModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            greeting: { type: SchemaType.STRING },
            recommendation: { type: SchemaType.STRING },
          },
          required: ['greeting', 'recommendation'],
        },
      },
    });

    const parsed = JSON.parse(result.response.text());

    return NextResponse.json({
      greeting: parsed.greeting,
      todaySessions: sessionsData,
      tasksAtRisk: tasksData,
      recommendation: parsed.recommendation,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
