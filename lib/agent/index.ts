// ============================================
// CrunchAI — Agent Runner
// Stub for Day 1 — full implementation on Day 2
// ============================================

import type { AgentPlan, AgentConfig, DEFAULT_AGENT_CONFIG } from '@/types/agent';

/**
 * Run the agentic planning loop using Gemini Function Calling.
 * 
 * This function:
 * 1. Sends the task + user context to Gemini with tool definitions
 * 2. Gemini decides which tool to call first
 * 3. We execute the tool and return results
 * 4. Gemini reasons about results and calls the next tool
 * 5. Loop continues until Gemini returns a final plan
 * 
 * Typical flow:
 *   break_into_subtasks → estimate_effort (×N) → calculate_schedule → assess_risk
 * 
 * @param taskId - The task ID to plan for
 * @param userMessage - Natural language description of the task
 * @param userPrefs - User preferences (work hours, availability, etc.)
 * @returns AgentPlan with subtasks, sessions, and risk assessment
 */
export async function runAgentLoop(
  taskId: string,
  userMessage: string,
  userPrefs: {
    daily_available_hours: number;
    work_start_hour: number;
    work_end_hour: number;
    timezone: string;
  }
): Promise<AgentPlan> {
  // Day 2: Implement the full Gemini function calling loop
  throw new Error('Agent loop not implemented yet — coming on Day 2');
}

/**
 * Run the replanning loop after missed sessions.
 */
export async function runReplanLoop(
  taskId: string,
  missedSubtaskIds: string[],
  userPrefs: {
    daily_available_hours: number;
    work_start_hour: number;
    work_end_hour: number;
    timezone: string;
  }
): Promise<AgentPlan> {
  // Day 2: Implement replanning
  throw new Error('Replan loop not implemented yet — coming on Day 2');
}
