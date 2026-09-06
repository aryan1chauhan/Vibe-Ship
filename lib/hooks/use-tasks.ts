import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/lib/supabase/types";

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type Subtask = Database["public"]["Tables"]["subtasks"]["Row"];
export type Session = Database["public"]["Tables"]["sessions"]["Row"];

export interface TaskDetail extends Task {
  subtasks?: Subtask[];
  sessions?: Session[];
}

export interface TodaySessionItem extends Session {
  task?: {
    title: string;
    deadline: string;
  };
  subtask?: {
    title: string;
  };
}

/**
 * Hook to fetch all tasks for the logged in user
 */
export function useTaskList(statusFilter?: string) {
  return useQuery<{ tasks: Task[] }>({
    queryKey: ["tasks", { statusFilter }],
    queryFn: async () => {
      const res = await fetch("/api/tasks");
      if (!res.ok) {
        throw new Error("Failed to fetch tasks");
      }
      return res.json();
    },
  });
}

/**
 * Hook to fetch a single task with its subtasks and sessions
 */
export function useTask(id: string | null) {
  return useQuery<{ task: Task; subtasks: Subtask[]; sessions: Session[] }>({
    queryKey: ["tasks", id],
    queryFn: async () => {
      if (!id) throw new Error("Task ID required");
      const res = await fetch(`/api/tasks/${id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch task details");
      }
      return res.json();
    },
    enabled: !!id,
  });
}

/**
 * Hook to fetch today's scheduled sessions across all tasks
 */
export function useTodaySessions() {
  return useQuery<{ sessions: TodaySessionItem[] }>({
    queryKey: ["sessions", "today"],
    queryFn: async () => {
      const res = await fetch("/api/sessions/today");
      if (!res.ok) {
        throw new Error("Failed to fetch today's sessions");
      }
      return res.json();
    },
  });
}

/**
 * Hook to create a task and automatically trigger planning
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      title: string;
      description?: string;
      deadline: string;
    }) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create task");
      }

      const data = await res.json();
      return data.task as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

/**
 * Hook to update a task
 */
export function useUpdateTask(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Task>) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update task");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", taskId] });
    },
  });
}

/**
 * Hook to delete a task
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete task");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}
