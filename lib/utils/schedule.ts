import { format, parseISO, isWeekend, addDays, isAfter, startOfDay } from "date-fns";

/**
 * Returns an array of working day dates in YYYY-MM-DD format between start and end dates.
 * By default excludes Saturdays and Sundays unless `includeWeekends` is true.
 */
export function getWorkingDays(
  startDate: Date | string,
  endDate: Date | string,
  includeWeekends: boolean = false
): string[] {
  const start = startOfDay(typeof startDate === "string" ? parseISO(startDate) : startDate);
  const end = startOfDay(typeof endDate === "string" ? parseISO(endDate) : endDate);

  if (isAfter(start, end)) {
    return [format(start, "yyyy-MM-dd")];
  }

  const days: string[] = [];
  let current = start;

  while (!isAfter(current, end)) {
    if (includeWeekends || !isWeekend(current)) {
      days.push(format(current, "yyyy-MM-dd"));
    }
    current = addDays(current, 1);
  }

  // Fallback: If no weekdays exist in range (e.g., span falls entirely on weekend), include all days
  if (days.length === 0) {
    current = start;
    while (!isAfter(current, end)) {
      days.push(format(current, "yyyy-MM-dd"));
      current = addDays(current, 1);
    }
  }

  return days;
}

/**
 * Calculates remaining available hours for a specific date, subtracting existing scheduled sessions.
 */
export function getAvailableHours(
  date: string,
  existingSessions: Array<{ scheduled_date: string; duration_minutes: number }>,
  dailyCapHours: number = 6
): number {
  const dayMinutes = existingSessions
    .filter((s) => s.scheduled_date === date)
    .reduce((acc, s) => acc + (s.duration_minutes || 0), 0);

  const usedHours = dayMinutes / 60;
  return Math.max(0, dailyCapHours - usedHours);
}

export interface DayEffortAllocation {
  date: string;
  hours: number;
}

/**
 * Spreads total work hours evenly across available days.
 */
export function distributeEffort(
  totalHours: number,
  availableDays: string[],
  maxHoursPerDay: number = 4
): DayEffortAllocation[] {
  if (availableDays.length === 0 || totalHours <= 0) {
    return [];
  }

  const numDays = availableDays.length;
  const rawAverage = totalHours / numDays;
  const baseHoursPerDay = Math.floor(Math.min(rawAverage, maxHoursPerDay) * 10) / 10;
  let remainingHours = Math.round((totalHours - baseHoursPerDay * numDays) * 10) / 10;

  const result: DayEffortAllocation[] = availableDays.map((date) => ({
    date,
    hours: baseHoursPerDay,
  }));

  // Distribute any remainder starting from earliest days
  let i = 0;
  while (remainingHours > 0.05 && i < result.length) {
    const add = Math.min(0.5, remainingHours);
    result[i].hours = Math.round((result[i].hours + add) * 10) / 10;
    remainingHours = Math.round((remainingHours - add) * 10) / 10;
    i = (i + 1) % result.length;
  }

  return result;
}

export interface PlannedSessionItem {
  scheduled_date: string;
  subtask_title: string;
  duration_minutes: number;
}

/**
 * Algorithmic scheduler that chunks subtasks into 60-120 minute work sessions
 * and distributes them across available working days up to deadline.
 */
export function buildWorkSchedule(
  subtasks: Array<{ title: string; effort_hours: number }>,
  deadline: string,
  startDate: Date | string = new Date(),
  availableDaysOverride?: string[]
): PlannedSessionItem[] {
  const days =
    availableDaysOverride && availableDaysOverride.length > 0
      ? availableDaysOverride
      : getWorkingDays(startDate, deadline, false);

  if (days.length === 0) {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    return subtasks.map((s) => ({
      scheduled_date: todayStr,
      subtask_title: s.title,
      duration_minutes: Math.round(s.effort_hours * 60),
    }));
  }

  const sessions: PlannedSessionItem[] = [];
  let currentDayIndex = 0;
  let currentDayMinutes = 0;
  const targetMaxMinutesPerDay = 180; // 3 hours per day preferred target

  for (const subtask of subtasks) {
    let subtaskMinutesRemaining = Math.max(30, Math.round(subtask.effort_hours * 60));

    while (subtaskMinutesRemaining > 0) {
      // Choose a block size between 45 and 120 minutes
      const maxBlock = 120;
      const blockDuration = Math.min(maxBlock, subtaskMinutesRemaining);

      // If current day already has lots of work and more days are available, advance day
      if (
        currentDayMinutes + blockDuration > targetMaxMinutesPerDay &&
        currentDayIndex < days.length - 1
      ) {
        currentDayIndex++;
        currentDayMinutes = 0;
      }

      sessions.push({
        scheduled_date: days[currentDayIndex],
        subtask_title: subtask.title,
        duration_minutes: blockDuration,
      });

      currentDayMinutes += blockDuration;
      subtaskMinutesRemaining -= blockDuration;

      // If day reached target and we have more days, advance day
      if (currentDayMinutes >= targetMaxMinutesPerDay && currentDayIndex < days.length - 1) {
        currentDayIndex++;
        currentDayMinutes = 0;
      }
    }
  }

  return sessions;
}
