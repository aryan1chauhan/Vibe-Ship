"use client";

import Link from "next/link";
import {
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTodaySessions } from "@/lib/hooks/use-tasks";
import { cn } from "@/lib/utils";

export function UpcomingSessions() {
  const { data, isLoading, isError } = useTodaySessions();

  const sessions = data?.sessions || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </span>
        );
      case "missed":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
            <AlertCircle className="h-3 w-3" /> Missed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
            <Clock className="h-3 w-3" /> Scheduled
          </span>
        );
    }
  };

  return (
    <div
      className="glass-card glass-card-hover rounded-3xl p-6 sm:p-7 border border-border/40 relative overflow-hidden space-y-5"
      data-testid="dashboard-upcoming-sessions"
    >
      {/* Ambient background blur */}
      <div className="absolute bottom-0 right-0 -mr-16 -mb-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-border/30 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-cyan-500/30 to-blue-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-foreground tracking-tight">
              Today's Focus Schedule
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Work blocks planned by the AI agent
            </p>
          </div>
        </div>

        <Link href="/tasks">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            <span>View All</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {/* Sessions Content List */}
      <div className="space-y-3 relative z-10">
        {isLoading ? (
          <div className="space-y-3 py-2 animate-pulse" data-testid="upcoming-sessions-loading">
            <div className="h-16 bg-white/5 rounded-2xl w-full" />
            <div className="h-16 bg-white/5 rounded-2xl w-full" />
          </div>
        ) : isError ? (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-xs text-destructive">
            Failed to load today's sessions schedule.
          </div>
        ) : sessions.length === 0 ? (
          <div
            className="text-center py-10 px-4 rounded-2xl bg-white/5 border border-dashed border-border/50 space-y-3"
            data-testid="upcoming-sessions-empty"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">
                No sessions scheduled today 🎉
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                You have no pending work blocks for today. Add a new milestone or review your overall sprint plan.
              </p>
            </div>
            <Link href="/tasks">
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl mt-2 text-xs border-primary/30 text-primary hover:bg-primary/10"
              >
                Plan a New Task
              </Button>
            </Link>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className="p-4 rounded-2xl bg-background/50 border border-border/40 hover:border-primary/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              data-testid={`session-item-${session.id}`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground shrink-0 group-hover:text-primary group-hover:border-primary/30 transition-colors">
                  <Clock className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-foreground truncate">
                      {session.subtask?.title || "Work Session"}
                    </span>
                    {getStatusBadge(session.status)}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {session.task?.title ? `Task: ${session.task.title}` : "Scheduled Sprint"} • {session.duration_minutes} min sprint
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                {session.status === "scheduled" ? (
                  <Link href={`/focus?sessionId=${session.id}`}>
                    <Button
                      size="sm"
                      className="h-8 gap-1.5 rounded-xl font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20 text-xs"
                      data-testid={`start-focus-button-${session.id}`}
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>Start Focus</span>
                    </Button>
                  </Link>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled
                    className="h-8 rounded-xl text-xs opacity-60"
                  >
                    Done
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
