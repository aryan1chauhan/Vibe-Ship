import { calculateSchedule, rebalancePlan } from '../scheduling';
import { validateAgentPlan } from '../validation';

function runScheduleTest() {
  console.log('Testing calculateSchedule with non-default profile (11:00 to 20:00)...');

  const subtasks = [
    { id: 'sub-1', title: 'Write Chapter 1', estimated_minutes: 120 },
    { id: 'sub-2', title: 'Write Chapter 2', estimated_minutes: 180 },
    { id: 'sub-3', title: 'Review & Edit', estimated_minutes: 90 },
  ];

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 5);
  const deadlineIso = deadline.toISOString();

  const userPrefs = {
    daily_available_hours: 4,
    work_start_hour: 11, // 11 AM
    work_end_hour: 20,   // 8 PM
    timezone: 'Asia/Kolkata',
  };

  const sessions = calculateSchedule(
    subtasks,
    deadlineIso,
    userPrefs.daily_available_hours,
    userPrefs.work_start_hour,
    userPrefs.work_end_hour
  );

  console.log(`Generated ${sessions.length} scheduled sessions.`);

  for (const session of sessions) {
    const start = new Date(session.plannedStart);
    const end = new Date(session.plannedEnd);

    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;

    console.log(
      `Session "${session.subtaskTitle}": ${start.toISOString()} (Start Hour: ${startHour}, End Hour: ${endHour})`
    );

    if (startHour < userPrefs.work_start_hour) {
      throw new Error(
        `TEST FAILED: Session start hour (${startHour}) is before work_start_hour (${userPrefs.work_start_hour})`
      );
    }

    if (endHour > userPrefs.work_end_hour) {
      throw new Error(
        `TEST FAILED: Session end hour (${endHour}) is after work_end_hour (${userPrefs.work_end_hour})`
      );
    }
  }

  console.log('Testing rebalancePlan with non-default profile...');
  const rebalanced = rebalancePlan(
    [subtasks[0]],
    [subtasks[1], subtasks[2]],
    deadlineIso,
    new Date().toISOString(),
    userPrefs.daily_available_hours,
    userPrefs.work_start_hour,
    userPrefs.work_end_hour
  );

  for (const session of rebalanced) {
    const start = new Date(session.plannedStart);
    const end = new Date(session.plannedEnd);

    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;

    if (startHour < userPrefs.work_start_hour || endHour > userPrefs.work_end_hour) {
      throw new Error(
        `TEST FAILED: Rebalanced session ${session.subtaskTitle} (${startHour} - ${endHour}) outside window (${userPrefs.work_start_hour} - ${userPrefs.work_end_hour})`
      );
    }
  }

  const riskAssessment = {
    level: 'low' as const,
    reason: 'Plan is realistic',
    suggestions: ['Keep working'],
  };

  const validation = validateAgentPlan(subtasks, sessions, riskAssessment, userPrefs);
  if (!validation.valid) {
    throw new Error(`TEST FAILED: Validation returned invalid: ${validation.reason}`);
  }

  console.log('✅ ALL TESTS PASSED: All sessions strictly stay within 11:00 - 20:00 work window.');
}

runScheduleTest();
