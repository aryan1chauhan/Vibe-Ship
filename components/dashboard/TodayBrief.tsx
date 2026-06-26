'use client';

import { Sparkles, AlertTriangle, Calendar } from 'lucide-react';

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
      <div className="glass p-6 space-y-3 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <span className="text-sm font-medium" style={{ color: 'var(--foreground-muted)' }}>
            AI is compiling brief...
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
      <div className="glass p-6 border-zinc-800">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-white">Today&apos;s Brief</h3>
        </div>
        <p style={{ color: 'var(--foreground-muted)' }} className="text-sm leading-relaxed">
          Add your first task and our AI agent will compile a customized daily briefing and recommendations.
        </p>
      </div>
    );
  }

  return (
    <div
      className="glass p-6 relative overflow-hidden transition-all duration-300 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5 group"
      style={{
        borderColor: 'rgba(124, 58, 237, 0.25)',
        background:
          'linear-gradient(135deg, rgba(124, 58, 237, 0.06) 0%, rgba(6, 182, 212, 0.06) 100%)',
      }}
    >
      {/* Decorative top line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500" />

      {/* Subtle top-right background glow */}
      <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-indigo-500/10 blur-xl pointer-events-none" />

      <div className="flex items-center gap-2.5 mb-3">
        <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse group-hover:scale-110 transition-transform duration-350" />
        <h3 className="font-semibold text-white tracking-wide">Today&apos;s Brief</h3>
      </div>

      <p className="text-sm text-zinc-100 font-medium mb-3 leading-relaxed">
        {brief.greeting}
      </p>
      
      <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
        {brief.recommendation}
      </p>

      <div
        className="flex items-center gap-6 mt-5 pt-4 border-t"
        style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-none">
              {brief.sessionCount}
            </div>
            <div className="text-[10px] uppercase tracking-wider font-semibold mt-0.5" style={{ color: 'var(--foreground-subtle)' }}>
              Sessions Today
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${brief.tasksAtRisk > 0 ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
            <AlertTriangle className={`w-4 h-4 ${brief.tasksAtRisk > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
          </div>
          <div>
            <div className={`text-sm font-bold leading-none ${brief.tasksAtRisk > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {brief.tasksAtRisk}
            </div>
            <div className="text-[10px] uppercase tracking-wider font-semibold mt-0.5" style={{ color: 'var(--foreground-subtle)' }}>
              At Risk
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
