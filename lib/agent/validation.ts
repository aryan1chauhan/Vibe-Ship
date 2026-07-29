import type { SubtaskEntry, ScheduledSession, RiskAssessment, ValidationResult } from './types';

// ──────────────────────────────────────────────
// Component 5: Validation Layer
//
// Pure function. No side effects.
// Checks that AI-generated data is sane before
// it's trusted and written to the database.
// ──────────────────────────────────────────────

export function validateAgentPlan(
  subtasks: SubtaskEntry[],
  sessions: ScheduledSession[],
  riskAssessment: RiskAssessment | null,
  userPrefs: { work_start_hour: number; work_end_hour: number }
): ValidationResult {
  if (!subtasks || subtasks.length === 0) {
    return { valid: false, reason: 'No subtasks generated' };
  }

  for (const sub of subtasks) {
    if (!sub.id) {
      return { valid: false, reason: `Subtask "${sub.title}" is missing a valid ID` };
    }
    if (typeof sub.estimated_minutes !== 'number' || sub.estimated_minutes < 5 || sub.estimated_minutes > 480) {
      return {
        valid: false,
        reason: `Subtask "${sub.title}" estimated_minutes (${sub.estimated_minutes}) out of valid range (5-480 min)`,
      };
    }
  }

  const validSubtaskIds = new Set(subtasks.map((s) => s.id));
  for (const session of sessions) {
    if (!session.subtaskId || !validSubtaskIds.has(session.subtaskId)) {
      return {
        valid: false,
        reason: `Scheduled session references unknown or missing subtask ID: "${session.subtaskId || 'null'}"`,
      };
    }

    const start = new Date(session.plannedStart);
    const end = new Date(session.plannedEnd);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;

    if (startHour < userPrefs.work_start_hour) {
      return {
        valid: false,
        reason: `Session planned start (${start.toISOString()}) starts before user work_start_hour (${userPrefs.work_start_hour})`,
      };
    }
    if (endHour > userPrefs.work_end_hour) {
      return {
        valid: false,
        reason: `Session planned end (${end.toISOString()}) ends after user work_end_hour (${userPrefs.work_end_hour})`,
      };
    }
  }

  if (!riskAssessment) {
    return { valid: false, reason: 'Risk assessment is missing' };
  }

  const validRiskLevels = ['low', 'medium', 'high', 'critical'];
  if (!riskAssessment.level || !validRiskLevels.includes(riskAssessment.level)) {
    return {
      valid: false,
      reason: `Invalid risk level: "${riskAssessment?.level}". Must be low, medium, high, or critical`,
    };
  }

  if (!riskAssessment.reason || typeof riskAssessment.reason !== 'string') {
    return { valid: false, reason: 'Risk assessment reason is missing or invalid' };
  }

  return { valid: true };
}
