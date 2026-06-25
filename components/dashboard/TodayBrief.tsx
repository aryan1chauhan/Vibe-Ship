'use client';

import { Brain, Sparkles } from 'lucide-react';

interface TodayBriefProps {
  brief?: {
    greeting: string;
    recommendation: string;
    sessionCount: number;
    tasksAtRisk: number;
  } | null;
  loading?: boolean;
}

export function TodayBrief({ brief, loading }: TodayBriefProps) {
  if (loading) {
    return (
      <div className="glass p-6 space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 animate-pulse-glow" style={{ color: 'var(--primary-light)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--foreground-muted)' }}>
            AI is thinking...
          </span>
        </div>
        <div className="shimmer h-4 rounded w-3/4" />
        <div className="shimmer h-4 rounded w-1/2" />
        <div className="shimmer h-4 rounded w-2/3" />
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="glass p-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5" style={{ color: 'var(--primary-light)' }} />
          <h3 className="font-semibold">Today&apos;s Brief</h3>
        </div>
        <p style={{ color: 'var(--foreground-muted)' }} className="text-sm">
          Add your first task and the AI agent will generate your daily brief with
          personalized recommendations.
        </p>
      </div>
    );
  }

  return (
    <div
      className="glass p-6"
      style={{
        borderColor: 'rgba(124, 58, 237, 0.2)',
        background:
          'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5" style={{ color: 'var(--primary-light)' }} />
        <h3 className="font-semibold">Today&apos;s Brief</h3>
      </div>
      <p className="text-sm mb-3">{brief.greeting}</p>
      <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
        {brief.recommendation}
      </p>
      <div
        className="flex items-center gap-4 mt-4 pt-4 border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="text-center">
          <div className="text-lg font-bold gradient-text">
            {brief.sessionCount}
          </div>
          <div
            className="text-xs"
            style={{ color: 'var(--foreground-subtle)' }}
          >
            Sessions today
          </div>
        </div>
        <div className="text-center">
          <div
            className="text-lg font-bold"
            style={{
              color:
                brief.tasksAtRisk > 0
                  ? 'var(--warning-light)'
                  : 'var(--success-light)',
            }}
          >
            {brief.tasksAtRisk}
          </div>
          <div
            className="text-xs"
            style={{ color: 'var(--foreground-subtle)' }}
          >
            At risk
          </div>
        </div>
      </div>
    </div>
  );
}
