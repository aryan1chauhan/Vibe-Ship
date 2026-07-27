'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Target, Clock, Play, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export function FocusClient() {
  const queryClient = useQueryClient();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timeUntilStart, setTimeUntilStart] = useState<number | null>(null);
  const timerRef = useRef<any>(null);

  // Fetch today's sessions
  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const res = await fetch('/api/sessions/today');
      if (!res.ok) throw new Error('Failed to fetch sessions');
      return res.json();
    },
  });

  const sessions = sessionsData?.sessions || [];
  
  // Find current active session or next upcoming session
  const activeSession = sessions.find((s: any) => s.status === 'in_progress');
  const nextSession = activeSession || sessions.find((s: any) => s.status === 'planned');

  // Mutations
  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'in_progress' | 'completed' | 'missed' }) => {
      const res = await fetch(`/api/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update session');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Calculate duration
  const getDurationSeconds = (session: any) => {
    if (!session) return 0;
    const start = new Date(session.planned_start);
    const end = new Date(session.planned_end);
    return Math.round((end.getTime() - start.getTime()) / 1000);
  };

  useEffect(() => {
    if (activeSession) {
      const totalSecs = getDurationSeconds(activeSession);
      const actualStart = new Date(activeSession.actual_start || activeSession.planned_start);
      
      const updateTimer = () => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - actualStart.getTime()) / 1000);
        const remaining = Math.max(0, totalSecs - elapsed);
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
        }
      };

      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
    } else {
      setTimeLeft(null);
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSession]);

  // Live countdown to next upcoming session planned start
  useEffect(() => {
    if (!activeSession && nextSession && nextSession.status === 'planned') {
      const plannedStart = new Date(nextSession.planned_start);
      
      const updateCountdown = () => {
        const now = new Date();
        const diffSecs = Math.max(0, Math.floor((plannedStart.getTime() - now.getTime()) / 1000));
        setTimeUntilStart(diffSecs);
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeUntilStart(null);
    }
  }, [activeSession, nextSession]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Clock className="w-10 h-10 animate-spin text-purple-400 mx-auto" />
          <p className="text-sm text-zinc-400">Loading focus session...</p>
        </div>
      </div>
    );
  }

  if (!nextSession) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="text-center space-y-4 max-w-md p-6">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto bg-zinc-900 border border-zinc-800">
            <Target className="w-10 h-10 text-zinc-600" />
          </div>
          <h2 className="text-2xl font-bold text-white">All Done For Today!</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            You don't have any pending sprint sessions scheduled for today. Great job! Or add a new task to generate a new plan.
          </p>
        </div>
      </div>
    );
  }

  const taskTitle = nextSession.tasks?.title || 'Task Details';
  const subtaskTitle = nextSession.subtasks?.title || 'Subtask Details';
  const durationMinutes = Math.round(getDurationSeconds(nextSession) / 60);

  // Format time display
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Format time until start display
  const formatTimeUntilStart = (secs: number) => {
    if (secs <= 0) return 'Ready to start';
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remainingSecs = secs % 60;
    
    if (hours > 0) {
      return `Starts in ${hours}h ${mins}m ${remainingSecs}s`;
    }
    if (mins > 0) {
      return `Starts in ${mins}m ${remainingSecs}s`;
    }
    return `Starts in ${remainingSecs}s`;
  };

  const totalDuration = getDurationSeconds(nextSession);
  const progressPercent = timeLeft !== null && totalDuration > 0
    ? ((totalDuration - timeLeft) / totalDuration) * 100 
    : 0;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
      {activeSession ? (
        /* Distraction-Free Active Focus Mode Overlay */
        <div className="focus-fullscreen text-center space-y-8 p-8 relative overflow-hidden">
          {/* Subtle decorative glowing line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-cyan-500 via-indigo-500 to-purple-500" />
          
          {/* subtle radial orbs */}
          <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-cyan-500/5 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />

          {/* Exit button */}
          <Link
            href="/dashboard"
            className="absolute top-6 right-6 text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors"
          >
            Exit Focus View
          </Link>

          <div className="space-y-3 relative z-10">
            <span className="text-xs uppercase tracking-widest font-bold text-cyan-400">Focus Mode Active</span>
            <h2 className="text-3xl font-extrabold text-white tracking-wide truncate max-w-xl mx-auto">{taskTitle}</h2>
            <p className="text-sm text-zinc-400 truncate max-w-lg mx-auto">{subtaskTitle}</p>
          </div>

          {/* Large Countdown Timer */}
          <div className="relative w-64 h-64 mx-auto flex items-center justify-center timer-ring z-10">
            {/* Background circle */}
            <svg className="absolute w-full h-full transform -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="110"
                className="stroke-zinc-900"
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="128"
                cy="128"
                r="110"
                className="stroke-cyan-400 transition-all duration-300"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 110}
                strokeDashoffset={2 * Math.PI * 110 * (1 - progressPercent / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="text-6xl font-mono font-bold tracking-tight text-white animate-pulse-glow">
              {timeLeft !== null ? formatTime(timeLeft) : '00:00'}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4 pt-4 relative z-10">
            <button
              onClick={() => updateSessionMutation.mutate({ id: nextSession.id, status: 'completed' })}
              disabled={updateSessionMutation.isPending}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-5 h-5" />
              Complete Sprint
            </button>
            <button
              onClick={() => updateSessionMutation.mutate({ id: nextSession.id, status: 'missed' })}
              disabled={updateSessionMutation.isPending}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl border border-rose-500/25 text-rose-400 font-bold hover:bg-rose-500/10 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
              Mark Missed
            </button>
          </div>
        </div>
      ) : (
        /* Upcoming Session Overview */
        <div className="w-full max-w-xl text-center space-y-6 p-8 rounded-3xl border border-zinc-800 bg-zinc-950/40 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-indigo-500 to-cyan-500" />
          
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto bg-indigo-500/10">
            <Play className="w-8 h-8 text-indigo-400 fill-indigo-400/20" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest font-bold text-indigo-400">Next Scheduled Session</span>
            <h2 className="text-2xl font-bold text-white tracking-wide truncate">{taskTitle}</h2>
            <p className="text-sm text-zinc-400 truncate mt-1">{subtaskTitle}</p>
          </div>

          {/* Countdown badge */}
          {timeUntilStart !== null && (
            <div className="inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 animate-pulse">
              {formatTimeUntilStart(timeUntilStart)}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto text-left py-4">
            <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
              <div className="text-[10px] uppercase font-bold text-zinc-500">Scheduled Time</div>
              <div className="text-xs font-semibold text-zinc-300 mt-1">
                {format(new Date(nextSession.planned_start), 'hh:mm a')}
              </div>
            </div>
            <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
              <div className="text-[10px] uppercase font-bold text-zinc-500">Duration</div>
              <div className="text-xs font-semibold text-zinc-300 mt-1">{durationMinutes} minutes</div>
            </div>
          </div>

          <button
            onClick={() => updateSessionMutation.mutate({ id: nextSession.id, status: 'in_progress' })}
            disabled={updateSessionMutation.isPending}
            className="w-full max-w-xs btn-primary text-base py-3.5 rounded-xl font-bold shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
          >
            Start Focus Session
          </button>
        </div>
      )}
    </div>
  );
}
