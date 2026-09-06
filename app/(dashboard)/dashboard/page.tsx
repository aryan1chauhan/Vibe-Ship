import { Metadata } from "next";
import Link from "next/link";
import { RiskBanner } from "@/components/dashboard/risk-banner";
import { DailyBrief } from "@/components/dashboard/daily-brief";
import { UpcomingSessions } from "@/components/dashboard/upcoming-sessions";
import { TaskProgressRing } from "@/components/dashboard/task-progress-ring";
import {
  Cpu,
  Target,
  Terminal,
  Layers,
  ArrowRight,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-fade-in" data-testid="dashboard-page-container">
      {/* Top Critical Risk Alert Banner */}
      <RiskBanner />

      {/* Main 2-Column Responsive Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column (Main Focus & Agent Insights) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6 lg:space-y-8">
          {/* AI Daily Briefing from Gemini */}
          <DailyBrief />

          {/* Today's Scheduled Work Sessions */}
          <UpcomingSessions />
        </div>

        {/* Right Column (Metrics, Progress & Agent Status) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:space-y-8">
          {/* Circular SVG Progress Ring */}
          <TaskProgressRing />

          {/* Autonomous Engine Telemetry Card */}
          <div className="glass-card glass-card-hover rounded-3xl p-6 border border-border/40 relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                  <Cpu className="h-4 w-4 animate-pulse" />
                </div>
                <span className="font-bold text-xs text-foreground uppercase tracking-wider">
                  Agent Telemetry
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Active
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  Renegotiation Trigger
                </span>
                <span className="font-semibold text-foreground">Auto on Missed</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Model Pipeline
                </span>
                <span className="font-semibold text-foreground">Gemini 2.5 Flash</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-cyan-400" />
                  State Synchronization
                </span>
                <span className="font-semibold text-foreground">Supabase Realtime</span>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/agent-log" className="w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between h-9 rounded-xl border-border/60 text-xs hover:bg-white/5 group"
                >
                  <span className="flex items-center gap-2">
                    <Terminal className="h-3.5 w-3.5 text-primary" />
                    Open Thinking Terminal
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/tasks" className="block">
              <div className="p-4 rounded-2xl bg-card/40 border border-border/40 hover:border-primary/40 hover:bg-white/5 transition-all text-center space-y-1.5 group">
                <Layers className="h-5 w-5 text-primary mx-auto group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-foreground">Manage Tasks</div>
                <div className="text-[10px] text-muted-foreground">All milestones</div>
              </div>
            </Link>

            <Link href="/focus" className="block">
              <div className="p-4 rounded-2xl bg-card/40 border border-border/40 hover:border-cyan-400/40 hover:bg-white/5 transition-all text-center space-y-1.5 group">
                <Target className="h-5 w-5 text-cyan-400 mx-auto group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-foreground">Focus Mode</div>
                <div className="text-[10px] text-muted-foreground">Pomodoro timer</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
