import type { SubtaskEntry, ScheduledSession, RiskAssessment, UserPrefs } from './types';

// ──────────────────────────────────────────────
// Component 9: Agent Working Memory
//
// In-flight state container for one agent run.
// Replaces the loose local variables that were
// scattered across runAgentLoop().
// ──────────────────────────────────────────────

export interface AgentMemory {
  task: any;
  userPrefs: UserPrefs;
  mode: 'plan' | 'replan';
  subtasks: SubtaskEntry[];
  sessions: ScheduledSession[];
  riskAssessment: RiskAssessment | null;
}

export function createMemory(
  task: any,
  userPrefs: UserPrefs,
  mode: 'plan' | 'replan'
): AgentMemory {
  return {
    task,
    userPrefs,
    mode,
    subtasks: [],
    sessions: [],
    riskAssessment: null,
  };
}
