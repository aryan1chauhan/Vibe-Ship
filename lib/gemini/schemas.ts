import { z } from "zod";

// ==========================================
// 1. Break Into Subtasks
// ==========================================
export const SubtaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().default(""),
  sequence: z.number().int().min(0),
});

export const BreakIntoSubtasksInputSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional().default(""),
  deadline: z.string().min(1, "Deadline is required"),
});

export const BreakIntoSubtasksOutputSchema = z.object({
  subtasks: z.array(SubtaskSchema).min(1, "At least one subtask is required"),
});

// ==========================================
// 2. Estimate Effort
// ==========================================
export const EffortEstimateSchema = z.object({
  subtask_title: z.string().min(1),
  effort_hours: z.number().min(1).max(40),
});

export const EstimateEffortInputSchema = z.object({
  subtasks: z.array(
    z.object({
      title: z.string().min(1),
      description: z.string().optional().default(""),
    })
  ).min(1),
});

export const EstimateEffortOutputSchema = z.object({
  estimates: z.array(EffortEstimateSchema).min(1),
});

// ==========================================
// 3. Calculate Schedule
// ==========================================
export const SessionSchema = z.object({
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  subtask_title: z.string().min(1),
  duration_minutes: z.number().int().positive(),
});

export const CalculateScheduleInputSchema = z.object({
  subtasks: z.array(
    z.object({
      title: z.string().min(1),
      effort_hours: z.number().positive(),
    })
  ).min(1),
  deadline: z.string().min(1),
  available_days: z.array(z.string()).optional(),
});

export const CalculateScheduleOutputSchema = z.object({
  sessions: z.array(SessionSchema).min(1),
});

// ==========================================
// 4. Assess Risk
// ==========================================
export const RiskAssessmentSchema = z.object({
  risk_score: z.number().min(0).max(1),
  risk_reason: z.string().min(1),
  bottleneck_days: z.array(z.string()).default([]),
});

export const AssessRiskInputSchema = z.object({
  subtasks: z
    .array(
      z.object({
        title: z.string(),
        effort_hours: z.number(),
        is_completed: z.boolean().optional(),
      })
    )
    .optional(),
  sessions: z
    .array(
      z.object({
        scheduled_date: z.string(),
        duration_minutes: z.number(),
        status: z.string().optional(),
      })
    )
    .optional(),
  deadline: z.string().min(1),
});

export const AssessRiskOutputSchema = RiskAssessmentSchema;

// ==========================================
// 5. Rebalance Plan
// ==========================================
export const RebalancePlanInputSchema = z.object({
  sessions: z.array(
    z.object({
      id: z.string().optional(),
      subtask_title: z.string().optional(),
      scheduled_date: z.string(),
      duration_minutes: z.number(),
      status: z.string().optional(),
    })
  ),
  missed_sessions: z.array(
    z.object({
      id: z.string().optional(),
      subtask_title: z.string().optional(),
      scheduled_date: z.string(),
      duration_minutes: z.number(),
    })
  ),
  deadline: z.string().min(1),
  remaining_effort_hours: z.number().optional(),
});

export const RebalancedPlanSchema = z.object({
  new_sessions: z.array(SessionSchema),
  dropped_subtasks: z.array(z.string()).optional(),
  deadline_achievable: z.boolean().default(true),
  explanation: z.string().optional(),
});

export const RebalancedPlanOutputSchema = RebalancedPlanSchema;

// ==========================================
// 6. Prioritize Tasks
// ==========================================
export const PrioritizedTaskSchema = z.object({
  task_id: z.string().min(1),
  priority: z.number().int().min(1),
  reason: z.string().min(1),
});

export const PrioritizeTasksInputSchema = z.object({
  tasks: z.array(
    z.object({
      task_id: z.string().min(1),
      title: z.string().min(1),
      deadline: z.string(),
      risk_score: z.number().optional().default(0),
      completed_effort_hours: z.number().optional().default(0),
      total_effort_hours: z.number().optional(),
    })
  ).min(1),
});

export const PrioritizeTasksOutputSchema = z.object({
  ranked: z.array(PrioritizedTaskSchema),
});

// ==========================================
// Inferred TypeScript Types
// ==========================================
export type Subtask = z.infer<typeof SubtaskSchema>;
export type BreakIntoSubtasksInput = z.infer<typeof BreakIntoSubtasksInputSchema>;
export type BreakIntoSubtasksOutput = z.infer<typeof BreakIntoSubtasksOutputSchema>;

export type EffortEstimate = z.infer<typeof EffortEstimateSchema>;
export type EstimateEffortInput = z.infer<typeof EstimateEffortInputSchema>;
export type EstimateEffortOutput = z.infer<typeof EstimateEffortOutputSchema>;

export type SessionPlan = z.infer<typeof SessionSchema>;
export type CalculateScheduleInput = z.infer<typeof CalculateScheduleInputSchema>;
export type CalculateScheduleOutput = z.infer<typeof CalculateScheduleOutputSchema>;

export type RiskAssessment = z.infer<typeof RiskAssessmentSchema>;
export type AssessRiskInput = z.infer<typeof AssessRiskInputSchema>;
export type AssessRiskOutput = z.infer<typeof AssessRiskOutputSchema>;

export type RebalancePlanInput = z.infer<typeof RebalancePlanInputSchema>;
export type RebalancedPlan = z.infer<typeof RebalancedPlanSchema>;
export type RebalancedPlanOutput = z.infer<typeof RebalancedPlanOutputSchema>;

export type PrioritizedTask = z.infer<typeof PrioritizedTaskSchema>;
export type PrioritizeTasksInput = z.infer<typeof PrioritizeTasksInputSchema>;
export type PrioritizeTasksOutput = z.infer<typeof PrioritizeTasksOutputSchema>;
