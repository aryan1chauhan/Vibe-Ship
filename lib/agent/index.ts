import type { SupabaseClient } from '@supabase/supabase-js';
import { geminiModel } from '@/lib/gemini';
import { AGENT_SYSTEM_PROMPT } from './prompts';
import { AGENT_TOOLS } from './tools';
import {
  breakIntoSubtasks,
  estimateEffort,
  calculateSchedule,
  assessRisk,
  rebalancePlan,
} from './executor';

async function logEvent(
  supabase: SupabaseClient,
  userId: string,
  taskId: string,
  eventType: string,
  toolCalled: string | null,
  payload: any
) {
  await supabase.from('agent_events').insert({
    user_id: userId,
    task_id: taskId,
    event_type: eventType,
    tool_called: toolCalled,
    payload,
  });
}

export async function runAgentLoop(
  supabase: SupabaseClient,
  taskId: string,
  userId: string,
  userPrefs: {
    daily_available_hours: number;
    work_start_hour: number;
    work_end_hour: number;
    timezone: string;
  }
): Promise<void> {
  try {
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      throw new Error('Task not found');
    }

    await supabase
      .from('agent_events')
      .delete()
      .eq('task_id', taskId);

    await logEvent(supabase, userId, taskId, 'thinking_start', null, {
      message: 'Analyzing task and starting plan generation',
    });

    const chat = geminiModel.startChat({
      history: [],
      systemInstruction: AGENT_SYSTEM_PROMPT,
      tools: [{ functionDeclarations: AGENT_TOOLS as any }],
    });

    const userMessage = `Create a sprint plan for this task:
Title: ${task.title}
Description: ${task.description || 'None'}
Deadline: ${task.deadline}
Type: ${task.task_type}

User Prefs:
Daily Available Hours: ${userPrefs.daily_available_hours}
Work Start Hour: ${userPrefs.work_start_hour}
Work End Hour: ${userPrefs.work_end_hour}
Timezone: ${userPrefs.timezone}`;

    let response = await chat.sendMessage(userMessage);

    let generatedSubtasks: { title: string; estimated_minutes: number }[] = [];
    let scheduledSessions: any[] = [];
    let riskAssessment: any = null;

    let iterations = 0;
    const maxIterations = 10;

    while (iterations < maxIterations) {
      const toolCalls = response.response.functionCalls();
      if (!toolCalls || toolCalls.length === 0) {
        break;
      }

      const functionResponses: any[] = [];

      for (const call of toolCalls) {
        const { name, args } = call;
        await logEvent(supabase, userId, taskId, 'tool_call', name, { args });

        let result: any = null;

        if (name === 'break_into_subtasks') {
          const subtaskTitles = await breakIntoSubtasks(
            (args as any).task_title,
            (args as any).task_description,
            (args as any).deadline_iso,
            (args as any).task_type
          );
          generatedSubtasks = subtaskTitles.map((title) => ({
            title,
            estimated_minutes: 0,
          }));
          result = { subtasks: subtaskTitles };
        } else if (name === 'estimate_effort') {
          const estimatedMinutes = await estimateEffort(
            (args as any).subtask_title,
            (args as any).context
          );
          const subtask = generatedSubtasks.find(
            (s) => s.title === (args as any).subtask_title
          );
          if (subtask) {
            subtask.estimated_minutes = estimatedMinutes;
          }
          result = { estimated_minutes: estimatedMinutes };
        } else if (name === 'calculate_schedule') {
          const plan = calculateSchedule(
            (args as any).subtasks || generatedSubtasks,
            (args as any).deadline_iso,
            (args as any).daily_available_hours || userPrefs.daily_available_hours,
            (args as any).work_start_hour || userPrefs.work_start_hour
          );
          scheduledSessions = plan;
          result = { plan };
        } else if (name === 'assess_risk') {
          const risk = await assessRisk(
            (args as any).plan || scheduledSessions,
            (args as any).deadline_iso,
            (args as any).current_time_iso
          );
          riskAssessment = risk;
          result = risk;
        }

        await logEvent(supabase, userId, taskId, 'tool_result', name, { result });

        functionResponses.push({
          functionResponse: {
            name,
            response: { result },
          },
        });
      }

      response = await chat.sendMessage(functionResponses);
      iterations++;
    }

    if (generatedSubtasks.length > 0) {
      await supabase.from('subtasks').delete().eq('task_id', taskId);

      const subtaskInserts = generatedSubtasks.map((sub, index) => ({
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

      if (scheduledSessions.length > 0 && dbSubtasks) {
        await supabase.from('sprint_sessions').delete().eq('task_id', taskId);

        const sessionInserts = scheduledSessions.map((session) => {
          const matchedSubtask = dbSubtasks.find(
            (s) => s.title === session.subtaskTitle
          );
          return {
            user_id: userId,
            task_id: taskId,
            subtask_id: matchedSubtask ? matchedSubtask.id : dbSubtasks[0].id,
            planned_start: session.plannedStart,
            planned_end: session.plannedEnd,
            status: 'planned',
          };
        });

        await supabase.from('sprint_sessions').insert(sessionInserts);
      }
    }

    const totalMinutes = generatedSubtasks.reduce(
      (sum, s) => sum + (s.estimated_minutes || 60),
      0
    );

    await supabase
      .from('tasks')
      .update({
        status: 'planned',
        estimated_hours: Number((totalMinutes / 60).toFixed(1)),
        ai_risk_level: riskAssessment?.level || 'low',
        ai_risk_reason: riskAssessment?.reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    await logEvent(supabase, userId, taskId, 'thinking_complete', null, {
      message: 'Plan generated and saved successfully',
      final_text: response.response.text(),
    });
  } catch (error: any) {
    await logEvent(supabase, userId, taskId, 'error', null, {
      message: error.message || 'An error occurred during planning',
    });
  }
}

export async function runReplanLoop(
  supabase: SupabaseClient,
  taskId: string,
  userId: string,
  userPrefs: {
    daily_available_hours: number;
    work_start_hour: number;
    work_end_hour: number;
    timezone: string;
  }
): Promise<void> {
  try {
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      throw new Error('Task not found');
    }

    await logEvent(supabase, userId, taskId, 'thinking_start', null, {
      message: 'Marking missed sessions and starting schedule rebalance',
    });

    const { data: dbSessions } = await supabase
      .from('sprint_sessions')
      .select('*')
      .eq('task_id', taskId);

    const now = new Date();
    const missedSessionIds: string[] = [];
    const pendingSessionIds: string[] = [];

    if (dbSessions) {
      for (const session of dbSessions) {
        if (session.status === 'planned' || session.status === 'in_progress') {
          if (new Date(session.planned_end) < now) {
            missedSessionIds.push(session.id);
          } else {
            pendingSessionIds.push(session.id);
          }
        }
      }
    }

    if (missedSessionIds.length > 0) {
      await supabase
        .from('sprint_sessions')
        .update({ status: 'missed' })
        .in('id', missedSessionIds);
    }

    const { data: dbSubtasks } = await supabase
      .from('subtasks')
      .select('*')
      .eq('task_id', taskId);

    if (!dbSubtasks || dbSubtasks.length === 0) {
      throw new Error('No subtasks found to reschedule');
    }

    const missedSubtaskIds = new Set<string>();
    if (dbSessions) {
      for (const s of dbSessions) {
        if (missedSessionIds.includes(s.id)) {
          missedSubtaskIds.add(s.subtask_id);
        }
      }
    }

    const missedSubtasks = dbSubtasks
      .filter((s) => missedSubtaskIds.has(s.id) && s.status !== 'completed')
      .map((s) => ({ title: s.title, estimated_minutes: s.estimated_minutes }));

    const remainingSubtasks = dbSubtasks
      .filter((s) => !missedSubtaskIds.has(s.id) && s.status !== 'completed')
      .map((s) => ({ title: s.title, estimated_minutes: s.estimated_minutes }));

    if (missedSubtasks.length === 0 && remainingSubtasks.length === 0) {
      await logEvent(supabase, userId, taskId, 'thinking_complete', null, {
        message: 'No remaining work to reschedule',
      });
      return;
    }

    await logEvent(supabase, userId, taskId, 'tool_call', 'rebalance_plan', {
      args: {
        missed_subtasks: missedSubtasks,
        remaining_subtasks: remainingSubtasks,
        deadline_iso: task.deadline,
        current_time_iso: now.toISOString(),
      },
    });

    const rescheduledSessions = rebalancePlan(
      missedSubtasks,
      remainingSubtasks,
      task.deadline,
      now.toISOString(),
      userPrefs.daily_available_hours
    );

    await logEvent(supabase, userId, taskId, 'tool_result', 'rebalance_plan', {
      result: rescheduledSessions,
    });

    if (pendingSessionIds.length > 0) {
      await supabase.from('sprint_sessions').delete().in('id', pendingSessionIds);
    }

    if (rescheduledSessions.length > 0) {
      const sessionInserts = rescheduledSessions.map((session) => {
        const matchedSubtask = dbSubtasks.find(
          (s) => s.title === session.subtaskTitle
        );
        return {
          user_id: userId,
          task_id: taskId,
          subtask_id: matchedSubtask ? matchedSubtask.id : dbSubtasks[0].id,
          planned_start: session.plannedStart,
          planned_end: session.plannedEnd,
          status: 'planned',
          is_replanned: true,
        };
      });

      await supabase.from('sprint_sessions').insert(sessionInserts);
    }

    const risk = await assessRisk(rescheduledSessions, task.deadline, now.toISOString());

    await supabase
      .from('tasks')
      .update({
        status: 'replanned',
        ai_risk_level: risk.level,
        ai_risk_reason: risk.reason,
        updated_at: now.toISOString(),
      })
      .eq('id', taskId);

    await logEvent(supabase, userId, taskId, 'thinking_complete', null, {
      message: 'Rebalancing complete. Schedule updated.',
    });
  } catch (error: any) {
    await logEvent(supabase, userId, taskId, 'error', null, {
      message: error.message || 'An error occurred during rebalancing',
    });
  }
}
