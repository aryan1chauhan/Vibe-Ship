import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";
import { getGeminiClient, isGeminiConfigured, GEMINI_MODEL } from "./client";
import { getToolsForMode } from "./tools";
import { toolHandlers, ToolHandlerContext } from "./tool-handlers";
import { getSystemPrompt } from "./prompts";
import type { AgentMode } from "@/lib/supabase/types";
import {
  createPartFromFunctionResponse,
  type Content,
  type Part,
} from "@google/genai";
import type {
  BreakIntoSubtasksOutput,
  EstimateEffortOutput,
  CalculateScheduleOutput,
  AssessRiskOutput,
  RebalancedPlanOutput,
  PrioritizeTasksOutput,
} from "./schemas";

export interface TaskContext {
  title?: string;
  description?: string | null;
  deadline?: string;
  missedSessionId?: string;
  tasks?: Array<{
    task_id: string;
    title: string;
    deadline: string;
    risk_score?: number;
    completed_effort_hours?: number;
    total_effort_hours?: number;
  }>;
  [key: string]: unknown;
}

export interface RunAgentParams {
  mode: AgentMode;
  taskId: string;
  userId: string;
  taskData?: TaskContext;
  supabaseClient?: SupabaseClient;
}

export interface AgentStepLog {
  stepNumber: number;
  toolName: string;
  status: "running" | "completed" | "error";
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export interface AgentRunResult {
  mode: AgentMode;
  taskId: string;
  success: boolean;
  summary: string;
  steps: AgentStepLog[];
  iterations: number;
}

/**
 * Returns a Supabase client with service role permissions for agent background operations.
 */
export function getAgentSupabaseClient(
  customClient?: SupabaseClient
): SupabaseClient {
  if (customClient) return customClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createSupabaseClient(url, serviceKey);
}

/**
 * Core multi-turn function-calling agent orchestrator.
 */
export async function runAgent(params: RunAgentParams): Promise<AgentRunResult> {
  const { mode, taskId, userId } = params;
  const supabase = getAgentSupabaseClient(params.supabaseClient);

  // Fetch task context from DB if not fully provided
  let task = params.taskData;
  if (!task || !task.title || !task.deadline) {
    const { data: dbTask } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (dbTask) {
      task = {
        title: dbTask.title,
        description: dbTask.description,
        deadline: dbTask.deadline,
        ...params.taskData,
      };
    }
  }

  const systemInstruction = getSystemPrompt(mode);
  const tools = getToolsForMode(mode);
  const steps: AgentStepLog[] = [];
  let stepNumber = 1;

  // If real Gemini API is configured and available, run the dynamic function-calling loop
  if (isGeminiConfigured()) {
    try {
      const ai = getGeminiClient();
      const initialUserPrompt = buildInitialUserPrompt(mode, taskId, task);

      const contents: Content[] = [
        {
          role: "user",
          parts: [{ text: initialUserPrompt }],
        },
      ];

      const maxIterations = 10;
      let finalSummary = "";

      for (let iteration = 1; iteration <= maxIterations; iteration++) {
        const response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents,
          config: {
            systemInstruction,
            ...(tools.length > 0
              ? {
                  tools: [{ functionDeclarations: tools }],
                }
              : {}),
          },
        });

        // Check for function calls
        const functionCalls = response.functionCalls;

        if (functionCalls && functionCalls.length > 0) {
          // Model emitted one or more tool calls
          // Append the model's message turn to history
          if (response.candidates?.[0]?.content) {
            contents.push(response.candidates[0].content);
          }

          const responseParts: Part[] = [];

          for (const call of functionCalls) {
            const toolName = call.name || "unknown_tool";
            const callId = call.id || `call_${stepNumber}`;
            const toolArgs = (call.args as Record<string, unknown>) || {};

            // Record step starting
            const stepEntry: AgentStepLog = {
              stepNumber,
              toolName,
              status: "running",
              input: toolArgs,
            };
            steps.push(stepEntry);

            // Execute handler
            const handler = toolHandlers[toolName];
            let toolResult: Record<string, unknown>;

            if (handler) {
              const context: ToolHandlerContext = {
                taskId,
                userId,
                supabase,
                stepNumber,
                agentMode: mode,
              };

              try {
                toolResult = await handler(toolArgs, context);
                stepEntry.status = "completed";
                stepEntry.output = toolResult;
              } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Execution error";
                console.error(`Error executing tool ${toolName}:`, err);
                toolResult = { error: message };
                stepEntry.status = "error";
                stepEntry.output = toolResult;
              }
            } else {
              toolResult = { error: `Tool ${toolName} not registered` };
              stepEntry.status = "error";
              stepEntry.output = toolResult;
            }

            stepNumber++;
            responseParts.push(createPartFromFunctionResponse(callId, toolName, toolResult));
          }

          // Append function response turn to contents
          contents.push({
            role: "user",
            parts: responseParts,
          });
        } else {
          // Model completed its reasoning and provided text output
          finalSummary = response.text || "Execution plan completed.";

          // Log completion step
          await logAgentCompletion(supabase, taskId, userId, mode, finalSummary, stepNumber);

          // Update task status if in planning mode
          if (mode === "plan") {
            await finalizeTaskPlanning(supabase, taskId);
          }

          return {
            mode,
            taskId,
            success: true,
            summary: finalSummary,
            steps,
            iterations: iteration,
          };
        }
      }

      // If loop exceeded max iterations
      finalSummary = "Plan generation finished after reaching iteration limit.";
      if (mode === "plan") {
        await finalizeTaskPlanning(supabase, taskId);
      }

      return {
        mode,
        taskId,
        success: true,
        summary: finalSummary,
        steps,
        iterations: maxIterations,
      };
    } catch (aiError) {
      console.warn("Live Gemini API call encountered error, falling back to deterministic agent:", aiError);
      // Fall through to deterministic plan execution
    }
  }

  // Deterministic Fallback Execution
  // Ensures reliable offline development, testing, and CI without requiring paid API tokens
  return await runDeterministicAgent({
    mode,
    taskId,
    userId,
    task,
    supabase,
  });
}

/**
 * Deterministic pipeline fallback that executes tool handlers in rigorous sequence.
 */
async function runDeterministicAgent(params: {
  mode: AgentMode;
  taskId: string;
  userId: string;
  task: TaskContext | undefined;
  supabase: SupabaseClient;
}): Promise<AgentRunResult> {
  const { mode, taskId, userId, task, supabase } = params;
  const steps: AgentStepLog[] = [];
  const stepNumber = 1;
  let summary = "";

  const context: ToolHandlerContext = {
    taskId,
    userId,
    supabase,
    stepNumber,
    agentMode: mode,
  };

  if (mode === "plan") {
    // 1. Break into subtasks
    const subtaskOutput = (await toolHandlers.break_into_subtasks(
      {
        title: task?.title || "Untitled Project",
        description: task?.description || "",
        deadline: task?.deadline || new Date().toISOString(),
      },
      { ...context, stepNumber: 1 }
    )) as BreakIntoSubtasksOutput;
    steps.push({
      stepNumber: 1,
      toolName: "break_into_subtasks",
      status: "completed",
      output: subtaskOutput,
    });

    // 2. Estimate effort
    const effortOutput = (await toolHandlers.estimate_effort(
      {
        subtasks: subtaskOutput.subtasks.map((st) => ({
          title: st.title,
          description: st.description,
        })),
      },
      { ...context, stepNumber: 2 }
    )) as EstimateEffortOutput;
    steps.push({
      stepNumber: 2,
      toolName: "estimate_effort",
      status: "completed",
      output: effortOutput,
    });

    // 3. Calculate schedule
    const scheduleOutput = (await toolHandlers.calculate_schedule(
      {
        subtasks: effortOutput.estimates.map((est) => ({
          title: est.subtask_title,
          effort_hours: est.effort_hours,
        })),
        deadline: task?.deadline || new Date().toISOString(),
      },
      { ...context, stepNumber: 3 }
    )) as CalculateScheduleOutput;
    steps.push({
      stepNumber: 3,
      toolName: "calculate_schedule",
      status: "completed",
      output: scheduleOutput,
    });

    // 4. Assess risk
    const riskOutput = (await toolHandlers.assess_risk(
      {
        deadline: task?.deadline || new Date().toISOString(),
      },
      { ...context, stepNumber: 4 }
    )) as AssessRiskOutput;
    steps.push({
      stepNumber: 4,
      toolName: "assess_risk",
      status: "completed",
      output: riskOutput,
    });

    await finalizeTaskPlanning(supabase, taskId);

    const totalHours = effortOutput.estimates.reduce(
      (acc: number, e) => acc + e.effort_hours,
      0
    );
    const sessionCount = scheduleOutput.sessions.length;

    summary = `🎯 Execution Plan Activated: Created ${subtaskOutput.subtasks.length} milestones totaling ${totalHours}h across ${sessionCount} focused sessions. Risk score: ${riskOutput.risk_score}. Ready to roll!`;
  } else if (mode === "renegotiate") {
    // Rebalance plan after missed session
    const rebalanceOutput = (await toolHandlers.rebalance_plan(
      {
        deadline: task?.deadline || new Date().toISOString(),
        sessions: [],
        missed_sessions: task?.missedSessionId
          ? [
              {
                id: task.missedSessionId,
                scheduled_date: new Date().toISOString(),
                duration_minutes: 60,
              },
            ]
          : [],
        remaining_effort_hours: 4,
      },
      { ...context, stepNumber: 1 }
    )) as RebalancedPlanOutput;
    steps.push({
      stepNumber: 1,
      toolName: "rebalance_plan",
      status: "completed",
      output: rebalanceOutput,
    });

    // Assess updated risk
    const riskOutput = (await toolHandlers.assess_risk(
      { deadline: task?.deadline || new Date().toISOString() },
      { ...context, stepNumber: 2 }
    )) as AssessRiskOutput;
    steps.push({
      stepNumber: 2,
      toolName: "assess_risk",
      status: "completed",
      output: riskOutput,
    });

    summary = `🔄 Schedule Renegotiated: Work re-allocated across remaining available days. New risk score: ${riskOutput.risk_score}.`;
  } else if (mode === "brief") {
    summary = `### 🎯 Today's Briefing\n- **Focus**: Complete your high-priority scheduled session.\n- **Risk Status**: All active deadlines monitored.\n- **Tip**: Start with a 45-minute focused sprint today.`;
  } else if (mode === "prioritize") {
    const tasksToRank = task?.tasks || [
      {
        task_id: taskId,
        title: task?.title || "Current Task",
        deadline: task?.deadline || new Date().toISOString(),
        risk_score: 0.2,
      },
    ];

    const prioritizeOutput = (await toolHandlers.prioritize_tasks(
      { tasks: tasksToRank },
      { ...context, stepNumber: 1 }
    )) as PrioritizeTasksOutput;
    steps.push({
      stepNumber: 1,
      toolName: "prioritize_tasks",
      status: "completed",
      output: prioritizeOutput,
    });

    summary = `📋 Tasks Prioritized: Ranked ${tasksToRank.length} task(s) by deadline urgency and risk score.`;
  }

  await logAgentCompletion(supabase, taskId, userId, mode, summary, steps.length + 1);

  return {
    mode,
    taskId,
    success: true,
    summary,
    steps,
    iterations: steps.length,
  };
}

function buildInitialUserPrompt(
  mode: AgentMode,
  taskId: string,
  taskData: TaskContext | undefined
): string {
  switch (mode) {
    case "plan":
      return `Please build an execution plan for task "${taskData?.title || taskId}".
Description: ${taskData?.description || "None provided"}
Deadline: ${taskData?.deadline || "Immediate"}
Call the required tools in order: break_into_subtasks -> estimate_effort -> calculate_schedule -> assess_risk.`;

    case "renegotiate":
      return `A session was missed for task "${taskData?.title || taskId}".
Deadline: ${taskData?.deadline}
Please rebalance the schedule and assess the updated risk.`;

    case "brief":
      return `Generate a daily executive briefing for today's workload.
Task: "${taskData?.title}" (Deadline: ${taskData?.deadline})`;

    case "prioritize":
      return `Please rank and prioritize the active tasks based on urgency and risk score.`;

    default:
      return `Execute planning workflow for task ${taskId}.`;
  }
}

async function finalizeTaskPlanning(
  supabase: SupabaseClient,
  taskId: string
): Promise<void> {
  try {
    const { data: currentTask } = await supabase
      .from("tasks")
      .select("status, risk_score")
      .eq("id", taskId)
      .single();

    const newStatus =
      currentTask?.risk_score && currentTask.risk_score >= 0.8 ? "at_risk" : "active";

    await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", taskId);
  } catch (err) {
    console.error("Failed to update task status after planning:", err);
  }
}

async function logAgentCompletion(
  supabase: SupabaseClient,
  taskId: string,
  userId: string,
  mode: AgentMode,
  summary: string,
  stepNumber: number
): Promise<void> {
  try {
    await supabase.from("agent_logs").insert({
      task_id: taskId,
      user_id: userId,
      agent_mode: mode,
      tool_name: "plan_summary",
      tool_input: {},
      tool_output: { summary },
      step_number: stepNumber,
      status: "completed",
    });
  } catch (err) {
    console.error("Failed to write final agent completion log:", err);
  }
}
