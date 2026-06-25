




import type { AgentPlan, AgentConfig, DEFAULT_AGENT_CONFIG } from '@/types/agent';


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
  
  throw new Error('Agent loop not implemented yet — coming on Day 2');
}


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
  
  throw new Error('Replan loop not implemented yet — coming on Day 2');
}
