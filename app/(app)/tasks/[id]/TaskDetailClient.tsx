'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Calendar,
  ListChecks,
} from 'lucide-react';
import { useTaskQuery } from '@/hooks/useTasks';
import { useRealtime } from '@/hooks/useRealtime';
import { AgentThinkingLog } from '@/components/agent/AgentThinkingLog';
import type { Task, Subtask, SprintSession, AgentEvent } from '@/types/database';

interface TaskDetailClientProps {
  task: Task;
  subtasks: Subtask[];
  sessions: SprintSession[];
  agentEvents: AgentEvent[];
}

const statusColors: Record<string, string> = {
  pending: 'var(--foreground-muted)',
  in_progress: 'var(--accent-light)',
  completed: 'var(--success-light)',
  skipped: 'var(--foreground-subtle)',
  planned: 'var(--foreground-muted)',
  missed: 'var(--danger-light)',
  rescheduled: 'var(--warning-light)',
};

export function TaskDetailClient({
  task: initialTask,
  subtasks: initialSubtasks,
  sessions: initialSessions,
  agentEvents: initialAgentEvents,
}: TaskDetailClientProps) {
  useRealtime(['tasks', 'sprint_sessions', 'agent_events']);
  const { data } = useTaskQuery(initialTask.id);
  const [updatingSessionId, setUpdatingSessionId] = useState<string | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);

  const task = (data as any)?.task ?? initialTask;
  const subtasks = (data as any)?.subtasks ?? initialSubtasks;
  const sessions = (data as any)?.sessions ?? initialSessions;
  const agentEvents = (data as any)?.agentEvents ?? initialAgentEvents;

  const completedSubtasks = subtasks.filter((s: Subtask) => s.status === 'completed').length;
  const progress = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0;

  const handleGeneratePlan = async () => {
    setIsPlanning(true);
    try {
      const res = await fetch('/api/agent/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id }),
      });
      if (!res.ok) {
        throw new Error('Failed to start planning');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPlanning(false);
    }
  };

  const handleUpdateSessionStatus = async (sessionId: string, newStatus: string) => {
    setUpdatingSessionId(sessionId);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        throw new Error('Failed to update session');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingSessionId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <Link
        href="/tasks"
        className="inline-flex items-center gap-1 text-sm transition-colors"
        style={{ color: 'var(--foreground-muted)' }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to tasks
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{task.title}</h1>
          {task.description && (
            <p
              className="text-sm mt-1"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-3">
            <span className={`badge badge-${task.priority}`}>
              {task.priority}
            </span>
            <span
              className="flex items-center gap-1 text-sm"
              style={{ color: 'var(--foreground-muted)' }}
            >
              <Calendar className="w-4 h-4" />
              Due {format(new Date(task.deadline), 'MMM d, yyyy h:mm a')}
            </span>
            {task.estimated_hours && (
              <span
                className="text-sm"
                style={{ color: 'var(--foreground-subtle)' }}
              >
                ~{task.estimated_hours}h estimated
              </span>
            )}
          </div>
        </div>

        {task.ai_risk_level !== 'low' && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm shrink-0"
            style={{
              background:
                task.ai_risk_level === 'critical'
                  ? 'rgba(239, 68, 68, 0.1)'
                  : 'rgba(245, 158, 11, 0.1)',
              color:
                task.ai_risk_level === 'critical'
                  ? 'var(--danger-light)'
                  : 'var(--warning-light)',
              border: `1px solid ${
                task.ai_risk_level === 'critical'
                  ? 'rgba(239, 68, 68, 0.2)'
                  : 'rgba(245, 158, 11, 0.2)'
              }`,
            }}
          >
            <AlertTriangle className="w-4 h-4" />
            {task.ai_risk_level} risk
          </div>
        )}
      </div>

      {subtasks.length > 0 && (
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span style={{ color: 'var(--foreground-muted)' }}>
              {completedSubtasks}/{subtasks.length} subtasks complete
            </span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: 'var(--surface)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: 'var(--gradient-primary)',
              }}
            />
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6 font-sans">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ListChecks className="w-5 h-5" style={{ color: 'var(--primary-light)' }} />
            Subtasks
          </h2>

          {subtasks.length === 0 ? (
            <div className="glass p-6 text-center space-y-4">
              <p style={{ color: 'var(--foreground-muted)' }} className="text-sm">
                No subtasks yet. Click below to run the AI agent and generate your plan.
              </p>
              <button
                onClick={handleGeneratePlan}
                disabled={isPlanning}
                className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-all inline-flex items-center gap-2 cursor-pointer shadow-md"
                style={{
                  background: 'var(--gradient-primary)',
                  opacity: isPlanning ? 0.7 : 1,
                }}
              >
                <Brain className="w-4 h-4" />
                {isPlanning ? 'Generating AI Plan...' : 'Generate AI Plan'}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {subtasks.map((subtask: Subtask, i: number) => (
                <div
                  key={subtask.id}
                  className="glass p-4 flex items-center gap-3 animate-fade-in"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{
                      background:
                        subtask.status === 'completed'
                          ? 'rgba(16, 185, 129, 0.2)'
                          : 'var(--surface)',
                      color: statusColors[subtask.status],
                    }}
                  >
                    {subtask.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      subtask.sequence_order
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium"
                      style={{
                        textDecoration:
                          subtask.status === 'completed'
                            ? 'line-through'
                            : 'none',
                        opacity: subtask.status === 'completed' ? 0.6 : 1,
                      }}
                    >
                      {subtask.title}
                    </p>
                  </div>
                  <span
                    className="text-xs shrink-0"
                    style={{ color: 'var(--foreground-subtle)' }}
                  >
                    {subtask.estimated_minutes}m
                  </span>
                </div>
              ))}
            </div>
          )}

          {sessions.length > 0 && (
            <>
              <h2 className="text-lg font-semibold flex items-center gap-2 mt-8">
                <Calendar className="w-5 h-5" style={{ color: 'var(--accent-light)' }} />
                Sprint Schedule
              </h2>
              <div className="space-y-2">
                {sessions.map((session: SprintSession, i: number) => (
                  <div
                    key={session.id}
                    className="glass p-4 flex items-center justify-between animate-fade-in"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: statusColors[session.status] || 'var(--foreground-muted)',
                        }}
                      />
                      <div>
                        <p className="text-sm font-medium">
                          {format(new Date(session.planned_start), 'EEE, MMM d')}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: 'var(--foreground-subtle)' }}
                        >
                          {format(new Date(session.planned_start), 'h:mm a')} –{' '}
                          {format(new Date(session.planned_end), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {session.status === 'planned' && (
                        <div className="flex items-center gap-1.5 mr-2">
                          <button
                            onClick={() => handleUpdateSessionStatus(session.id, 'completed')}
                            disabled={updatingSessionId !== null}
                            className="p-1 rounded bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 cursor-pointer transition-all"
                            title="Mark Complete"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => handleUpdateSessionStatus(session.id, 'missed')}
                            disabled={updatingSessionId !== null}
                            className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 cursor-pointer transition-all"
                            title="Mark Missed (Trigger Replan)"
                          >
                            ✗
                          </button>
                        </div>
                      )}
                      <span className="badge badge-status text-xs">
                        {session.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Brain className="w-5 h-5" style={{ color: 'var(--primary-light)' }} />
              Agent Log
            </h2>
            <button
              onClick={handleGeneratePlan}
              disabled={isPlanning}
              className="text-xs px-2.5 py-1.5 rounded-md border border-white/10 hover:bg-white/5 transition-all flex items-center gap-1.5 cursor-pointer"
              style={{ color: 'var(--foreground-muted)' }}
              title="Re-run AI Planning"
            >
              <Brain className="w-3.5 h-3.5" />
              {isPlanning ? 'Planning...' : 'Re-plan'}
            </button>
          </div>
          <AgentThinkingLog events={agentEvents} />
        </div>
      </div>
    </div>
  );
}
