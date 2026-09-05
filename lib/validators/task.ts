import { z } from "zod";

export const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  description: z.string().max(2000, "Description too long").optional().nullable(),
  deadline: z.string().datetime({ message: "Deadline must be a valid ISO datetime" }),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  deadline: z.string().datetime().optional(),
  status: z.enum(["pending", "active", "completed", "at_risk", "overdue"]).optional(),
  total_effort_hours: z.number().int().nonnegative().optional().nullable(),
  completed_effort_hours: z.number().int().nonnegative().optional(),
  risk_score: z.number().min(0).max(1).optional(),
  risk_reason: z.string().optional().nullable(),
  priority: z.number().int().min(1).optional(),
});

export const UpdateSessionSchema = z.object({
  status: z.enum(["scheduled", "completed", "missed", "rescheduled"]),
  duration_minutes: z.number().int().positive().optional(),
});

export const AgentPlanRequestSchema = z.object({
  taskId: z.string().uuid("Task ID must be a valid UUID"),
});

export const AgentRenegotiateRequestSchema = z.object({
  taskId: z.string().uuid("Task ID must be a valid UUID"),
  missedSessionId: z.string().uuid("Missed session ID must be a valid UUID").optional(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type UpdateSessionInput = z.infer<typeof UpdateSessionSchema>;
export type AgentPlanRequest = z.infer<typeof AgentPlanRequestSchema>;
export type AgentRenegotiateRequest = z.infer<typeof AgentRenegotiateRequestSchema>;
