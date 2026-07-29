import type { SupabaseClient } from '@supabase/supabase-js';
import type { SubtaskEntry, ScheduledSession, RiskAssessment } from './types';

// ──────────────────────────────────────────────
// Component 7: Persistence Layer
//
// Every Supabase write in one place.
// No business logic, no AI calls — just reads/writes.
// ──────────────────────────────────────────────

export async function loadTask(
  supabase: SupabaseClient,
  taskId: string
): Promise<any> {
  const { data: task, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (error || !task) {
    throw new Error('Task not found');
  }

  return task;
}

export async function clearPreviousEvents(
  supabase: SupabaseClient,
  taskId: string
): Promise<void> {
  await supabase.from('agent_events').delete().eq('task_id', taskId);
}

export async function markMissedSessions(
  supabase: SupabaseClient,
  taskId: string
): Promise<{ missedIds: string[]; pendingIds: string[] }> {
  const { data: dbSessions } = await supabase
    .from('sprint_sessions')
    .select('*')
    .eq('task_id', taskId);

  const now = new Date();
  const missedIds: string[] = [];
  const pendingIds: string[] = [];

  if (dbSessions) {
    for (const session of dbSessions) {
      if (session.status === 'planned' || session.status === 'in_progress') {
        if (new Date(session.planned_end) < now) {
          missedIds.push(session.id);
        } else {
          pendingIds.push(session.id);
        }
      }
    }
  }

  if (missedIds.length > 0) {
    await supabase
      .from('sprint_sessions')
      .update({ status: 'missed' })
      .in('id', missedIds);
  }

  return { missedIds, pendingIds };
}

export async function deletePendingSessions(
  supabase: SupabaseClient,
  pendingIds: string[]
): Promise<void> {
  if (pendingIds.length > 0) {
    await supabase.from('sprint_sessions').delete().in('id', pendingIds);
  }
}

export async function loadExistingSubtasks(
  supabase: SupabaseClient,
  taskId: string
): Promise<SubtaskEntry[]> {
  const { data: dbSubtasks } = await supabase
    .from('subtasks')
    .select('*')
    .eq('task_id', taskId);

  if (dbSubtasks && dbSubtasks.length > 0) {
    return dbSubtasks.map((s: any) => ({
      id: s.id,
      title: s.title,
      estimated_minutes: s.estimated_minutes,
    }));
  }

  return [];
}

export async function savePlan(
  supabase: SupabaseClient,
  taskId: string,
  userId: string,
  subtasks: SubtaskEntry[],
  sessions: ScheduledSession[],
  riskAssessment: RiskAssessment | null,
  mode: 'plan' | 'replan'
): Promise<void> {
  if (subtasks.length > 0) {
    await supabase.from('subtasks').delete().eq('task_id', taskId);

    const subtaskInserts = subtasks.map((sub, index) => ({
      id: sub.id,
      task_id: taskId,
      title: sub.title,
      sequence_order: index + 1,
      estimated_minutes: sub.estimated_minutes || 60,
      status: 'pending',
    }));

    const { data: dbSubtasks, error: subtasksError } = await supabase
      .from('subtasks')
      .insert(subtaskInserts)
      .select();

    if (subtasksError) throw subtasksError;

    if (sessions.length > 0 && dbSubtasks) {
      const sessionInserts = sessions.map((session) => {
        const matchedSubtask = dbSubtasks.find(
          (s: any) => s.id === session.subtaskId
        );
        if (!matchedSubtask) {
          throw new Error(
            `Validation Error: No subtask found matching subtaskId ${session.subtaskId}`
          );
        }
        return {
          user_id: userId,
          task_id: taskId,
          subtask_id: matchedSubtask.id,
          planned_start: session.plannedStart,
          planned_end: session.plannedEnd,
          status: 'planned',
          is_replanned: mode === 'replan',
        };
      });

      await supabase.from('sprint_sessions').insert(sessionInserts);
    }
  }

  const totalMinutes = subtasks.reduce(
    (sum, s) => sum + (s.estimated_minutes || 60),
    0
  );

  await supabase
    .from('tasks')
    .update({
      status: mode === 'replan' ? 'replanned' : 'planned',
      estimated_hours: Number((totalMinutes / 60).toFixed(1)),
      ai_risk_level: riskAssessment?.level || 'low',
      ai_risk_reason: riskAssessment?.reason || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId);
}

export async function markNeedsReview(
  supabase: SupabaseClient,
  taskId: string,
  reason: string
): Promise<void> {
  await supabase
    .from('tasks')
    .update({
      status: 'needs_review',
      ai_risk_level: 'critical',
      ai_risk_reason: `Validation failed: ${reason}`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId);
}
