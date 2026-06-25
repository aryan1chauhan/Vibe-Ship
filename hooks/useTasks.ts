'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import type { Task, TaskType } from '@/types/database';


export function useTasksQuery() {
  return useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      return data.tasks;
    },
  });
}


export function useTaskQuery(id: string) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${id}`);
      if (!res.ok) throw new Error('Failed to fetch task');
      return res.json();
    },
    enabled: !!id,
  });
}


export function useCreateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string | null;
      deadline: string;
      task_type?: TaskType;
    }) => {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create task');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}


export function useUpdateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      status?: string;
      priority?: string;
      title?: string;
      description?: string;
    }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update task');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.id] });
    },
  });
}


export function useDeleteTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete task');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
