'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Calendar,
  ListChecks,
} from 'lucide-react';
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
  task,
  subtasks,
  sessions,
  agentEvents,
}: TaskDetailClientProps) {
  const completedSubtasks = subtasks.filter(
    (s) => s.status === 'completed'
  ).length;
  const progress =
    subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {}
      <Link
        href="/tasks"
        className="inline-flex items-center gap-1 text-sm transition-colors"
        style={{ color: 'var(--foreground-muted)' }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to tasks
      </Link>

      {}
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
            <span
              className={`badge badge-${task.priority}`}
            >
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

        {}
        {task.ai_risk_level !== 'low' && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
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

      {}
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

      <div className="grid md:grid-cols-3 gap-6">
        {}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ListChecks className="w-5 h-5" style={{ color: 'var(--primary-light)' }} />
            Subtasks
          </h2>

          {subtasks.length === 0 ? (
            <div className="glass p-6 text-center">
              <p style={{ color: 'var(--foreground-muted)' }} className="text-sm">
                No subtasks yet. The AI agent will generate these when planning is triggered.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {subtasks.map((subtask, i) => (
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

          {}
          {sessions.length > 0 && (
            <>
              <h2 className="text-lg font-semibold flex items-center gap-2 mt-8">
                <Calendar className="w-5 h-5" style={{ color: 'var(--accent-light)' }} />
                Sprint Schedule
              </h2>
              <div className="space-y-2">
                {sessions.map((session, i) => (
                  <div
                    key={session.id}
                    className="glass p-4 flex items-center justify-between animate-fade-in"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: statusColors[session.status],
                        }}
                      />
                      <div>
                        <p className="text-sm font-medium">
                          {format(
                            new Date(session.planned_start),
                            'EEE, MMM d'
                          )}
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
                    <span
                      className="badge badge-status text-xs"
                    >
                      {session.status}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {}
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5" style={{ color: 'var(--primary-light)' }} />
            Agent Log
          </h2>

          {agentEvents.length === 0 ? (
            <div className="glass p-4">
              <p
                className="text-sm"
                style={{ color: 'var(--foreground-muted)' }}
              >
                Agent events will appear here once planning is triggered.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {agentEvents.map((event, i) => (
                <div
                  key={event.id}
                  className="glass p-3 text-xs font-mono animate-slide-in"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: 'var(--primary-light)' }}
                    />
                    <span style={{ color: 'var(--accent-light)' }}>
                      {event.tool_called || event.event_type}
                    </span>
                  </div>
                  <span style={{ color: 'var(--foreground-subtle)' }}>
                    {format(new Date(event.created_at), 'h:mm:ss a')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
