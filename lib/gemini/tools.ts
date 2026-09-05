import type { FunctionDeclaration } from "@google/genai";
import type { AgentMode } from "@/lib/supabase/types";

// ==========================================
// 1. Break into subtasks
// ==========================================
export const breakIntoSubtasksTool: FunctionDeclaration = {
  name: "break_into_subtasks",
  description: "Decompose a high-level task into ordered, actionable subtasks with clear objectives.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "The title of the task to decompose.",
      },
      description: {
        type: "string",
        description: "Additional context, requirements, or scope description for the task.",
      },
      deadline: {
        type: "string",
        description: "The deadline for the overall task (ISO date or string).",
      },
    },
    required: ["title", "deadline"],
  },
};

// ==========================================
// 2. Estimate effort
// ==========================================
export const estimateEffortTool: FunctionDeclaration = {
  name: "estimate_effort",
  description: "Estimate realistic effort in hours (between 1 and 40) for each subtask.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      subtasks: {
        type: "array",
        description: "List of subtasks to estimate effort for.",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "The subtask title." },
            description: { type: "string", description: "Details of what this subtask entails." },
          },
          required: ["title"],
        },
      },
    },
    required: ["subtasks"],
  },
};

// ==========================================
// 3. Calculate schedule
// ==========================================
export const calculateScheduleTool: FunctionDeclaration = {
  name: "calculate_schedule",
  description: "Create a day-by-day work session schedule distributed across available working days up to the deadline.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      subtasks: {
        type: "array",
        description: "The subtasks and their estimated effort hours.",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            effort_hours: { type: "number" },
          },
          required: ["title", "effort_hours"],
        },
      },
      deadline: {
        type: "string",
        description: "The task completion deadline (ISO date string).",
      },
      available_days: {
        type: "array",
        description: "Optional list of explicit available working day dates (YYYY-MM-DD).",
        items: { type: "string" },
      },
    },
    required: ["subtasks", "deadline"],
  },
};

// ==========================================
// 4. Assess risk
// ==========================================
export const assessRiskTool: FunctionDeclaration = {
  name: "assess_risk",
  description: "Evaluate deadline risk, compute a risk score (0.0 to 1.0), and identify bottleneck days.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      deadline: {
        type: "string",
        description: "The deadline date for the task.",
      },
      subtasks: {
        type: "array",
        description: "Current subtasks with effort and completion status.",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            effort_hours: { type: "number" },
            is_completed: { type: "boolean" },
          },
          required: ["title", "effort_hours"],
        },
      },
      sessions: {
        type: "array",
        description: "Scheduled, completed, or missed work sessions.",
        items: {
          type: "object",
          properties: {
            scheduled_date: { type: "string" },
            duration_minutes: { type: "number" },
            status: { type: "string" },
          },
          required: ["scheduled_date", "duration_minutes"],
        },
      },
    },
    required: ["deadline"],
  },
};

// ==========================================
// 5. Rebalance plan
// ==========================================
export const rebalancePlanTool: FunctionDeclaration = {
  name: "rebalance_plan",
  description: "Rebuild the work schedule after missed sessions, redistributing remaining effort across remaining working days.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      deadline: {
        type: "string",
        description: "The final deadline for the task.",
      },
      sessions: {
        type: "array",
        description: "Existing scheduled sessions.",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            subtask_title: { type: "string" },
            scheduled_date: { type: "string" },
            duration_minutes: { type: "number" },
            status: { type: "string" },
          },
          required: ["scheduled_date", "duration_minutes"],
        },
      },
      missed_sessions: {
        type: "array",
        description: "Sessions that were missed and need reallocation.",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            subtask_title: { type: "string" },
            scheduled_date: { type: "string" },
            duration_minutes: { type: "number" },
          },
          required: ["scheduled_date", "duration_minutes"],
        },
      },
      remaining_effort_hours: {
        type: "number",
        description: "Total remaining work hours to schedule.",
      },
    },
    required: ["deadline", "sessions", "missed_sessions"],
  },
};

// ==========================================
// 6. Prioritize tasks
// ==========================================
export const prioritizeTasksTool: FunctionDeclaration = {
  name: "prioritize_tasks",
  description: "Rank multiple tasks across the workspace by urgency, deadline pressure, and risk score.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      tasks: {
        type: "array",
        description: "List of user tasks with their deadlines and metrics.",
        items: {
          type: "object",
          properties: {
            task_id: { type: "string" },
            title: { type: "string" },
            deadline: { type: "string" },
            risk_score: { type: "number" },
            completed_effort_hours: { type: "number" },
            total_effort_hours: { type: "number" },
          },
          required: ["task_id", "title", "deadline"],
        },
      },
    },
    required: ["tasks"],
  },
};

// All 6 registered tools
export const allAgentTools: FunctionDeclaration[] = [
  breakIntoSubtasksTool,
  estimateEffortTool,
  calculateScheduleTool,
  assessRiskTool,
  rebalancePlanTool,
  prioritizeTasksTool,
];

/**
 * Returns the allowed FunctionDeclaration tools for a given agent mode.
 */
export function getToolsForMode(mode: AgentMode): FunctionDeclaration[] {
  switch (mode) {
    case "plan":
      return allAgentTools;
    case "renegotiate":
      return [rebalancePlanTool, assessRiskTool];
    case "prioritize":
      return [prioritizeTasksTool, assessRiskTool];
    case "brief":
    default:
      return [];
  }
}
