import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserPrefs, AgentLoopOptions } from './types';
import { createMemory } from './memory';
import { createEventEmitter } from './events';
import { runPlanningLoop } from './reasoning';
import { calculateSchedule } from './scheduling';
import { assessRisk } from './tools';
import { validateAgentPlan } from './validation';
import * as persistence from './persistence';

// ──────────────────────────────────────────────
// Component 2: Agent Orchestrator
//
// The conductor. It coordinates the pipeline but
// performs no computation, no Gemini calls, no DB
// writes itself. Each step delegates to a
// specialist module.
//
// Flow:
//   1. Load task + init memory
//   2. Emit thinking_start
//   3. If replan → mark missed sessions, load subtasks
//   4. If subtasks needed → run reasoning loop
//      else → recalculate schedule deterministically
//   5. Validate the plan (retry once if invalid)
//   6. If still invalid → mark needs_review + stop
//   7. Save plan to database
//   8. Emit thinking_complete
// ──────────────────────────────────────────────

export async function runAgentLoop(
  supabase: SupabaseClient,
  taskId: string,
  userId: string,
  userPrefs: UserPrefs,
  options: AgentLoopOptions = { mode: 'plan' }
): Promise<void> {
  const mode = options.mode || 'plan';
  const events = createEventEmitter(supabase, userId, taskId);

  try {
    // ── 1. Load task + init memory ──
    const task = await persistence.loadTask(supabase, taskId);
    const memory = createMemory(task, userPrefs, mode);

    if (mode === 'plan') {
      await persistence.clearPreviousEvents(supabase, taskId);
    }

    // ── 2. Emit thinking_start ──
    await events.emit('thinking_start', null, {
      message:
        mode === 'replan'
          ? 'Marking missed sessions and rebalancing schedule'
          : 'Analyzing task and starting plan generation',
      mode,
    });

    // ── 3. If replan → handle missed sessions ──
    if (mode === 'replan') {
      const { pendingIds } = await persistence.markMissedSessions(supabase, taskId);
      const existingSubtasks = await persistence.loadExistingSubtasks(supabase, taskId);

      if (existingSubtasks.length > 0) {
        memory.subtasks = existingSubtasks;
      }

      await persistence.deletePendingSessions(supabase, pendingIds);
    }

    // ── 4. Reasoning or deterministic recalculation ──
    if (memory.subtasks.length === 0) {
      // No subtasks yet → Gemini reasons through the full pipeline
      await runPlanningLoop(memory, events);
    } else {
      // Subtasks exist → skip AI, just recalculate schedule deterministically
      await events.emit('tool_call', 'rebalance_plan', {
        args: {
          subtasks: memory.subtasks,
          deadline_iso: task.deadline,
          current_time_iso: new Date().toISOString(),
        },
      });

      memory.sessions = calculateSchedule(
        memory.subtasks,
        task.deadline,
        userPrefs.daily_available_hours,
        userPrefs.work_start_hour,
        userPrefs.work_end_hour
      );

      await events.emit('tool_result', 'rebalance_plan', {
        result: memory.sessions,
      });

      memory.riskAssessment = await assessRisk(
        memory.sessions,
        task.deadline,
        new Date().toISOString()
      );
    }

    // ── 5. Validate (retry once if invalid) ──
    let validation = validateAgentPlan(
      memory.subtasks,
      memory.sessions,
      memory.riskAssessment,
      userPrefs
    );

    if (!validation.valid) {
      await events.emit('validation_failed', null, {
        reason: validation.reason,
        retry: true,
      });

      // Retry: recalculate schedule and re-assess risk
      memory.sessions = calculateSchedule(
        memory.subtasks,
        task.deadline,
        userPrefs.daily_available_hours,
        userPrefs.work_start_hour,
        userPrefs.work_end_hour
      );
      memory.riskAssessment = await assessRisk(
        memory.sessions,
        task.deadline,
        new Date().toISOString()
      );

      validation = validateAgentPlan(
        memory.subtasks,
        memory.sessions,
        memory.riskAssessment,
        userPrefs
      );

      // ── 6. If still invalid → mark needs_review + stop ──
      if (!validation.valid) {
        await events.emit('validation_failed', null, {
          reason: validation.reason,
          retry: false,
        });

        await persistence.markNeedsReview(supabase, taskId, validation.reason!);
        return;
      }
    }

    // ── 7. Save plan to database ──
    await persistence.savePlan(
      supabase,
      taskId,
      userId,
      memory.subtasks,
      memory.sessions,
      memory.riskAssessment,
      mode
    );

    // ── 8. Emit thinking_complete ──
    await events.emit('thinking_complete', null, {
      message:
        mode === 'replan'
          ? 'Schedule rebalancing complete.'
          : 'Plan generated and saved successfully',
    });
  } catch (error: any) {
    await events.emit('error', null, {
      message: error.message || 'An error occurred during agent processing',
    });
  }
}

export async function runReplanLoop(
  supabase: SupabaseClient,
  taskId: string,
  userId: string,
  userPrefs: UserPrefs
): Promise<void> {
  return runAgentLoop(supabase, taskId, userId, userPrefs, { mode: 'replan' });
}
