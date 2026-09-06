"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  AlertCircle,
  Sparkles,
  Clock,
  ShieldCheck,
  Target,
  Lock,
  Cpu,
} from "lucide-react";

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    searchParams.get("error") === "auth_failed"
      ? "Authentication failed. Please try signing in again."
      : searchParams.get("error")
  );

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const redirectUrl = `${window.location.origin}/callback`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        console.error("Supabase OAuth Error:", error);
        setErrorMsg(error.message || "Failed to initiate Google sign in.");
        setIsLoading(false);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      console.error("Sign-in exception:", err);
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMsg(message);
      setIsLoading(false);
    }
  };

  const featureCards = [
    {
      id: "feature-ai-planning",
      icon: Sparkles,
      label: "AI Planning",
      desc: "Multi-turn task decomposition",
    },
    {
      id: "feature-auto-renegotiate",
      icon: Clock,
      label: "Auto-Renegotiate",
      desc: "Dynamic schedule rebalancing",
    },
    {
      id: "feature-risk-radar",
      icon: ShieldCheck,
      label: "Risk Radar",
      desc: "Predictive deadline scoring",
    },
    {
      id: "feature-focus-mode",
      icon: Target,
      label: "Focus Mode",
      desc: "Deep work countdown & tracking",
    },
  ];

  return (
    <div
      className="relative p-px rounded-[28px] bg-linear-to-b from-white/15 via-white/5 to-emerald-500/20 shadow-2xl shadow-black/80 animate-fade-in-up"
      data-testid="login-card-container"
    >
      <div
        className="relative bg-[#0b1019]/90 backdrop-blur-2xl rounded-[27px] p-7 sm:p-9 space-y-7 overflow-hidden"
        data-testid="login-card"
      >
        {/* Subtle decorative atmospheric glowing orbs inside card */}
        <div className="absolute -top-24 -left-24 w-52 h-52 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div
          className="flex flex-col items-center text-center space-y-3 relative z-10"
          data-testid="brand-header"
        >
          {/* Logo Badge with Glowing Radar Ring */}
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-b from-emerald-500/20 to-emerald-950/40 border border-emerald-500/30 shadow-lg shadow-emerald-950/40">
            <span className="text-2xl font-black text-emerald-400 tracking-tight">
              C
            </span>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-75" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0b1019]" />
          </div>

          {/* Autonomous Agent Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-semibold text-emerald-400 tracking-wide uppercase">
            <Sparkles className="h-3 w-3" />
            <span>Autonomous Deadline Agent</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            CrunchAI
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mx-auto">
            Never miss a deadline again. AI schedules, balances, and renegotiates
            your work automatically.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div
            role="alert"
            className="flex items-start gap-3 p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm text-left animate-shake"
            data-testid="error-alert"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="font-medium leading-snug">{errorMsg}</span>
          </div>
        )}

        {/* Feature Highlights Grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left relative z-10"
          data-testid="feature-grid"
        >
          {featureCards.map((item) => (
            <div
              key={item.label}
              data-testid={item.id}
              className="group flex items-start gap-3 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 p-3.5 hover:bg-zinc-850/70 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-950/20 transition-all duration-200"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 group-hover:bg-emerald-500/15 transition-all duration-200">
                <item.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-zinc-200 leading-snug">
                  {item.label}
                </div>
                <div className="text-[11.5px] text-zinc-400 font-normal leading-snug mt-0.5">
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA & Trust Layer */}
        <div className="space-y-3.5 relative z-10" data-testid="auth-cta-group">
          <Button
            onClick={handleSignIn}
            disabled={isLoading}
            size="lg"
            className="w-full h-12 gap-3 text-sm sm:text-base font-semibold rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 transition-all duration-150 active:scale-[0.98] shadow-lg shadow-white/5 cursor-pointer border border-white/20"
            data-testid="google-sign-in-btn"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-zinc-700" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <GoogleIcon className="shrink-0" />
                <span>Sign in with Google</span>
              </>
            )}
          </Button>

          {/* Privacy & Security Footnote */}
          <div
            className="flex items-center justify-center gap-3 pt-1 text-[11px] text-zinc-400"
            data-testid="security-footer"
          >
            <span className="inline-flex items-center gap-1">
              <Lock className="h-3 w-3 text-emerald-400" /> Supabase RLS
            </span>
            <span className="text-zinc-600">•</span>
            <span className="inline-flex items-center gap-1">
              <Cpu className="h-3 w-3 text-emerald-400" /> Gemini 2.5 Flash
            </span>
            <span className="text-zinc-600">•</span>
            <span>100% Private</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen ambient-bg bg-grid-pattern relative flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Centered ambient luminous aura */}
      <div className="absolute w-150 h-150 bg-emerald-500/[0.07] rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-lg mx-auto relative z-10">
        <Suspense
          fallback={
            <div className="glass-card rounded-3xl p-8 text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-400" />
              <p className="text-sm text-zinc-400">Loading CrunchAI portal...</p>
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
