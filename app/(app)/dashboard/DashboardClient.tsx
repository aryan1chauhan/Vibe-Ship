'use client';

import Link from 'next/link';
import { Plus, AlertTriangle, Clock, Target, Zap } from 'lucide-react';
import { TodayBrief } from '@/components/dashboard/TodayBrief';
import { ProgressRing } from '@/components/dashboard/ProgressRing';
import { TaskCard } from '@/components/tasks/TaskCard';
import type { Task, SprintSession } from '@/types/database';

interface DashboardClientProps {
  tasks: Task[];
  todaySessions: SprintSession[];
  userName: string;
}

export function DashboardClient({
  tasks,
  todaySessions,
  userName,
}: DashboardClientProps) {
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const activeTasks = tasks.filter(
    (t) => t.status === 'active' || t.status === 'planned'
  );
  const atRiskTasks = tasks.filter(
    (t) => t.ai_risk_level === 'high' || t.ai_risk_level === 'critical'
  );
  const overallProgress =
    tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  const completedSessions = todaySessions.filter(
    (s) => s.status === 'completed'
  ).length;

  const firstName = userName.split(' ')[0];

  return (
    <div className="space-y-8 animate-fade-in">
      {}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Hey {firstName} <span className="wave">👋</span>
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--foreground-muted)' }}
          >
            {tasks.length === 0
              ? "Let's get you organized."
              : `${activeTasks.length} active task${activeTasks.length !== 1 ? 's' : ''} · ${todaySessions.length} session${todaySessions.length !== 1 ? 's' : ''} today`}
          </p>
        </div>
        <Link
          href="/tasks/new"
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          New Task
        </Link>
      </div>

      {}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Active Tasks',
            value: activeTasks.length,
            icon: Target,
            color: 'var(--primary-light)',
            bg: 'var(--primary-glow)',
          },
          {
            label: 'Today Sessions',
            value: `${completedSessions}/${todaySessions.length}`,
            icon: Clock,
            color: 'var(--accent-light)',
            bg: 'rgba(6, 182, 212, 0.15)',
          },
          {
            label: 'At Risk',
            value: atRiskTasks.length,
            icon: AlertTriangle,
            color:
              atRiskTasks.length > 0
                ? 'var(--warning-light)'
                : 'var(--success-light)',
            bg:
              atRiskTasks.length > 0
                ? 'rgba(245, 158, 11, 0.15)'
                : 'rgba(16, 185, 129, 0.15)',
          },
          {
            label: 'Completed',
            value: completedTasks,
            icon: Zap,
            color: 'var(--success-light)',
            bg: 'rgba(16, 185, 129, 0.15)',
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="glass p-4">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: bg }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
            </div>
            <div className="text-2xl font-bold">{value}</div>
            <div
              className="text-xs mt-0.5"
              style={{ color: 'var(--foreground-subtle)' }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      {}
      <div className="grid md:grid-cols-3 gap-6">
        {}
        <div className="space-y-6">
          <TodayBrief brief={null} />
          <div className="glass p-6 flex justify-center">
            <ProgressRing progress={overallProgress} label="Overall Progress" />
          </div>
        </div>

        {}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Active Tasks</h2>
            <Link
              href="/tasks"
              className="text-sm font-medium transition-colors"
              style={{ color: 'var(--primary-light)' }}
            >
              View all →
            </Link>
          </div>

          {activeTasks.length === 0 ? (
            <div className="glass p-8 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--primary-glow)' }}
              >
                <Target
                  className="w-8 h-8"
                  style={{ color: 'var(--primary-light)' }}
                />
              </div>
              <h3 className="font-semibold mb-2">No active tasks</h3>
              <p
                className="text-sm mb-4"
                style={{ color: 'var(--foreground-muted)' }}
              >
                Add your first task and let the AI agent create a sprint plan.
              </p>
              <Link href="/tasks/new" className="btn-primary inline-flex">
                <Plus className="w-4 h-4" />
                Add Task
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTasks.slice(0, 5).map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}

          {}
          {atRiskTasks.length > 0 && (
            <div className="mt-6">
              <h2
                className="text-lg font-semibold mb-4 flex items-center gap-2"
                style={{ color: 'var(--warning-light)' }}
              >
                <AlertTriangle className="w-5 h-5" />
                At Risk
              </h2>
              <div className="space-y-3">
                {atRiskTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
