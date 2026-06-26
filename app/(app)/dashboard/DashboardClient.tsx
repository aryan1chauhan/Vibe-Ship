'use client';

import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, AlertTriangle, Clock, Target, Zap, Check, X, Calendar, Play, ChevronRight } from 'lucide-react';
import { TodayBrief } from '@/components/dashboard/TodayBrief';
import { ProgressRing } from '@/components/dashboard/ProgressRing';
import { TaskCard } from '@/components/tasks/TaskCard';
import { useRealtime } from '@/hooks/useRealtime';
import { format } from 'date-fns';
import type { Task, SprintSession } from '@/types/database';
import { BriefSkeleton } from '@/components/ui/LoadingSkeleton';

interface DashboardClientProps {
  tasks: Task[];
  todaySessions: SprintSession[];
  userName: string;
}

export function DashboardClient({
  tasks: initialTasks,
  todaySessions: initialSessions,
  userName,
}: DashboardClientProps) {
  // Wire realtime sync
  useRealtime();

  // Queries
  const { data: tasks } = useQuery<any[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      return data.tasks;
    },
    initialData: initialTasks,
  });

  const { data: todaySessions } = useQuery<any[]>({
    queryKey: ['sessions'],
    queryFn: async () => {
      const res = await fetch('/api/sessions/today');
      if (!res.ok) throw new Error('Failed to fetch sessions');
      const data = await res.json();
      return data.sessions;
    },
    initialData: initialSessions,
  });

  const { data: briefData, isLoading: isBriefLoading } = useQuery({
    queryKey: ['agent-brief'],
    queryFn: async () => {
      const res = await fetch('/api/agent/brief');
      if (!res.ok) throw new Error('Failed to fetch brief');
      return res.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  // Mutations
  const queryClient = useQueryClient();
  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'completed' | 'missed' | 'in_progress' }) => {
      const res = await fetch(`/api/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        throw new Error('Failed to update session');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['agent-brief'] });
    },
  });

  // Calculations
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const activeTasks = tasks.filter(
    (t) => t.status === 'active' || t.status === 'planned' || t.status === 'replanned'
  );
  const atRiskTasks = tasks
    .filter((t) => (t.ai_risk_level === 'high' || t.ai_risk_level === 'critical') && t.status !== 'completed')
    .sort((a, b) => {
      const riskScore: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      return (riskScore[b.ai_risk_level] || 0) - (riskScore[a.ai_risk_level] || 0);
    });

  const overallProgress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
  const completedSessions = todaySessions.filter((s) => s.status === 'completed').length;
  const firstName = userName.split(' ')[0];

  const formatTimeSlot = (startStr: string, endStr: string) => {
    try {
      const start = new Date(startStr);
      const end = new Date(endStr);
      return `${format(start, 'hh:mm a')} - ${format(end, 'hh:mm a')}`;
    } catch (e) {
      return '';
    }
  };

  const mappedBrief = briefData
    ? {
        greeting: briefData.greeting,
        recommendation: briefData.recommendation,
        sessionCount: todaySessions.length,
        tasksAtRisk: atRiskTasks.length,
      }
    : null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Hey {firstName} <span className="wave">👋</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>
            {tasks.length === 0
              ? "Let's get you organized."
              : `${activeTasks.length} active task${activeTasks.length !== 1 ? 's' : ''} · ${todaySessions.length} session${todaySessions.length !== 1 ? 's' : ''} today`}
          </p>
        </div>
        <Link href="/tasks/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          New Task
        </Link>
      </div>

      {/* Stats Grid */}
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
            color: atRiskTasks.length > 0 ? 'var(--warning-light)' : 'var(--success-light)',
            bg: atRiskTasks.length > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
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
            <div className="text-xs mt-0.5" style={{ color: 'var(--foreground-subtle)' }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Sections */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Side: Brief & Progress */}
        <div className="space-y-6">
          {isBriefLoading ? <BriefSkeleton /> : <TodayBrief brief={mappedBrief} />}
          <div className="glass p-6 flex justify-center">
            <ProgressRing progress={overallProgress} label="Overall Progress" />
          </div>
        </div>

        {/* Right Side: Sessions, Tasks, Risk */}
        <div className="md:col-span-2 space-y-6">
          {/* Today's Sprint Sessions */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" style={{ color: 'var(--accent-light)' }} />
              Today's Sessions
            </h2>
            {todaySessions.length === 0 ? (
              <div className="glass p-5 text-center text-sm" style={{ color: 'var(--foreground-muted)' }}>
                No sessions planned for today.
              </div>
            ) : (
              <div className="space-y-3">
                {todaySessions.map((session) => {
                  const taskTitle = session.tasks?.title || 'Unknown Task';
                  const subtaskTitle = session.subtasks?.title || 'Subtask';
                  return (
                    <div
                      key={session.id}
                      className="glass p-4 flex items-center justify-between gap-4 hover:border-zinc-700 transition-all duration-200"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              session.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : session.status === 'missed'
                                ? 'bg-rose-500/10 text-rose-400'
                                : session.status === 'in_progress'
                                ? 'bg-cyan-500/10 text-cyan-400'
                                : 'bg-indigo-500/10 text-indigo-400'
                            }`}
                          >
                            {session.status.toUpperCase()}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>
                            {formatTimeSlot(session.planned_start, session.planned_end)}
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm truncate text-white">{taskTitle}</h4>
                        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
                          {subtaskTitle}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {session.status === 'planned' && (
                          <button
                            onClick={() =>
                              updateSessionMutation.mutate({ id: session.id, status: 'in_progress' })
                            }
                            disabled={updateSessionMutation.isPending}
                            className="p-1.5 rounded-lg border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                            title="Start Session"
                          >
                            <Play className="w-4 h-4 fill-cyan-400/20" />
                          </button>
                        )}
                        {(session.status === 'planned' || session.status === 'in_progress') && (
                          <>
                            <button
                              onClick={() =>
                                updateSessionMutation.mutate({ id: session.id, status: 'completed' })
                              }
                              disabled={updateSessionMutation.isPending}
                              className="p-1.5 rounded-lg border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                              title="Complete"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                updateSessionMutation.mutate({ id: session.id, status: 'missed' })
                              }
                              disabled={updateSessionMutation.isPending}
                              className="p-1.5 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Mark as Missed"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Tasks */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Active Tasks</h2>
              <Link
                href="/tasks"
                className="text-sm font-medium transition-colors hover:text-white"
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
                  <Target className="w-8 h-8" style={{ color: 'var(--primary-light)' }} />
                </div>
                <h3 className="font-semibold mb-2">No active tasks</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--foreground-muted)' }}>
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
                  <TaskCard key={task.id} task={task} progressStyle="ring" />
                ))}
              </div>
            )}
          </div>

          {/* Tasks at Risk Panel */}
          {atRiskTasks.length > 0 && (
            <div>
              <h2
                className="text-lg font-semibold mb-4 flex items-center gap-2"
                style={{ color: 'var(--danger-light)' }}
              >
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                Tasks at Risk
              </h2>
              <div className="space-y-3">
                {atRiskTasks.map((task) => {
                  const isCritical = task.ai_risk_level === 'critical';
                  const deadline = new Date(task.deadline);
                  return (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className={`block p-5 rounded-2xl border transition-all duration-200 group relative overflow-hidden ${
                        isCritical
                          ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/5'
                          : 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5'
                      }`}
                    >
                      {/* Left border accent */}
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-[4px] ${
                          isCritical ? 'bg-red-500' : 'bg-amber-500'
                        }`}
                      />
                      
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                isCritical
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {task.ai_risk_level} Risk
                            </span>
                            <span className="text-xs text-zinc-500 font-medium">
                              Due {format(deadline, 'MMM dd, yyyy')}
                            </span>
                          </div>
                          
                          <h4 className="font-bold text-sm text-zinc-100 group-hover:text-white transition-colors">
                            {task.title}
                          </h4>
                          
                          {task.ai_risk_reason && (
                            <p
                              className={`text-xs leading-relaxed ${
                                isCritical ? 'text-red-300/90' : 'text-amber-300/90'
                              }`}
                            >
                              {task.ai_risk_reason}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 shrink-0 text-zinc-500 group-hover:text-zinc-300 transition-colors mt-1" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
