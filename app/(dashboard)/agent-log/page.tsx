"use client";

import Link from "next/link";
import { Terminal, Bot, ArrowLeft, Sparkles, CheckCircle2, Cpu, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AgentLogPage() {
  const sampleSteps = [
    {
      tool: "break_into_subtasks",
      input: { title: "Sprint Deliverables", deadline: "2026-09-12" },
      output: { subtasksCreated: 4, sequence: [1, 2, 3, 4] },
      status: "completed",
      time: "10:14:02 AM",
    },
    {
      tool: "estimate_effort",
      input: { subtasks: 4 },
      output: { totalEffortHours: 16, averagePerSubtask: 4 },
      status: "completed",
      time: "10:14:03 AM",
    },
    {
      tool: "calculate_schedule",
      input: { deadline: "2026-09-12", totalHours: 16 },
      output: { sessionsScheduled: 10, workDays: 5 },
      status: "completed",
      time: "10:14:05 AM",
    },
    {
      tool: "assess_risk",
      input: { deadline: "2026-09-12", sessions: 10 },
      output: { score: 0.22, level: "on_track", bottleneckDays: 0 },
      status: "completed",
      time: "10:14:06 AM",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Back button */}
      <div className="flex items-center justify-between border-b border-border/30 pb-4">
        <div>
          <Link
            href="/dashboard"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <h2 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <Terminal className="h-6 w-6 text-primary" />
            <span>Agent Thinking Log</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Gemini 2.5 Live
          </span>
        </div>
      </div>

      {/* Terminal Window Box */}
      <div className="rounded-3xl border border-border/60 bg-black/80 shadow-2xl overflow-hidden font-mono text-xs">
        {/* Terminal Titlebar */}
        <div className="h-10 px-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="text-[11px] text-muted-foreground ml-2">
              crunchai-agent-v0.1.0 ~ multi-turn-loop
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground font-sans">
            Supabase Realtime Stream
          </span>
        </div>

        {/* Terminal Body */}
        <div className="p-6 space-y-4 max-h-150 overflow-y-auto">
          <div className="text-muted-foreground/80 flex items-center gap-2">
            <span className="text-primary font-bold">&gt;</span>
            <span>Agent initialized. Registered 6 function tools with Gemini 2.5 Flash API.</span>
          </div>

          {sampleSteps.map((step, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-white/3 border border-white/5 space-y-2"
            >
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-primary font-bold">[{idx + 1}]</span>
                  <span className="text-foreground font-bold font-sans">
                    call_tool: <code className="text-cyan-400">{step.tool}()</code>
                  </span>
                </div>
                <span className="text-muted-foreground">{step.time}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px]">
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <div className="text-muted-foreground mb-1 text-[10px] uppercase font-bold">
                    Input Parameters
                  </div>
                  <pre className="text-white/80 overflow-x-auto">
                    {JSON.stringify(step.input, null, 2)}
                  </pre>
                </div>

                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <div className="text-emerald-400 mb-1 text-[10px] uppercase font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Output Payload
                  </div>
                  <pre className="text-emerald-300 overflow-x-auto">
                    {JSON.stringify(step.output, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ))}

          <div className="text-emerald-400 flex items-center gap-2 pt-2">
            <span className="text-primary font-bold">&gt;</span>
            <span>Agent completed execution turn. Task schedule committed to PostgreSQL.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
