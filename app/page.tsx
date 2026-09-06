import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ArrowRight,
  Bot,
  Zap,
  ShieldCheck,
  Target,
  Terminal,
  Calendar,
  Layers,
  Cpu,
  CheckCircle2,
  Clock,
  LogOut,
} from "lucide-react";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const signOut = async () => {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen ambient-bg flex flex-col relative overflow-hidden">
      {/* Ambient background glow orbs */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[600px] right-0 w-[500px] h-[350px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="h-20 border-b border-border/30 bg-card/40 backdrop-blur-xl px-6 sm:px-12 flex items-center justify-between sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-emerald-950/40 border border-primary/40 flex items-center justify-center font-black text-primary text-xl shadow-inner group-hover:scale-105 transition-transform">
            C
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-tight text-foreground text-xl">
              CrunchAI
            </span>
            <span className="text-[10px] font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-full border border-primary/20">
              Hackathon 2026
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button
                  size="sm"
                  className="gap-2 rounded-xl font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 text-xs sm:text-sm"
                  data-testid="landing-dashboard-btn"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <form action={signOut}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-destructive rounded-xl"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>
            </div>
          ) : (
            <Link href="/login">
              <Button
                size="sm"
                className="gap-2 rounded-xl font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 text-xs sm:text-sm"
                data-testid="landing-login-btn"
              >
                <span>Sign In with Google</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 sm:px-12 py-16 sm:py-24 space-y-24 relative z-10">
        <section className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary animate-fade-in">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Autonomous Gemini 2.5 Multi-Turn Function Calling Loop</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-foreground leading-[1.08]">
            Never miss a deadline again.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            CrunchAI breaks tasks into subtasks, estimates effort, schedules daily work blocks, and{" "}
            <strong className="text-foreground">automatically renegotiates your calendar</strong> when sessions are missed.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {user ? (
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="h-13 px-8 rounded-2xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground text-base shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all duration-200 gap-2 group"
                  data-testid="hero-dashboard-btn"
                >
                  <span>Open Executive Dashboard</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button
                  size="lg"
                  className="h-13 px-8 rounded-2xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground text-base shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all duration-200 gap-2 group"
                  data-testid="hero-get-started-btn"
                >
                  <span>Get Started with Google</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            )}

            <Link href="/dashboard">
              <Button
                variant="outline"
                size="lg"
                className="h-13 px-8 rounded-2xl font-semibold border-border/60 hover:bg-white/5 text-base"
              >
                <span>View Live Demo</span>
              </Button>
            </Link>
          </div>

          {/* Feature Highlights Ticker */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Zero-touch renegotiation</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>4-factor mathematical risk model</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Supabase Realtime streaming</span>
            </div>
          </div>
        </section>

        {/* 4 Feature Pillars Grid */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Architected for Real-World Productivity
            </h2>
            <p className="text-sm text-muted-foreground">
              Four interlocking pillars powering continuous deadline protection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1: Planning Loop */}
            <div className="glass-card glass-card-hover rounded-3xl p-6 border border-border/40 space-y-4 relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
                <Bot className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-base text-foreground">
                Autonomous Planning
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Gemini 2.5 Flash function-calling decomposes goals into subtasks, calculates effort hours, and builds day-by-day schedules.
              </p>
            </div>

            {/* Feature 2: Auto Renegotiation */}
            <div className="glass-card glass-card-hover rounded-3xl p-6 border border-border/40 space-y-4 relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-base text-foreground">
                Auto-Renegotiation
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Miss a session? The agent autonomously rebalances unfinished work across remaining days without asking the user to reschedule.
              </p>
            </div>

            {/* Feature 3: Risk Detection */}
            <div className="glass-card glass-card-hover rounded-3xl p-6 border border-border/40 space-y-4 relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-base text-foreground">
                Risk Engine
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Evaluates time pressure, completion rate, missed sessions, and bottleneck density to compute an objective 0.0–1.0 risk score.
              </p>
            </div>

            {/* Feature 4: Focus Mode & Logs */}
            <div className="glass-card glass-card-hover rounded-3xl p-6 border border-border/40 space-y-4 relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-base text-foreground">
                Focus Mode & Terminal
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Distraction-free sprint timer with SVG countdown, alongside a terminal-style log of every internal tool decision.
              </p>
            </div>
          </div>
        </section>

        {/* System Architecture Banner */}
        <section className="glass-card rounded-3xl p-8 sm:p-12 border border-border/40 text-center space-y-6">
          <div className="flex items-center justify-center gap-3">
            <Cpu className="h-6 w-6 text-primary" />
            <h3 className="text-xl sm:text-2xl font-black text-foreground">
              Production Stack Integration
            </h3>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Powered by Next.js 16 App Router, React 19, Google Gemini 2.5 Flash, Supabase PostgreSQL with RLS, TanStack Query v5, and Tailwind CSS v4.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 font-semibold text-foreground">
              Next.js 16
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 font-semibold text-foreground">
              React 19
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 font-semibold text-foreground">
              Google Gemini 2.5
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 font-semibold text-foreground">
              Supabase PostgreSQL
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 font-semibold text-foreground">
              TanStack Query v5
            </span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 bg-card/40 py-8 px-6 sm:px-12 text-center text-xs text-muted-foreground">
        <p>© 2026 CrunchAI. Built for BlockseBlock Hackathon 2026. Powered by Google Cloud & Gemini.</p>
      </footer>
    </div>
  );
}
