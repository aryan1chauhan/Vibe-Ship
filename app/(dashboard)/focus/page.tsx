"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Target,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FocusPage() {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 min default
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let timer: any = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(25 * 60);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8 animate-fade-in text-center">
      {/* Back link */}
      <div className="flex items-center justify-start">
        <Link
          href="/dashboard"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Focus Header Card */}
      <div className="glass-card rounded-3xl p-8 sm:p-12 border border-border/40 relative overflow-hidden space-y-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
            <Target className="h-3.5 w-3.5" />
            <span>Deep Work Focus Session</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            Distraction-Free Sprint
          </h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Zero interruptions. Complete your scheduled work blocks while CrunchAI tracks milestone progress.
          </p>
        </div>

        {/* Large Countdown Display */}
        <div className="relative flex items-center justify-center py-6">
          <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-full border-4 border-cyan-500/20 flex flex-col items-center justify-center relative bg-background/50 shadow-2xl">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin-slow opacity-60 pointer-events-none" />
            <span className="text-5xl sm:text-6xl font-black text-foreground font-mono tracking-tight">
              {formattedTime}
            </span>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
              {isRunning ? "Sprint in Progress" : "Paused"}
            </span>
          </div>
        </div>

        {/* Timer Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            size="lg"
            onClick={() => setIsRunning(!isRunning)}
            className="h-12 px-8 rounded-2xl font-bold bg-cyan-500 hover:bg-cyan-600 text-cyan-950 gap-2 shadow-lg shadow-cyan-500/20"
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>Start Focus</span>
              </>
            )}
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={resetTimer}
            className="h-12 px-5 rounded-2xl border-border/60 hover:bg-white/5 text-muted-foreground"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Auto Renegotiation Banner note */}
        <div className="pt-4 border-t border-border/20 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          <span>If missed, CrunchAI automatically shifts this work session into remaining days.</span>
        </div>
      </div>
    </div>
  );
}
