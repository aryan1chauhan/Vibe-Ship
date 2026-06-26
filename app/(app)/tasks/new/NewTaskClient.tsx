'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { NaturalLanguageInput } from '@/components/tasks/NaturalLanguageInput';
import { AgentThinkingLog } from '@/components/agent/AgentThinkingLog';
import { createClient } from '@/lib/supabase/client';
import type { TaskType } from '@/types/database';

export function NewTaskClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);

  const handleSubmit = async (data: {
    title: string;
    description: string;
    deadline: string;
    taskType: TaskType;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description || null,
          deadline: new Date(data.deadline).toISOString(),
          task_type: data.taskType,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create task');
      }

      const { task } = await res.json();
      setTaskId(task.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  // Realtime subscription for agent events
  useEffect(() => {
    if (!taskId) return;

    const supabase = createClient();
    
    // Fetch any initial events
    const fetchEvents = async () => {
      const { data } = await supabase
        .from('agent_events')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });
      if (data) {
        setEvents(data);
      }
    };
    
    fetchEvents();

    const channel = supabase
      .channel(`task-events-${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_events',
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          setEvents((prev) => {
            if (prev.some((e) => e.id === payload.new.id)) return prev;
            const newEvents = [...prev, payload.new];
            return newEvents.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  // Handle redirect after planning is complete
  useEffect(() => {
    if (!taskId) return;
    
    const hasCompleted = events.some(
      (e) => e.event_type === 'thinking_complete' || e.event_type === 'error'
    );

    if (hasCompleted) {
      const timer = setTimeout(() => {
        router.push(`/tasks/${taskId}`);
        router.refresh();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [events, taskId, router]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Back Link */}
      <Link
        href="/tasks"
        className="inline-flex items-center gap-1 text-sm transition-colors hover:text-white"
        style={{ color: 'var(--foreground-muted)' }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to tasks
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">New Task</h1>
        <p
          className="text-sm mt-1"
          style={{ color: 'var(--foreground-muted)' }}
        >
          Describe what you need to finish. The AI agent will create a sprint plan.
        </p>
      </div>

      {/* Main Form or Live Log */}
      {taskId ? (
        <div className="space-y-4">
          <div className="glass p-5 flex items-center gap-3 border-indigo-500/20 bg-indigo-500/5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
            <span className="text-sm text-indigo-200 font-medium">
              Task created! CrunchAI agent is generating your plan...
            </span>
          </div>
          <AgentThinkingLog events={events} />
        </div>
      ) : (
        <div className="glass p-6">
          <NaturalLanguageInput onSubmit={handleSubmit} loading={loading} />

          {error && (
            <div
              className="mt-4 p-3 rounded-lg text-sm border"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--danger-light)',
                borderColor: 'rgba(239, 68, 68, 0.2)',
              }}
            >
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
