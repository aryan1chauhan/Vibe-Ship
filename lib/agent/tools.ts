import { geminiModel } from '@/lib/gemini';
import { SchemaType } from '@google/generative-ai';
import { calculateSchedule } from './scheduling';
import type { AgentMemory } from './memory';
import type { SubtaskEntry, ScheduledSession, RiskAssessment, PrioritizedTask } from './types';

// ──────────────────────────────────────────────
// Component 4: Tool Layer
//
// Gemini-backed tool implementations (AI decisions)
// + tool dispatcher that routes tool calls from
// the reasoning loop to the right function.
//
// Gemini never touches the database. It asks your
// backend to use a tool, and the tool returns a result.
// ──────────────────────────────────────────────

// ── Gemini-backed implementations ───────────

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

// ── Tool Dispatcher ─────────────────────────
// Routes tool calls from the reasoning loop to
// the right function, updates memory in-place.

export async function executeTool(
  name: string,
  args: any,
  memory: AgentMemory
): Promise<any> {
  switch (name) {
    case 'break_into_subtasks': {
      const subtaskTitles = await breakIntoSubtasks(
        args.task_title,
        args.task_description,
        args.deadline_iso,
        args.task_type
      );
      memory.subtasks = subtaskTitles.map((title) => ({
        id: crypto.randomUUID(),
        title,
        estimated_minutes: 0,
      }));
      return { subtasks: subtaskTitles };
    }

    case 'estimate_effort': {
      const estimatedMinutes = await estimateEffort(
        args.subtask_title,
        args.context
      );
      const subtask = memory.subtasks.find(
        (s) => s.title === args.subtask_title
      );
      if (subtask) {
        subtask.estimated_minutes = estimatedMinutes;
      }
      return { estimated_minutes: estimatedMinutes };
    }

    case 'calculate_schedule': {
      const plan = calculateSchedule(
        memory.subtasks,
        args.deadline_iso,
        args.daily_available_hours || memory.userPrefs.daily_available_hours,
        args.work_start_hour || memory.userPrefs.work_start_hour,
        args.work_end_hour || memory.userPrefs.work_end_hour
      );
      memory.sessions = plan;
      return { plan };
    }

    case 'assess_risk': {
      const risk = await assessRisk(
        args.plan || memory.sessions,
        args.deadline_iso,
        args.current_time_iso
      );
      memory.riskAssessment = risk;
      return risk;
    }

    default:
      return null;
  }
}
