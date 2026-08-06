export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          deadline: string;
          status: "pending" | "active" | "completed" | "at_risk" | "overdue";
          total_effort_hours: number | null;
          completed_effort_hours: number;
          risk_score: number;
          risk_reason: string | null;
          priority: number;
          ai_metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          deadline: string;
          status?: "pending" | "active" | "completed" | "at_risk" | "overdue";
          total_effort_hours?: number | null;
          completed_effort_hours?: number;
          risk_score?: number;
          risk_reason?: string | null;
          priority?: number;
          ai_metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          deadline?: string;
          status?: "pending" | "active" | "completed" | "at_risk" | "overdue";
          total_effort_hours?: number | null;
          completed_effort_hours?: number;
          risk_score?: number;
          risk_reason?: string | null;
          priority?: number;
          ai_metadata?: Record<string, unknown>;
          updated_at?: string;
        };
      };
      subtasks: {
        Row: {
          id: string;
          task_id: string;
          title: string;
          description: string | null;
          effort_hours: number;
          sequence: number;
          is_completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          title: string;
          description?: string | null;
          effort_hours?: number;
          sequence?: number;
          is_completed?: boolean;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          effort_hours?: number;
          sequence?: number;
          is_completed?: boolean;
        };
      };
      sessions: {
        Row: {
          id: string;
          task_id: string;
          subtask_id: string | null;
          scheduled_date: string;
          duration_minutes: number;
          status: "scheduled" | "completed" | "missed" | "rescheduled";
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          subtask_id?: string | null;
          scheduled_date: string;
          duration_minutes?: number;
          status?: "scheduled" | "completed" | "missed" | "rescheduled";
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          subtask_id?: string | null;
          scheduled_date?: string;
          duration_minutes?: number;
          status?: "scheduled" | "completed" | "missed" | "rescheduled";
          started_at?: string | null;
          completed_at?: string | null;
        };
      };
      agent_logs: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          agent_mode: "plan" | "renegotiate" | "brief" | "prioritize";
          tool_name: string;
          tool_input: Record<string, unknown>;
          tool_output: Record<string, unknown>;
          step_number: number;
          status: "running" | "completed" | "error";
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id: string;
          agent_mode: "plan" | "renegotiate" | "brief" | "prioritize";
          tool_name: string;
          tool_input?: Record<string, unknown>;
          tool_output?: Record<string, unknown>;
          step_number?: number;
          status?: "running" | "completed" | "error";
          created_at?: string;
        };
        Update: {
          tool_output?: Record<string, unknown>;
          status?: "running" | "completed" | "error";
        };
      };
    };
  };
};

// Convenience aliases
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];
export type Subtask = Database["public"]["Tables"]["subtasks"]["Row"];
export type SubtaskInsert = Database["public"]["Tables"]["subtasks"]["Insert"];
export type Session = Database["public"]["Tables"]["sessions"]["Row"];
export type SessionInsert = Database["public"]["Tables"]["sessions"]["Insert"];
export type SessionUpdate = Database["public"]["Tables"]["sessions"]["Update"];
export type AgentLog = Database["public"]["Tables"]["agent_logs"]["Row"];
export type AgentLogInsert = Database["public"]["Tables"]["agent_logs"]["Insert"];

export type TaskStatus = Task["status"];
export type SessionStatus = Session["status"];
export type AgentMode = AgentLog["agent_mode"];
export type AgentLogStatus = AgentLog["status"];
