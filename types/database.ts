




export type TaskType = 'assignment' | 'project' | 'exam' | 'personal' | 'work';
export type TaskStatus = 'planned' | 'active' | 'completed' | 'missed' | 'replanned';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type SubtaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';
export type SessionStatus = 'planned' | 'in_progress' | 'completed' | 'missed' | 'rescheduled';
export type AgentEventType =
  | 'plan_created'
  | 'replan_triggered'
  | 'session_missed'
  | 'risk_detected'
  | 'task_completed'
  | 'priority_updated';





export interface Profile {
  id: string;
  name: string | null;
  timezone: string;
  daily_available_hours: number;
  work_start_hour: number;
  work_end_hour: number;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  deadline: string;
  task_type: TaskType;
  status: TaskStatus;
  priority: Priority;
  estimated_hours: number | null;
  actual_hours: number | null;
  ai_risk_level: RiskLevel;
  ai_risk_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  sequence_order: number;
  estimated_minutes: number;
  actual_minutes: number | null;
  status: SubtaskStatus;
  created_at: string;
}

export interface SprintSession {
  id: string;
  user_id: string;
  task_id: string;
  subtask_id: string;
  planned_start: string;
  planned_end: string;
  actual_start: string | null;
  actual_end: string | null;
  status: SessionStatus;
  notes: string | null;
  is_replanned: boolean;
  created_at: string;
}

export interface AgentEvent {
  id: string;
  user_id: string;
  task_id: string | null;
  event_type: AgentEventType;
  tool_called: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
}





export interface TaskWithSubtasks extends Task {
  subtasks: Subtask[];
}

export interface TaskWithDetails extends Task {
  subtasks: Subtask[];
  sessions: SprintSession[];
}

export interface SessionWithTask extends SprintSession {
  task: Task;
  subtask: Subtask;
}





export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'status' | 'priority' | 'ai_risk_level' | 'estimated_hours' | 'actual_hours' | 'ai_risk_reason'> & Partial<Pick<Task, 'id' | 'status' | 'priority' | 'ai_risk_level' | 'estimated_hours' | 'actual_hours' | 'ai_risk_reason'>>;
        Update: Partial<Task>;
      };
      subtasks: {
        Row: Subtask;
        Insert: Omit<Subtask, 'id' | 'created_at' | 'status' | 'actual_minutes'> & Partial<Pick<Subtask, 'id' | 'status' | 'actual_minutes'>>;
        Update: Partial<Subtask>;
      };
      sprint_sessions: {
        Row: SprintSession;
        Insert: Omit<SprintSession, 'id' | 'created_at' | 'status' | 'is_replanned' | 'actual_start' | 'actual_end' | 'notes'> & Partial<Pick<SprintSession, 'id' | 'status' | 'is_replanned' | 'actual_start' | 'actual_end' | 'notes'>>;
        Update: Partial<SprintSession>;
      };
      agent_events: {
        Row: AgentEvent;
        Insert: Omit<AgentEvent, 'id' | 'created_at'> & Partial<Pick<AgentEvent, 'id'>>;
        Update: Partial<AgentEvent>;
      };
    };
  };
}
