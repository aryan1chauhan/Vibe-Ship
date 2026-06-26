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
  task: Task & {
    subtasks?: any[];
  };
  subtaskCount?: number;
  completedSubtaskCount?: number;
  progressStyle?: 'bar' | 'ring';
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

export function TaskCard({
  task,
  subtaskCount,
  completedSubtaskCount,
  progressStyle = 'bar',
}: TaskCardProps) {
  const deadline = new Date(task.deadline);
  const isOverdue = isPast(deadline) && task.status !== 'completed';
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const status = statusConfig[task.status] || statusConfig.planned;
  const StatusIcon = status.icon;

  const totalSubtasks = subtaskCount !== undefined ? subtaskCount : (task.subtasks || []).length;
  const completedSubtasks =
    completedSubtaskCount !== undefined
      ? completedSubtaskCount
      : (task.subtasks || []).filter((s: any) => s.status === 'completed').length;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const getCountdownBadge = () => {
    if (task.status === 'completed') return null;
    const now = new Date();
    const ms = deadline.getTime() - now.getTime();
    if (ms < 0) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
          OVERDUE
        </span>
      );
    }
    
    const totalMinutes = Math.floor(ms / (1000 * 60));
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const minutes = totalMinutes % 60;
    
    let text = '';
    if (days > 0) {
      text = `${days}d ${hours}h left`;
    } else if (hours > 0) {
      text = `${hours}h ${minutes}m left`;
    } else {
      text = `${minutes}m left`;
    }
    
    const isUrgent = days === 0 && hours < 24;
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
        isUrgent
          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
      }`}>
        {text}
      </span>
    );
  };

  return (
    <Link
      href={`/tasks/${task.id}`}
      className="glass glass-hover block p-5 transition-all duration-200 group"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate group-hover:text-white transition-colors text-white">
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
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Priority */}
            <span className={`badge ${priority.class}`}>{priority.label}</span>

            {/* Status */}
            <span
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: status.color }}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {status.label}
            </span>

            {/* Countdown badge */}
            {getCountdownBadge()}

            {/* Deadline Text */}
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

            {/* Est hours */}
            {task.estimated_hours && (
              <span
                className="text-xs"
                style={{ color: 'var(--foreground-subtle)' }}
              >
                ~{task.estimated_hours}h
              </span>
            )}
          </div>
        </div>

        {/* Right element: progress ring OR hover chevron */}
        {totalSubtasks > 0 && progressStyle === 'ring' ? (
          <div className="shrink-0 flex items-center justify-center relative w-11 h-11">
            <svg width="44" height="44" className="-rotate-90">
              <circle
                cx="22"
                cy="22"
                r="18"
                fill="none"
                stroke="var(--surface)"
                strokeWidth="3"
              />
              <circle
                cx="22"
                cy="22"
                r="18"
                fill="none"
                stroke="url(#progressGradientCard)"
                strokeWidth="3"
                strokeDasharray={2 * Math.PI * 18}
                strokeDashoffset={2 * Math.PI * 18 * (1 - progress / 100)}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
              <defs>
                <linearGradient
                  id="progressGradientCard"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="var(--accent)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        ) : (
          <ChevronRight
            className="w-5 h-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: 'var(--foreground-subtle)' }}
          />
        )}
      </div>

      {/* AI Risk Level Warning */}
      {task.ai_risk_level !== 'low' && task.status !== 'completed' && (
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

      {/* Subtask Progress bar */}
      {totalSubtasks > 0 && progressStyle !== 'ring' && (
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
