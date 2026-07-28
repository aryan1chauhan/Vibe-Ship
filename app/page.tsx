'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Brain,
  Calendar,
  RefreshCw,
  ArrowRight,
  Shield,
  Clock,
  CheckCircle,
  Play,
  Terminal,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';

function CountUp({
  end,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 1200,
}: {
  end: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const [ref, setRef] = useState<HTMLSpanElement | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref]);

  useEffect(() => {
    if (!hasStarted) return;
    let start = 0;
    const steps = duration / 16;
    const increment = end / steps;
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [hasStarted, end, duration]);

  return (
    <span ref={setRef}>
      {prefix}
      {count.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export default function LandingPage() {
  const [terminalText, setTerminalText] = useState('');
  const [terminalStep, setTerminalStep] = useState(0);
  const [hasObserved, setHasObserved] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const targetPrompt = 'Break down biology project due Sunday 5pm';

  useEffect(() => {
    if (terminalRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setHasObserved(true);
            observer.disconnect();
          }
        },
        { threshold: 0.2 }
      );
      observer.observe(terminalRef.current);
      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    if (!hasObserved) return;
    let timer: any;
    if (terminalStep === 0) {
      let currentLength = 0;
      const interval = setInterval(() => {
        if (currentLength < targetPrompt.length) {
          currentLength++;
          setTerminalText(targetPrompt.substring(0, currentLength));
        } else {
          clearInterval(interval);
          timer = setTimeout(() => setTerminalStep(1), 1000);
        }
      }, 40);
      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [terminalStep, hasObserved]);

  useEffect(() => {
    if (!hasObserved) return;
    if (terminalStep > 0 && terminalStep < 6) {
      const timer = setTimeout(() => {
        setTerminalStep((s) => s + 1);
      }, 1500);
      return () => clearTimeout(timer);
    } else if (terminalStep === 6) {
      const timer = setTimeout(() => {
        setTerminalText('');
        setTerminalStep(0);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [terminalStep, hasObserved]);

  return (
    <div className="min-h-screen text-zinc-100 flex flex-col justify-between" style={{ background: 'var(--background)' }}>
      {/* Background decorations */}
      <div className="absolute top-0 inset-x-0 h-150 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(800px circle at 50% -100px, rgba(249, 115, 22, 0.16), transparent 70%)',
          }}
        />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-amber-500/5 blur-[120px] animate-float" />
        <div className="absolute top-1/3 right-1/4 w-140 h-140 rounded-full bg-rose-500/5 blur-[150px] animate-float" style={{ animationDelay: '-3s' }} />
      </div>

      {/* Navigation */}
      <nav
        className="fixed top-0 w-full z-50 border-b"
        style={{
          background: 'rgba(9, 10, 15, 0.85)',
          backdropFilter: 'blur(16px)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl overflow-hidden bg-zinc-900" title="CrunchAI">
              <video
                className="w-full h-full object-contain"
                src="/crunchai-logo.mp4"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                aria-hidden="true"
              />
            </div>
            <span className="font-bold text-lg tracking-tight text-white font-heading">CrunchAI</span>
          </div>
          <Link
            href="/login"
            className="btn-primary text-sm shadow-lg shadow-orange-500/20"
            style={{ padding: '8px 20px' }}
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8 border border-amber-500/30"
            style={{
              background: 'rgba(249, 115, 22, 0.1)',
              color: 'var(--primary-light)',
            }}
          >
            <Brain className="w-4 h-4 animate-pulse text-amber-400" />
            Gemini 2.5 Powered · Autonomous Orchestration
          </div>

          <h1
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.15] font-heading"
          >
            You have a deadline in <span className="text-transparent bg-clip-text bg-linear-to-r from-rose-400 to-amber-400">3 days</span>.
            <br />
            <span className="gradient-text">CrunchAI has a plan.</span>
          </h1>

          <p
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed text-slate-400"
          >
            An autonomous AI productivity agent that breaks down tasks into actionable subtasks, schedules sprint sessions, and <span className="text-emerald-400 font-medium">auto-replans</span> when you fall behind.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="btn-primary text-base px-8 py-4 rounded-xl font-bold shadow-xl shadow-indigo-500/25 flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all bg-white text-zinc-950 hover:bg-zinc-100"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Link>
            <span className="text-sm text-zinc-500">
              No setup required · Free forever
            </span>
          </div>
        </div>
      </section>

      {/* Demo Section (Watch the agent think) */}
      <section className="pb-24 px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 font-heading">
              Watch the agent <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-amber-400 font-extrabold">think in real time</span>
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-sm md:text-base">
              Every tool call, input, and reasoning step is displayed. Full visibility into your sprint plan generation.
            </p>
          </div>

          {/* Animated Terminal Simulator */}
          <div ref={terminalRef} className="glass border-zinc-800 rounded-2xl overflow-hidden shadow-2xl max-w-xl mx-auto">
            {/* Window bar */}
            <div className="bg-zinc-900 px-4 py-3 flex items-center justify-between border-b border-zinc-800/80">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs font-mono text-zinc-500 flex items-center gap-1">
                <Terminal className="w-3 h-3" />
                gemini-agent-loop.sh
              </span>
              <div className="w-12" />
            </div>

            {/* Terminal Screen */}
            <div className="p-5 font-mono text-xs md:text-sm space-y-3 bg-zinc-950/70 min-h-75 flex flex-col justify-start">
              <div className="flex items-center text-zinc-300">
                <span className="text-indigo-400 mr-2">$</span>
                <span>crunchai create --task &quot;{terminalText}&quot;</span>
                <span className="w-1.5 h-4 bg-zinc-400 ml-0.5 animate-typing-cursor" />
              </div>

              {terminalStep >= 1 && (
                <div className="text-cyan-400 animate-fade-in flex items-center gap-2">
                  <Brain className="w-3.5 h-3.5 animate-spin" />
                  <span>[Thinking] Calling Gemini 2.5 Orchestrator...</span>
                </div>
              )}

              {terminalStep >= 2 && (
                <div className="animate-fade-in pl-4 space-y-1 border-l border-zinc-800">
                  <div className="text-indigo-400 flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span>tool_call: break_into_subtasks()</span>
                  </div>
                  <div className="text-zinc-500 pl-4">
                    → Created 4 subtasks: [Research], [Drafting], [Citations], [Review]
                  </div>
                </div>
              )}

              {terminalStep >= 3 && (
                <div className="animate-fade-in pl-4 space-y-1 border-l border-zinc-800">
                  <div className="text-indigo-400 flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span>tool_call: estimate_effort()</span>
                  </div>
                  <div className="text-zinc-500 pl-4">
                    → Estimating 5.5 hours total (330 minutes)
                  </div>
                </div>
              )}

              {terminalStep >= 4 && (
                <div className="animate-fade-in pl-4 space-y-1 border-l border-zinc-800">
                  <div className="text-indigo-400 flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span>tool_call: calculate_schedule()</span>
                  </div>
                  <div className="text-zinc-500 pl-4">
                    → Scheduled 3 sprint sessions (Sat 2pm, Sat 6pm, Sun 10am)
                  </div>
                </div>
              )}

              {terminalStep >= 5 && (
                <div className="animate-fade-in pl-4 space-y-1 border-l border-zinc-800">
                  <div className="text-indigo-400 flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span>tool_call: assess_risk()</span>
                  </div>
                  <div className="text-amber-400 pl-4 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Warning: Tight deadline window detected (MEDIUM risk)</span>
                  </div>
                </div>
              )}

              {terminalStep >= 6 && (
                <div className="text-emerald-400 animate-fade-in flex items-center gap-1.5 mt-2 pt-2 border-t border-zinc-800/80">
                  <CheckCircle className="w-4 h-4" />
                  <span>Sprint plan generated successfully! Synced to DB. (2.1s)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Explainer Flow */}
      <section className="py-20 px-6 relative border-t border-zinc-900 bg-zinc-950/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              How CrunchAI <span className="gradient-text">Works</span>
            </h2>
            <p className="text-zinc-400 text-base md:text-lg">
              Three steps to complete control of your academic and professional deadlines.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connector line for desktop */}
            <div className="hidden md:block absolute top-11 left-[15%] right-[15%] h-px bg-linear-to-r from-orange-500/20 via-amber-500/20 to-rose-500/20 z-0" />

            {[
              {
                step: '1',
                title: 'Describe Your Task',
                description:
                  'Type your goal in natural language (e.g. "Finish history essay by Friday night"). Choose your priority level and general timeline.',
                color: 'var(--primary)',
                glow: 'var(--primary-glow)',
              },
              {
                step: '2',
                title: 'Agent Orchestrates Plan',
                description:
                  'The Gemini agent works through a structured tool-calling loop: it designs subtasks, estimates effort, schedules sessions, and flags potential risks.',
                color: 'var(--accent)',
                glow: 'rgba(6, 182, 212, 0.15)',
              },
              {
                step: '3',
                title: 'Execute & Adapt Live',
                description:
                  'Follow the sprint sessions. If you miss a session, the agent fires an auto-replan event, compressing remaining subtasks without you lifting a finger.',
                color: 'var(--success)',
                glow: 'rgba(16, 185, 129, 0.15)',
              },
            ].map(({ step, title, description, color, glow }) => (
              <div
                key={step}
                className="relative z-10 flex flex-col items-center text-center p-6 rounded-2xl glass hover:border-zinc-800 transition-all duration-300"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-5 border shadow-lg shadow-indigo-500/5"
                  style={{
                    borderColor: 'rgba(255,255,255,0.08)',
                    background: 'var(--background-secondary)',
                    color: 'var(--primary-light)',
                  }}
                >
                  {step}
                </div>
                <h3 className="text-lg font-bold mb-3 text-white">{title}</h3>
                <p
                  className="text-sm leading-relaxed text-zinc-400"
                >
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats and Value Propositions */}
      <section className="py-20 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { component: <CountUp end={6} />, label: 'Agent Tools', icon: Brain },
              { component: <CountUp end={2.5} decimals={1} prefix="< " suffix="s" />, label: 'Plan Setup', icon: Clock },
              { component: <CountUp end={100} suffix="%" />, label: 'Auto-Replan', icon: RefreshCw },
              { component: <span className="animate-fade-in">Zero</span>, label: 'Manual Tracking', icon: Shield },
            ].map(({ component, label, icon: Icon }) => (
              <div key={label} className="text-center group p-4 rounded-xl hover:bg-zinc-900/30 transition-colors">
                <Icon
                  className="w-5 h-5 mx-auto mb-2 text-zinc-500 group-hover:text-cyan-400 transition-colors"
                />
                <div className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-white to-zinc-400">{component}</div>
                <div
                  className="text-xs uppercase tracking-wider font-semibold mt-1.5 text-zinc-500"
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 px-6 border-t border-zinc-900 bg-zinc-950/20 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-indigo-500/5 blur-[100px]" />
        </div>
        <div className="max-w-2xl mx-auto relative z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-white">
            Take control of your schedules today.
          </h2>
          <p className="text-zinc-400 mb-8 max-w-md mx-auto text-sm md:text-base">
            Stop procrastinating and let an agentic planner map out the work so you can focus on executing.
          </p>
          <Link
            href="/login"
            className="btn-primary text-base px-8 py-4 rounded-xl font-bold shadow-xl shadow-indigo-500/25 inline-flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-8 px-6 border-t border-zinc-900 bg-zinc-950"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <video
              className="w-4 h-4 rounded object-contain bg-zinc-900"
              src="/crunchai-logo.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              aria-hidden="true"
            />
            <span className="text-sm font-bold text-white tracking-wider">CrunchAI</span>
          </div>
          <p className="text-xs text-zinc-500">
            Built for BlockseBlock Hackathon 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
