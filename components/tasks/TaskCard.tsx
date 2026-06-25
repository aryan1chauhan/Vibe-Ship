'use client';

import Link from 'next/link';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import type { Task } from '@/types/database';

interface TaskCardProps {
  task: Task;
}

const priorityConfig = {
  critical: { class: 'badge-critical', label: 'Critical' },
  high: { class: 'badge-high', label: 'High' },
  medium: { class: 'badge-medium', label: 'Medium' },
  low: { class: 'badge-low', label: 'Low' },
};

const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  planned: { icon: Calendar, color: 'var(--foreground-muted)', label: 'Planned' },
  active: { icon: Clock, color: 'var(--accent-light)', label: 'In Progress' },
  completed: { icon: CheckCircle2, color: 'var(--success-light)', label: 'Completed' },
  missed: { icon: AlertTriangle, color: 'var(--danger-light)', label: 'Missed' },
  replanned: { icon: Clock, color: 'var(--warning-light)', label: 'Replanned' },
};

export function TaskCard({ task }: TaskCardProps) {
  const deadline = new Date(task.deadline);
  const isOverdue = isPast(deadline) && task.status !== 'completed';
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const status = statusConfig[task.status] || statusConfig.planned;
  const StatusIcon = status.icon;

  const completedSubtasks = 0; 
  const totalSubtasks = 0;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return (
    <Link
      href={`/tasks/${task.id}`}
      className="glass glass-hover block p-5 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate group-hover:text-white transition-colors">
            {task.title}
          </h3>
          {task.description && (
            <p
              className="text-sm mt-1 truncate"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {task.description}
            </p>
          )}
        </div>
        <ChevronRight
          className="w-5 h-5 shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: 'var(--foreground-subtle)' }}
        />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {}
        <span className={`badge ${priority.class}`}>{priority.label}</span>

        {}
        <span
          className="flex items-center gap-1 text-xs font-medium"
          style={{ color: status.color }}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          {status.label}
        </span>

        {}
        <span
          className="flex items-center gap-1 text-xs"
          style={{
            color: isOverdue ? 'var(--danger-light)' : 'var(--foreground-subtle)',
          }}
        >
          <Clock className="w-3.5 h-3.5" />
          {isOverdue
            ? `Overdue by ${formatDistanceToNow(deadline)}`
            : `Due ${formatDistanceToNow(deadline, { addSuffix: true })}`}
        </span>

        {}
        {task.estimated_hours && (
          <span
            className="text-xs"
            style={{ color: 'var(--foreground-subtle)' }}
          >
            ~{task.estimated_hours}h
          </span>
        )}
      </div>

      {}
      {task.ai_risk_level !== 'low' && (
        <div
          className="mt-3 flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg"
          style={{
            background:
              task.ai_risk_level === 'critical'
                ? 'rgba(239, 68, 68, 0.1)'
                : 'rgba(245, 158, 11, 0.1)',
            color:
              task.ai_risk_level === 'critical'
                ? 'var(--danger-light)'
                : 'var(--warning-light)',
          }}
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{task.ai_risk_reason || `${task.ai_risk_level} risk`}</span>
        </div>
      )}

      {}
      {totalSubtasks > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: 'var(--foreground-subtle)' }}>
              {completedSubtasks}/{totalSubtasks} subtasks
            </span>
            <span style={{ color: 'var(--foreground-subtle)' }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
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
    </Link>
  );
}
