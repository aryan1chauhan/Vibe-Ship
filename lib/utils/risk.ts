import { differenceInHours, parseISO } from "date-fns";

export interface RiskCalculationParams {
  deadline: Date | string;
  totalEffortHours: number;
  completedEffortHours?: number;
  sessions?: Array<{
    scheduled_date: string;
    duration_minutes: number;
    status?: string;
  }>;
  now?: Date;
}

export type RiskLevel = "on_track" | "warning" | "at_risk";

export interface RiskCalculationResult {
  score: number;
  level: RiskLevel;
  reason: string;
  bottleneckDays: string[];
  factors: {
    timePressure: number;
    completionFactor: number;
    missedFactor: number;
    bottleneckFactor: number;
  };
}

/**
 * Calculates deadline risk score (0.0 to 1.0) based on weighted formula:
 * - Time pressure (0.4)
 * - Completion rate (0.3)
 * - Missed sessions (0.2)
 * - Bottleneck days (0.1)
 */
export function calculateRiskScore(params: RiskCalculationParams): RiskCalculationResult {
  const now = params.now || new Date();
  const deadlineDate =
    typeof params.deadline === "string" ? parseISO(params.deadline) : params.deadline;

  const hoursUntilDeadline = Math.max(1, differenceInHours(deadlineDate, now));
  const completedEffort = params.completedEffortHours || 0;
  const remainingEffort = Math.max(0, params.totalEffortHours - completedEffort);

  // 1. Time pressure: (effort_remaining_hours / hours_until_deadline) * 0.4
  // If remaining hours exceed hours until deadline, ratio > 1
  const rawTimePressure = remainingEffort / hoursUntilDeadline;
  const timePressure = Math.min(1.0, rawTimePressure) * 0.4;

  const sessions = params.sessions || [];
  const totalSessions = Math.max(1, sessions.length);
  const completedSessions = sessions.filter((s) => s.status === "completed").length;
  const missedSessions = sessions.filter((s) => s.status === "missed").length;

  // 2. Completion rate factor: (1 - completed_sessions / total_sessions) * 0.3
  const completionFactor = (1 - completedSessions / totalSessions) * 0.3;

  // 3. Missed sessions factor: (missed_count / total_sessions) * 0.2
  const missedFactor = (missedSessions / totalSessions) * 0.2;

  // 4. Bottleneck days: days with 3+ hours (180 mins) of work
  const minutesByDay: Record<string, number> = {};
  for (const s of sessions) {
    minutesByDay[s.scheduled_date] = (minutesByDay[s.scheduled_date] || 0) + s.duration_minutes;
  }

  const bottleneckDays = Object.entries(minutesByDay)
    .filter(([, minutes]) => minutes >= 180)
    .map(([date]) => date);

  const totalDays = Math.max(1, Object.keys(minutesByDay).length);
  const bottleneckFactor = (bottleneckDays.length / totalDays) * 0.1;

  // Weighted sum clamped between 0.0 and 1.0
  const weightedSum = timePressure + completionFactor + missedFactor + bottleneckFactor;
  const score = Math.round(Math.min(1.0, Math.max(0.0, weightedSum)) * 100) / 100;

  const level = getRiskLevel(score);
  const reason = generateRiskReason(score, {
    timePressure: rawTimePressure,
    missedSessions,
    bottleneckDaysCount: bottleneckDays.length,
    remainingEffort,
    hoursUntilDeadline,
  });

  return {
    score,
    level,
    reason,
    bottleneckDays,
    factors: {
      timePressure: Math.round(timePressure * 100) / 100,
      completionFactor: Math.round(completionFactor * 100) / 100,
      missedFactor: Math.round(missedFactor * 100) / 100,
      bottleneckFactor: Math.round(bottleneckFactor * 100) / 100,
    },
  };
}

/**
 * Returns categorical risk level from numerical score.
 * Thresholds:
 * - >= 0.8: at_risk
 * - >= 0.5: warning
 * - < 0.5: on_track
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score >= 0.8) return "at_risk";
  if (score >= 0.5) return "warning";
  return "on_track";
}

function generateRiskReason(
  score: number,
  context: {
    timePressure: number;
    missedSessions: number;
    bottleneckDaysCount: number;
    remainingEffort: number;
    hoursUntilDeadline: number;
  }
): string {
  if (score >= 0.8) {
    if (context.missedSessions > 0) {
      return `Critical risk: ${context.missedSessions} missed session(s) and only ${context.hoursUntilDeadline}h left for ${context.remainingEffort}h of work.`;
    }
    if (context.timePressure > 0.5) {
      return `High urgency: Remaining effort (${context.remainingEffort}h) is dangerously close to deadline (${context.hoursUntilDeadline}h away).`;
    }
    return `Deadline at severe risk due to workload concentration and tight schedule.`;
  }

  if (score >= 0.5) {
    if (context.bottleneckDaysCount > 0) {
      return `Moderate warning: ${context.bottleneckDaysCount} heavy bottleneck day(s) planned (3+ hours/day).`;
    }
    if (context.missedSessions > 0) {
      return `Warning: ${context.missedSessions} missed session detected; renegotiation recommended.`;
    }
    return `Schedule is tight with moderate deadline pressure. Pace needs to be maintained.`;
  }

  return "Schedule is on track with comfortable breathing room across available working days.";
}
