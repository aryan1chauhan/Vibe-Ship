import { SupabaseClient } from "@supabase/supabase-js";
import type { AgentMode } from "@/lib/supabase/types";
import {
  BreakIntoSubtasksInputSchema,
  BreakIntoSubtasksOutput,
  EstimateEffortInputSchema,
  EstimateEffortOutput,
  CalculateScheduleInputSchema,
  CalculateScheduleOutput,
  AssessRiskInputSchema,
  AssessRiskOutput,
  RebalancePlanInputSchema,
  RebalancedPlanOutput,
  PrioritizeTasksInputSchema,
  PrioritizeTasksOutput,
} from "./schemas";
import { buildWorkSchedule, getWorkingDays } from "@/lib/utils/schedule";
import { calculateRiskScore } from "@/lib/utils/risk";
import { format, parseISO, isBefore, startOfDay } from "date-fns";

export interface ToolHandlerContext {
  taskId: string;
  userId: string;
  supabase: SupabaseClient;
  stepNumber: number;
  agentMode: AgentMode;
}

export type ToolHandler = (
  args: Record<string, unknown>,
  context: ToolHandlerContext
) => Promise<Record<string, unknown>>;

// ==========================================
// 1. break_into_subtasks handler
// ==========================================
export async function handleBreakIntoSubtasks(
  args: Record<string, unknown>,
  context: ToolHandlerContext
): Promise<BreakIntoSubtasksOutput> {
  const input = BreakIntoSubtasksInputSchema.parse(args);

  // If subtasks are passed in or we generate a default breakdown:
  const generatedSubtasks = [
    {
      title: `Research & Requirements Analysis for ${input.title}`,
      description: `Understand the core objectives, gather reference materials, and specify technical requirements.`,
      sequence: 1,
    },
    {
      title: `Architecture & Core System Design`,
      description: `Draft schema, component contracts, and core algorithmic foundation.`,
      sequence: 2,
    },
    {
      title: `Implementation & Integration`,
      description: `Write the core logic, integrate APIs, and link database tables.`,
      sequence: 3,
    },
    {
      title: `Verification, Polish & Edge Case Testing`,
      description: `Perform end-to-end testing, error handling validation, and visual refinement.`,
      sequence: 4,
    },
  ];

  // Save to Supabase subtasks table
  const rowsToInsert = generatedSubtasks.map((s) => ({
    task_id: context.taskId,
    title: s.title,
    description: s.description,
    sequence: s.sequence,
    effort_hours: 2, // initial placeholder until estimate_effort runs
    is_completed: false,
  }));

  const { data: insertedSubtasks, error: insertError } = await context.supabase
    .from("subtasks")
    .insert(rowsToInsert)
    .select();

  if (insertError) {
    console.error("Error inserting subtasks:", insertError);
  }

  const output: BreakIntoSubtasksOutput = {
    subtasks: (insertedSubtasks || rowsToInsert).map(
      (s: { title: string; description?: string | null; sequence?: number }, idx: number) => ({
        title: s.title,
        description: s.description || "",
        sequence: s.sequence ?? idx + 1,
      })
    ),
  };

  await logToolExecution("break_into_subtasks", input, output, context);
  return output;
}

// ==========================================
// 2. estimate_effort handler
// ==========================================
export async function handleEstimateEffort(
  args: Record<string, unknown>,
  context: ToolHandlerContext
): Promise<EstimateEffortOutput> {
  const input = EstimateEffortInputSchema.parse(args);

  // Reasonable effort distribution: 2h, 3h, 4h, 2h (average ~2.5 - 4h per subtask)
  const defaultEfforts = [2, 3, 4, 2, 3, 2];
  const estimates = input.subtasks.map((subtask, idx) => ({
    subtask_title: subtask.title,
    effort_hours: defaultEfforts[idx % defaultEfforts.length],
  }));

  let totalEffort = 0;
  for (const estimate of estimates) {
    totalEffort += estimate.effort_hours;
    // Update subtask effort in database
    await context.supabase
      .from("subtasks")
      .update({ effort_hours: estimate.effort_hours })
      .eq("task_id", context.taskId)
      .eq("title", estimate.subtask_title);
  }

  // Update total_effort_hours on the task
  await context.supabase
    .from("tasks")
    .update({ total_effort_hours: totalEffort })
    .eq("id", context.taskId);

  const output: EstimateEffortOutput = { estimates };
  await logToolExecution("estimate_effort", input, output, context);
  return output;
}

// ==========================================
// 3. calculate_schedule handler
// ==========================================
export async function handleCalculateSchedule(
  args: Record<string, unknown>,
  context: ToolHandlerContext
): Promise<CalculateScheduleOutput> {
  const input = CalculateScheduleInputSchema.parse(args);

  // Fetch created subtasks from database to get their IDs
  const { data: dbSubtasks } = await context.supabase
    .from("subtasks")
    .select("id, title")
    .eq("task_id", context.taskId);

  const subtaskMap = new Map<string, string>();
  if (dbSubtasks) {
    dbSubtasks.forEach((st: { id: string; title: string }) => {
      subtaskMap.set(st.title, st.id);
    });
  }

  const plannedSessions = buildWorkSchedule(
    input.subtasks,
    input.deadline,
    new Date(),
    input.available_days
  );

  // Delete existing scheduled sessions for this task before inserting fresh ones
  await context.supabase
    .from("sessions")
    .delete()
    .eq("task_id", context.taskId)
    .eq("status", "scheduled");

  // Insert session rows into Supabase
  const sessionRows = plannedSessions.map((session) => ({
    task_id: context.taskId,
    subtask_id: subtaskMap.get(session.subtask_title) || null,
    scheduled_date: session.scheduled_date,
    duration_minutes: session.duration_minutes,
    status: "scheduled" as const,
  }));

  const { error: sessionInsertError } = await context.supabase
    .from("sessions")
    .insert(sessionRows);

  if (sessionInsertError) {
    console.error("Error inserting sessions:", sessionInsertError);
  }

  const output: CalculateScheduleOutput = {
    sessions: plannedSessions,
  };

  await logToolExecution("calculate_schedule", input, output, context);
  return output;
}

// ==========================================
// 4. assess_risk handler
// ==========================================
export async function handleAssessRisk(
  args: Record<string, unknown>,
  context: ToolHandlerContext
): Promise<AssessRiskOutput> {
  const input = AssessRiskInputSchema.parse(args);

  // Fetch current task info
  const { data: taskData } = await context.supabase
    .from("tasks")
    .select("total_effort_hours, completed_effort_hours, deadline")
    .eq("id", context.taskId)
    .single();

  const totalEffort = taskData?.total_effort_hours || 10;
  const completedEffort = taskData?.completed_effort_hours || 0;
  const deadline = input.deadline || taskData?.deadline || new Date().toISOString();

  // Fetch current sessions
  const { data: sessionsData } = await context.supabase
    .from("sessions")
    .select("scheduled_date, duration_minutes, status")
    .eq("task_id", context.taskId);

  const riskResult = calculateRiskScore({
    deadline,
    totalEffortHours: totalEffort,
    completedEffortHours: completedEffort,
    sessions: sessionsData || input.sessions || [],
  });

  // Update task risk_score and risk_reason in Supabase
  const taskUpdates: Record<string, unknown> = {
    risk_score: riskResult.score,
    risk_reason: riskResult.reason,
  };

  if (riskResult.score >= 0.8) {
    taskUpdates.status = "at_risk";
  }

  await context.supabase
    .from("tasks")
    .update(taskUpdates)
    .eq("id", context.taskId);

  const output: AssessRiskOutput = {
    risk_score: riskResult.score,
    risk_reason: riskResult.reason,
    bottleneck_days: riskResult.bottleneckDays,
  };

  await logToolExecution("assess_risk", input, output, context);
  return output;
}

// ==========================================
// 5. rebalance_plan handler
// ==========================================
export async function handleRebalancePlan(
  args: Record<string, unknown>,
  context: ToolHandlerContext
): Promise<RebalancedPlanOutput> {
  const input = RebalancePlanInputSchema.parse(args);

  // Fetch all existing subtasks
  const { data: subtasks } = await context.supabase
    .from("subtasks")
    .select("id, title, effort_hours, is_completed")
    .eq("task_id", context.taskId);

  const subtaskMap = new Map<string, string>();
  const uncompletedSubtasks: Array<{ title: string; effort_hours: number }> = [];

  if (subtasks) {
    subtasks.forEach(
      (st: { id: string; title: string; effort_hours?: number | null; is_completed?: boolean | null }) => {
        subtaskMap.set(st.title, st.id);
        if (!st.is_completed) {
          uncompletedSubtasks.push({
            title: st.title,
            effort_hours: st.effort_hours || 2,
          });
        }
      }
    );
  }

  // Calculate available future working days starting from today or tomorrow
  const today = startOfDay(new Date());
  const futureDays = getWorkingDays(today, input.deadline, true); // Include weekends for recovery if tight

  // Fallback if uncompleted subtasks list is empty
  const subtasksToSchedule =
    uncompletedSubtasks.length > 0
      ? uncompletedSubtasks
      : [{ title: "Remaining Task Completion", effort_hours: input.remaining_effort_hours || 4 }];

  const newSchedule = buildWorkSchedule(subtasksToSchedule, input.deadline, today, futureDays);

  // Delete future 'scheduled' sessions
  await context.supabase
    .from("sessions")
    .delete()
    .eq("task_id", context.taskId)
    .eq("status", "scheduled");

  // Insert new sessions
  const newSessionRows = newSchedule.map((s) => ({
    task_id: context.taskId,
    subtask_id: subtaskMap.get(s.subtask_title) || null,
    scheduled_date: s.scheduled_date,
    duration_minutes: s.duration_minutes,
    status: "scheduled" as const,
  }));

  if (newSessionRows.length > 0) {
    await context.supabase.from("sessions").insert(newSessionRows);
  }

  const deadlineDate = parseISO(input.deadline);
  const deadlineAchievable = !isBefore(deadlineDate, today);

  const output: RebalancedPlanOutput = {
    new_sessions: newSchedule,
    deadline_achievable: deadlineAchievable,
    explanation: `Redistributed ${input.missed_sessions.length} missed session(s) across ${futureDays.length} remaining available day(s).`,
  };

  await logToolExecution("rebalance_plan", input, output, context);
  return output;
}

// ==========================================
// 6. prioritize_tasks handler
// ==========================================
export async function handlePrioritizeTasks(
  args: Record<string, unknown>,
  context: ToolHandlerContext
): Promise<PrioritizeTasksOutput> {
  const input = PrioritizeTasksInputSchema.parse(args);

  // Sort tasks by:
  // 1. Deadline proximity (earlier deadline = higher priority)
  // 2. Risk score (higher risk = higher priority)
  const rankedTasks = [...input.tasks].sort((a, b) => {
    const deadlineDiff = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    if (deadlineDiff !== 0) return deadlineDiff;
    return (b.risk_score || 0) - (a.risk_score || 0);
  });

  const ranked = rankedTasks.map((t, index) => {
    const priority = index + 1;
    let reason = `Ranked #${priority} based on deadline ${format(new Date(t.deadline), "MMM d")}`;
    if ((t.risk_score || 0) >= 0.5) {
      reason += ` and elevated risk score (${t.risk_score})`;
    }
    return {
      task_id: t.task_id,
      priority,
      reason,
    };
  });

  // Update each task's priority in Supabase
  for (const item of ranked) {
    await context.supabase
      .from("tasks")
      .update({ priority: item.priority })
      .eq("id", item.task_id);
  }

  const output: PrioritizeTasksOutput = { ranked };
  await logToolExecution("prioritize_tasks", input, output, context);
  return output;
}

// ==========================================
// Tool Registry Map
// ==========================================
export const toolHandlers: Record<string, ToolHandler> = {
  break_into_subtasks: handleBreakIntoSubtasks,
  estimate_effort: handleEstimateEffort,
  calculate_schedule: handleCalculateSchedule,
  assess_risk: handleAssessRisk,
  rebalance_plan: handleRebalancePlan,
  prioritize_tasks: handlePrioritizeTasks,
};

/**
 * Logs tool execution step into Supabase agent_logs table.
 * Realtime broadcasts this to subscribed UI terminals.
 */
async function logToolExecution(
  toolName: string,
  input: Record<string, unknown>,
  output: Record<string, unknown>,
  context: ToolHandlerContext
): Promise<void> {
  try {
    await context.supabase.from("agent_logs").insert({
      task_id: context.taskId,
      user_id: context.userId,
      agent_mode: context.agentMode,
      tool_name: toolName,
      tool_input: input,
      tool_output: output,
      step_number: context.stepNumber,
      status: "completed",
    });
  } catch (err) {
    console.error(`Failed to write agent log for tool ${toolName}:`, err);
  }
}
