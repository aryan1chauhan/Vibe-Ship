import type { SubtaskEntry, ScheduledSession } from './types';

// ──────────────────────────────────────────────
// Component 6: Deterministic Business Logic
//
// Pure functions. No AI, no database, no side effects.
// Given inputs, they produce one correct output.
// ──────────────────────────────────────────────

export function calculateSchedule(
  subtasks: SubtaskEntry[],
  deadlineIso: string,
  dailyAvailableHours: number,
  workStartHour: number,
  workEndHour: number
): ScheduledSession[] {
  const deadline = new Date(deadlineIso);
  const now = new Date();
  const sessions: ScheduledSession[] = [];

  let currentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (now.getHours() >= workEndHour) {
    currentDay.setDate(currentDay.getDate() + 1);
  }

  let subtaskIndex = 0;
  let remainingMinutesForCurrentSubtask = subtasks[subtaskIndex]?.estimated_minutes || 0;

  while (subtaskIndex < subtasks.length && currentDay < deadline) {
    const dayStart = new Date(currentDay);
    dayStart.setHours(workStartHour, 0, 0, 0);

    const dayEndLimit = new Date(currentDay);
    dayEndLimit.setHours(workEndHour, 0, 0, 0);

    let sessionStart = new Date(dayStart);
    if (currentDay.toDateString() === now.toDateString()) {
      if (now.getHours() >= workStartHour) {
        const nextHour = now.getHours() + 1;
        if (nextHour < workEndHour) {
          sessionStart.setHours(nextHour, 0, 0, 0);
        } else {
          currentDay.setDate(currentDay.getDate() + 1);
          continue;
        }
      }
    }

    const maxMinutesToday = dailyAvailableHours * 60;
    let minutesScheduledToday = 0;

    while (
      subtaskIndex < subtasks.length &&
      minutesScheduledToday < maxMinutesToday &&
      sessionStart < dayEndLimit &&
      sessionStart < deadline
    ) {
      const currentSubtask = subtasks[subtaskIndex];
      const sessionMinutes = Math.min(
        remainingMinutesForCurrentSubtask,
        maxMinutesToday - minutesScheduledToday,
        (dayEndLimit.getTime() - sessionStart.getTime()) / (60 * 1000)
      );

      if (sessionMinutes <= 0) break;

      const sessionEnd = new Date(sessionStart.getTime() + sessionMinutes * 60 * 1000);
      if (sessionEnd > deadline) break;

      sessions.push({
        subtaskId: currentSubtask.id,
        subtaskTitle: currentSubtask.title,
        plannedStart: sessionStart.toISOString(),
        plannedEnd: sessionEnd.toISOString(),
        estimatedMinutes: sessionMinutes,
      });

      minutesScheduledToday += sessionMinutes;
      remainingMinutesForCurrentSubtask -= sessionMinutes;

      if (remainingMinutesForCurrentSubtask <= 0) {
        subtaskIndex++;
        if (subtaskIndex < subtasks.length) {
          remainingMinutesForCurrentSubtask = subtasks[subtaskIndex].estimated_minutes;
        }
      }

      sessionStart = new Date(sessionEnd.getTime() + 15 * 60 * 1000);
    }

    currentDay.setDate(currentDay.getDate() + 1);
  }

  return sessions;
}

export function rebalancePlan(
  missedSubtasks: SubtaskEntry[],
  remainingSubtasks: SubtaskEntry[],
  deadlineIso: string,
  currentTimeIso: string,
  dailyAvailableHours: number,
  workStartHour: number,
  workEndHour: number
): ScheduledSession[] {
  const mergedSubtasks = [...missedSubtasks, ...remainingSubtasks];
  return calculateSchedule(
    mergedSubtasks,
    deadlineIso,
    dailyAvailableHours,
    workStartHour,
    workEndHour
  );
}
