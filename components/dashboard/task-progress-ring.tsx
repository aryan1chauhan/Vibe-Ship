"use client";

import { useTaskList } from "@/lib/hooks/use-tasks";
import { CheckCircle2, Clock, Layers, Sparkles } from "lucide-react";

export function TaskProgressRing() {
  const { data, isLoading } = useTaskList();

  const tasks = data?.tasks || [];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const activeTasks = tasks.filter(
    (t) => t.status === "active" || t.status === "at_risk" || t.status === "pending"
  ).length;

  const totalEffortHours = tasks.reduce(
    (acc, t) => acc + (t.total_effort_hours || 0),
    0
  );
  const completedEffortHours = tasks.reduce(
    (acc, t) => acc + (t.completed_effort_hours || 0),
    0
  );
  const remainingHours = Math.max(0, totalEffortHours - completedEffortHours);

  const percentComplete =
    totalEffortHours > 0
      ? Math.min(100, Math.round((completedEffortHours / totalEffortHours) * 100))
      : totalTasks > 0 && completedTasks === totalTasks
      ? 100
      : 0;

  // SVG parameters
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentComplete / 100) * circumference;

  return (
    <div
      className="glass-card glass-card-hover rounded-3xl p-6 sm:p-7 border border-border/40 relative overflow-hidden flex flex-col justify-between space-y-6"
      data-testid="dashboard-task-progress-ring"
    >
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 pb-4 relative z-10">
        <div>
          <h3 className="font-extrabold text-sm sm:text-base text-foreground tracking-tight">
            Sprint Progress
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Overall workload completion
          </p>
        </div>
        <span className="text-[10px] font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-full border border-primary/20 flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> Live
        </span>
      </div>

      {/* Circular SVG Ring */}
      <div className="flex flex-col items-center justify-center relative z-10 py-2">
        <div className="relative flex items-center justify-center">
          <svg
            width={size}
            height={size}
            className="transform -rotate-90 drop-shadow-md"
          >
            {/* Background Track Circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-white/5"
              fill="transparent"
            />
            {/* Animated Progress Circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#progressGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={isLoading ? circumference : strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient
                id="progressGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>

          {/* Centered Percentage Label */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-black text-foreground tracking-tight">
              {isLoading ? "--" : `${percentComplete}%`}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Complete
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Breakdown Grid */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/20 relative z-10">
        <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-foreground">
              {activeTasks} Active
            </div>
            <div className="text-[10px] text-muted-foreground">
              {completedTasks} completed
            </div>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-foreground">
              {remainingHours}h Left
            </div>
            <div className="text-[10px] text-muted-foreground">
              {completedEffortHours}h of {totalEffortHours}h
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
