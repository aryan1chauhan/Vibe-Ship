import { geminiModel } from '@/lib/gemini';
import { SchemaType } from '@google/generative-ai';

export async function breakIntoSubtasks(
  taskTitle: string,
  taskDescription: string | undefined,
  deadlineIso: string,
  taskType: string
): Promise<string[]> {
  const prompt = `Decompose the following task into 3-8 subtasks:
Title: ${taskTitle}
Description: ${taskDescription || 'None'}
Deadline: ${deadlineIso}
Type: ${taskType}

The subtasks must be concrete, actionable, and sequentially ordered.`;

  const result = await geminiModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          subtasks: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
        },
        required: ['subtasks'],
      },
    },
  });

  const responseText = result.response.text();
  const parsed = JSON.parse(responseText);
  return parsed.subtasks;
}

export async function estimateEffort(
  subtaskTitle: string,
  context: string
): Promise<number> {
  const prompt = `Estimate the time required in minutes for this subtask:
Subtask: ${subtaskTitle}
Context: ${context}

Provide a realistic estimate for a student or knowledge worker, between 15 and 240 minutes. Round to a multiple of 15.`;

  const result = await geminiModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          estimated_minutes: { type: SchemaType.NUMBER },
        },
        required: ['estimated_minutes'],
      },
    },
  });

  const responseText = result.response.text();
  const parsed = JSON.parse(responseText);
  return parsed.estimated_minutes;
}

export interface ScheduledSession {
  subtaskTitle: string;
  plannedStart: string;
  plannedEnd: string;
  estimatedMinutes: number;
}

export function calculateSchedule(
  subtasks: { title: string; estimated_minutes: number }[],
  deadlineIso: string,
  dailyAvailableHours: number,
  workStartHour: number
): ScheduledSession[] {
  const deadline = new Date(deadlineIso);
  const now = new Date();
  const sessions: ScheduledSession[] = [];
  
  let currentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (now.getHours() >= 22) {
    currentDay.setDate(currentDay.getDate() + 1);
  }

  let subtaskIndex = 0;
  let remainingMinutesForCurrentSubtask = subtasks[subtaskIndex]?.estimated_minutes || 0;

  while (subtaskIndex < subtasks.length && currentDay < deadline) {
    const dayStart = new Date(currentDay);
    dayStart.setHours(workStartHour, 0, 0, 0);

    const dayEndLimit = new Date(currentDay);
    dayEndLimit.setHours(22, 0, 0, 0);

    let sessionStart = new Date(dayStart);
    if (currentDay.toDateString() === now.toDateString()) {
      if (now.getHours() >= workStartHour) {
        const nextHour = now.getHours() + 1;
        if (nextHour < 22) {
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

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  suggestions: string[];
}

export async function assessRisk(
  plan: ScheduledSession[],
  deadlineIso: string,
  currentTimeIso: string
): Promise<RiskAssessment> {
  const prompt = `Assess the risk of this sprint plan:
Plan: ${JSON.stringify(plan)}
Deadline: ${deadlineIso}
Current Time: ${currentTimeIso}

Evaluate if the plan is realistic, checking if there is enough time, if sessions are too packed, or if the deadline is dangerously close.`;

  const result = await geminiModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          level: {
            type: SchemaType.STRING,
            enum: ['low', 'medium', 'high', 'critical'],
          },
          reason: { type: SchemaType.STRING },
          suggestions: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
        },
        required: ['level', 'reason', 'suggestions'],
      } as any,
    },
  });

  const responseText = result.response.text();
  return JSON.parse(responseText);
}

export function rebalancePlan(
  missedSubtasks: { title: string; estimated_minutes: number }[],
  remainingSubtasks: { title: string; estimated_minutes: number }[],
  deadlineIso: string,
  currentTimeIso: string,
  dailyAvailableHours: number
): ScheduledSession[] {
  const mergedSubtasks = [...missedSubtasks, ...remainingSubtasks];
  return calculateSchedule(mergedSubtasks, deadlineIso, dailyAvailableHours, 9);
}

export interface PrioritizedTask {
  taskId: string;
  title: string;
  urgencyScore: number;
  reason: string;
  recommendedAction: string;
}

export async function prioritizeTasks(
  tasks: {
    task_id: string;
    title: string;
    deadline: string;
    estimated_hours: number;
    status: string;
  }[],
  currentTimeIso: string
): Promise<PrioritizedTask[]> {
  const prompt = `Rank these tasks by urgency and recommend focus actions:
Tasks: ${JSON.stringify(tasks)}
Current Time: ${currentTimeIso}

Assign urgency scores (1-100), explain why, and provide a recommended action.`;

  const result = await geminiModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          prioritized: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                task_id: { type: SchemaType.STRING },
                title: { type: SchemaType.STRING },
                urgency_score: { type: SchemaType.NUMBER },
                reason: { type: SchemaType.STRING },
                recommended_action: { type: SchemaType.STRING },
              },
              required: [
                'task_id',
                'title',
                'urgency_score',
                'reason',
                'recommended_action',
              ],
            },
          },
        },
        required: ['prioritized'],
      },
    },
  });

  const responseText = result.response.text();
  const parsed = JSON.parse(responseText);
  return parsed.prioritized;
}
