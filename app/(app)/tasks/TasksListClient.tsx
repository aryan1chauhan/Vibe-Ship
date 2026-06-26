'use client';

import Link from 'next/link';
import { Plus, ListTodo, Filter } from 'lucide-react';
import { TaskCard } from '@/components/tasks/TaskCard';
import type { Task } from '@/types/database';
import { useState } from 'react';

interface TasksListClientProps {
  tasks: any[];
}

type FilterStatus = 'all' | 'active' | 'completed' | 'missed';

export function TasksListClient({ tasks }: TasksListClientProps) {
  const [filter, setFilter] = useState<FilterStatus>('all');

  const activeTasksCount = tasks.filter(
    (t) => t.status === 'planned' || t.status === 'active' || t.status === 'replanned'
  ).length;
  const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;
  const atRiskTasksCount = tasks.filter(
    (t) => (t.ai_risk_level === 'high' || t.ai_risk_level === 'critical') && t.status !== 'completed'
  ).length;

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return true;
    if (filter === 'active')
      return task.status === 'planned' || task.status === 'active' || task.status === 'replanned';
    if (filter === 'completed') return task.status === 'completed';
    if (filter === 'missed') return task.status === 'missed';
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  const filterOptions: { value: FilterStatus; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: tasks.length },
    {
      value: 'active',
      label: 'Active',
      count: activeTasksCount,
    },
    {
      value: 'completed',
      label: 'Completed',
      count: completedTasksCount,
    },
    {
      value: 'missed',
      label: 'Missed',
      count: tasks.filter((t) => t.status === 'missed').length,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--foreground-muted)' }}
          >
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link href="/tasks/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          New Task
        </Link>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass p-4 rounded-xl">
          <div className="text-xs uppercase tracking-wider font-semibold text-zinc-500">Active Tasks</div>
          <div className="text-2xl font-bold text-white mt-1">{activeTasksCount}</div>
        </div>
        <div className="glass p-4 rounded-xl">
          <div className="text-xs uppercase tracking-wider font-semibold text-zinc-500">Completed</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{completedTasksCount}</div>
        </div>
        <div className="glass p-4 rounded-xl">
          <div className="text-xs uppercase tracking-wider font-semibold text-zinc-500">At Risk</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{atRiskTasksCount}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {filterOptions.map(({ value, label, count }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
            style={{
              background:
                filter === value ? 'var(--primary-glow)' : 'transparent',
              color:
                filter === value
                  ? 'var(--primary-light)'
                  : 'var(--foreground-muted)',
              border: `1px solid ${
                filter === value ? 'rgba(124, 58, 237, 0.3)' : 'var(--border)'
              }`,
            }}
          >
            {label}
            <span
              className="ml-1.5 text-xs"
              style={{ opacity: 0.7 }}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Task List */}
      {sortedTasks.length === 0 ? (
        <div className="glass p-12 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--primary-glow)' }}
          >
            <ListTodo
              className="w-8 h-8"
              style={{ color: 'var(--primary-light)' }}
            />
          </div>
          <h3 className="font-semibold mb-2">
            {filter === 'all'
              ? 'No tasks yet'
              : `No ${filter} tasks`}
          </h3>
          <p
            className="text-sm mb-6"
            style={{ color: 'var(--foreground-muted)' }}
          >
            {filter === 'all'
              ? 'Create your first task and let CrunchAI build a sprint plan.'
              : 'Try a different filter.'}
          </p>
          {filter === 'all' && (
            <Link href="/tasks/new" className="btn-primary inline-flex">
              <Plus className="w-4 h-4" />
              Create Task
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
