



export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface ToolResult {
  name: string;
  result: unknown;
}

export interface AgentStep {
  iteration: number;
  toolCall: ToolCall;
  toolResult: ToolResult;
  timestamp: string;
}

export interface AgentPlan {
  taskId: string;
  steps: AgentStep[];
  subtasks: AgentSubtask[];
  sessions: AgentSession[];
  riskAssessment: RiskAssessment | null;
  totalEstimatedMinutes: number;
}

export interface AgentSubtask {
  title: string;
  sequenceOrder: number;
  estimatedMinutes: number;
}

export interface AgentSession {
  subtaskTitle: string;
  plannedStart: string;
  plannedEnd: string;
  estimatedMinutes: number;
}

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  suggestions: string[];
}

export interface PrioritizedTask {
  taskId: string;
  title: string;
  urgencyScore: number;
  reason: string;
  recommendedAction: string;
}

export interface DailyBrief {
  greeting: string;
  todaySessions: AgentSession[];
  tasksAtRisk: Array<{
    taskId: string;
    title: string;
    riskLevel: string;
    reason: string;
  }>;
  recommendation: string;
}


export interface AgentConfig {
  maxIterations: number;
  model: string;
  temperature: number;
}

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  maxIterations: 10,
  model: 'gemini-2.5-flash',
  temperature: 0.7,
};
