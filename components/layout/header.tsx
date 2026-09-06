"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  Bell,
  Plus,
  ShieldAlert,
  Sparkles,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTaskList } from "@/lib/hooks/use-tasks";

interface HeaderProps {
  onOpenMobileMenu?: () => void;
  onOpenNewTask?: () => void;
}

export function Header({ onOpenMobileMenu, onOpenNewTask }: HeaderProps) {
  const pathname = usePathname();
  const { data: taskData } = useTaskList();

  // Compute at-risk count (excluding already completed tasks)
  const atRiskCount = (taskData?.tasks || []).filter(
    (t) =>
      t.status !== "completed" &&
      (t.status === "at_risk" || (t.risk_score !== null && t.risk_score >= 0.8))
  ).length;

  const getPageTitle = () => {
    if (pathname.startsWith("/tasks")) return "Task Management";
    if (pathname.startsWith("/focus")) return "Focus Mode";
    if (pathname.startsWith("/agent-log")) return "Agent Thinking Log";
    return "Executive Dashboard";
  };

  const getPageSubtitle = () => {
    if (pathname.startsWith("/tasks")) return "Active milestones & scheduled timelines";
    if (pathname.startsWith("/focus")) return "Distraction-free sprint timer";
    if (pathname.startsWith("/agent-log")) return "Real-time Gemini function-calling terminal";
    return "Autonomous planning, risk detection & daily briefing";
  };

  return (
    <header className="h-20 border-b border-border/40 bg-card/40 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Menu & Page Title */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-muted-foreground hover:text-foreground h-10 w-10 rounded-xl"
          onClick={onOpenMobileMenu}
          aria-label="Open Navigation Menu"
          data-testid="header-mobile-menu-button"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground">
              {getPageTitle()}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
              <Sparkles className="h-3 w-3" /> Live
            </span>
          </div>
          <p className="hidden sm:block text-xs text-muted-foreground">
            {getPageSubtitle()}
          </p>
        </div>
      </div>

      {/* Right: Quick Actions & Notifications */}
      <div className="flex items-center gap-3">
        {/* Risk Alerts Indicator */}
        <Link
          href="/dashboard#risk-section"
          className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          title={
            atRiskCount > 0
              ? `${atRiskCount} task(s) at critical deadline risk`
              : "All tasks on track"
          }
          data-testid="header-notifications-button"
        >
          {atRiskCount > 0 ? (
            <ShieldAlert className="h-5 w-5 text-amber-400 animate-pulse" />
          ) : (
            <Bell className="h-5 w-5" />
          )}

          {atRiskCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-background animate-ping" />
          )}
        </Link>

        {/* New Task CTA */}
        {onOpenNewTask ? (
          <Button
            onClick={onOpenNewTask}
            size="sm"
            className="gap-2 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200"
            data-testid="header-new-task-button"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Task</span>
          </Button>
        ) : (
          <Link href="/tasks">
            <Button
              size="sm"
              className="gap-2 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200"
              data-testid="header-new-task-button"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Task</span>
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
