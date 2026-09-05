import { format, parseISO, differenceInCalendarDays, isToday, isTomorrow, isYesterday } from "date-fns";
import { getRiskLevel } from "./risk";

/**
 * Formats a date relative to today (e.g. "Due today", "Tomorrow", "In 3 days", "Overdue by 2 days").
 */
export function formatRelativeDate(date: Date | string, referenceDate: Date = new Date()): string {
  const target = typeof date === "string" ? parseISO(date) : date;
  const daysDiff = differenceInCalendarDays(target, referenceDate);

  if (isToday(target)) {
    return "Due today";
  }
  if (isTomorrow(target)) {
    return "Due tomorrow";
  }
  if (isYesterday(target)) {
    return "Overdue by 1 day";
  }
  if (daysDiff < 0) {
    return `Overdue by ${Math.abs(daysDiff)} days`;
  }
  if (daysDiff === 1) {
    return "1 day left";
  }
  return `${daysDiff} days left`;
}

/**
 * Formats minutes into human-readable hours and minutes (e.g., "1h 30m", "45m", "2h").
 */
export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) {
    return "0m";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMins = Math.round(minutes % 60);

  if (hours === 0) {
    return `${remainingMins}m`;
  }
  if (remainingMins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMins}m`;
}

/**
 * Formats a risk score into a readable badge label with emoji.
 */
export function formatRiskLabel(score: number): string {
  const level = getRiskLevel(score);
  switch (level) {
    case "at_risk":
      return "At Risk 🔴";
    case "warning":
      return "Warning ⚠️";
    case "on_track":
    default:
      return "On Track ✅";
  }
}

/**
 * Formats a date into a clean display format like "Sep 4, 2026".
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d, yyyy");
}
