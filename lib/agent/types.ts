import type { SupabaseClient } from '@supabase/supabase-js';

// ──────────────────────────────────────────────
// Subtask entry (in-memory representation)
// ──────────────────────────────────────────────

export interface SubtaskEntry {
  id: string;
  title: string;
  estimated_minutes: number;
}

// ──────────────────────────────────────────────
// Scheduled session (output of calculateSchedule)
// ──────────────────────────────────────────────

export interface ScheduledSession {
  subtaskId: string;
  subtaskTitle: string;
  plannedStart: string;
  plannedEnd: string;
  estimatedMinutes: number;
}

// ──────────────────────────────────────────────
// Risk assessment (output of assessRisk)
// ──────────────────────────────────────────────

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  suggestions: string[];
}

// ──────────────────────────────────────────────
// Validation
// ──────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

// ──────────────────────────────────────────────
// Prioritization (output of prioritizeTasks)
// ──────────────────────────────────────────────

export interface PrioritizedTask {
  taskId: string;
  title: string;
  urgencyScore: number;
  reason: string;
  recommendedAction: string;
}

// ──────────────────────────────────────────────
// User preferences (from profiles table)
// ──────────────────────────────────────────────

export interface UserPrefs {
  daily_available_hours: number;
  work_start_hour: number;
  work_end_hour: number;
  timezone: string;
}

// ──────────────────────────────────────────────
// Agent context (passed from trigger layer)
// ──────────────────────────────────────────────

export interface AgentContext {
  supabase: SupabaseClient;
  taskId: string;
  userId: string;
  userPrefs: UserPrefs;
  mode: 'plan' | 'replan';
}

// ──────────────────────────────────────────────
// Agent loop options (public API)
// ──────────────────────────────────────────────

export interface AgentLoopOptions {
  mode?: 'plan' | 'replan';
}
