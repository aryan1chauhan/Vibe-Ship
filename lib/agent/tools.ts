// ============================================
// CrunchAI — Agent Tool Definitions
// These are the 6 tools Gemini can call
// ============================================

import { SchemaType } from '@google/generative-ai';

export const AGENT_TOOLS = [
  {
    name: 'break_into_subtasks',
    description:
      'Break a high-level task into concrete, actionable subtasks. Each subtask should be small enough to complete in one work session (30-120 minutes). Return an ordered array of subtask titles.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        task_title: {
          type: SchemaType.STRING,
          description: 'The title of the main task to break down',
        },
        task_description: {
          type: SchemaType.STRING,
          description: 'Additional context or description for the task',
        },
        deadline_iso: {
          type: SchemaType.STRING,
          description: 'ISO 8601 deadline string',
        },
        task_type: {
          type: SchemaType.STRING,
          description: 'Type of task',
          enum: ['assignment', 'project', 'exam', 'personal', 'work'],
        },
      },
      required: ['task_title', 'deadline_iso', 'task_type'],
    },
  },
  {
    name: 'estimate_effort',
    description:
      'Estimate the time in minutes required for a single subtask. Consider complexity, typical human work pace, and potential blockers. Return a number between 15 and 240.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        subtask_title: {
          type: SchemaType.STRING,
          description: 'The title of the subtask to estimate',
        },
        context: {
          type: SchemaType.STRING,
          description:
            'Context about the parent task and what this subtask involves',
        },
      },
      required: ['subtask_title', 'context'],
    },
  },
  {
    name: 'calculate_schedule',
    description:
      'Map subtasks to time slots given a deadline and user availability. Create a day-by-day schedule of work sessions. Each session should be 30-120 minutes. Return an array of scheduled sessions with start/end times.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        subtasks: {
          type: SchemaType.ARRAY,
          description: 'Array of subtasks with their estimated minutes',
          items: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING },
              estimated_minutes: { type: SchemaType.NUMBER },
            },
            required: ['title', 'estimated_minutes'],
          },
        },
        deadline_iso: {
          type: SchemaType.STRING,
          description: 'ISO 8601 deadline string',
        },
        daily_available_hours: {
          type: SchemaType.NUMBER,
          description: 'Hours available per day for this type of work',
        },
        work_start_hour: {
          type: SchemaType.NUMBER,
          description: 'Hour of day when work typically starts (0-23)',
        },
      },
      required: [
        'subtasks',
        'deadline_iso',
        'daily_available_hours',
        'work_start_hour',
      ],
    },
  },
  {
    name: 'assess_risk',
    description:
      'Evaluate if the plan is realistic and flag risks. Check if there is enough time, if sessions are too packed, or if the deadline is dangerously close. Return a risk level and explanation.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        plan: {
          type: SchemaType.ARRAY,
          description: 'Array of planned sessions',
          items: {
            type: SchemaType.OBJECT,
            properties: {
              subtask_title: { type: SchemaType.STRING },
              planned_start: { type: SchemaType.STRING },
              planned_end: { type: SchemaType.STRING },
              estimated_minutes: { type: SchemaType.NUMBER },
            },
            required: [
              'subtask_title',
              'planned_start',
              'planned_end',
              'estimated_minutes',
            ],
          },
        },
        deadline_iso: {
          type: SchemaType.STRING,
          description: 'ISO 8601 deadline string',
        },
        current_time_iso: {
          type: SchemaType.STRING,
          description: 'Current ISO 8601 timestamp',
        },
      },
      required: ['plan', 'deadline_iso', 'current_time_iso'],
    },
  },
  {
    name: 'rebalance_plan',
    description:
      'Regenerate the schedule after missed sessions. Compress remaining work into available time slots before the deadline. Return a new set of sessions.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        missed_subtasks: {
          type: SchemaType.ARRAY,
          description: 'Subtasks that were missed or not completed',
          items: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING },
              estimated_minutes: { type: SchemaType.NUMBER },
            },
            required: ['title', 'estimated_minutes'],
          },
        },
        remaining_subtasks: {
          type: SchemaType.ARRAY,
          description: 'Subtasks still pending',
          items: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING },
              estimated_minutes: { type: SchemaType.NUMBER },
            },
            required: ['title', 'estimated_minutes'],
          },
        },
        deadline_iso: {
          type: SchemaType.STRING,
          description: 'ISO 8601 deadline string',
        },
        current_time_iso: {
          type: SchemaType.STRING,
          description: 'Current ISO 8601 timestamp',
        },
        daily_available_hours: {
          type: SchemaType.NUMBER,
          description: 'Hours available per day',
        },
      },
      required: [
        'missed_subtasks',
        'remaining_subtasks',
        'deadline_iso',
        'current_time_iso',
        'daily_available_hours',
      ],
    },
  },
  {
    name: 'prioritize_tasks',
    description:
      'Rank multiple tasks by urgency and recommend what to focus on today. Consider deadlines, estimated remaining work, and current status. Return a ranked list with urgency scores.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        tasks: {
          type: SchemaType.ARRAY,
          description: 'Array of tasks to prioritize',
          items: {
            type: SchemaType.OBJECT,
            properties: {
              task_id: { type: SchemaType.STRING },
              title: { type: SchemaType.STRING },
              deadline: { type: SchemaType.STRING },
              estimated_hours: { type: SchemaType.NUMBER },
              status: { type: SchemaType.STRING },
            },
            required: ['task_id', 'title', 'deadline', 'estimated_hours', 'status'],
          },
        },
        current_time_iso: {
          type: SchemaType.STRING,
          description: 'Current ISO 8601 timestamp',
        },
      },
      required: ['tasks', 'current_time_iso'],
    },
  },
];

// Tool name type for type safety
export type AgentToolName =
  | 'break_into_subtasks'
  | 'estimate_effort'
  | 'calculate_schedule'
  | 'assess_risk'
  | 'rebalance_plan'
  | 'prioritize_tasks';
