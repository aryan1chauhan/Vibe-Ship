"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogIn, Loader2, AlertCircle, Sparkles, Clock, ShieldCheck, Target } from "lucide-react";

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
    } catch (err: any) {
      console.error("Sign-in exception:", err);
      setErrorMsg(err.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-3xl p-8 sm:p-10 space-y-8 animate-fade-in-up border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Decorative subtle ambient background glow */}
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="flex flex-col items-center text-center space-y-3 relative z-10">
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-950/40 border border-emerald-500/30 shadow-inner">
          <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">
            C
          </span>
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full animate-ping opacity-75" />
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-background" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
          <Sparkles className="h-3.5 w-3.5" /> Autonomous Deadline Agent
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          CrunchAI
        </h1>
        <p className="text-zinc-300 text-sm leading-relaxed max-w-sm">
          Never miss a deadline again. AI schedules, balances, and renegotiates your work automatically.
        </p>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-sm text-left animate-shake"
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span className="font-medium leading-snug">{errorMsg}</span>
        </div>
      )}

      {/* Feature Grid without awkward truncation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left relative z-10">
        {[
          { icon: Sparkles, label: "AI Planning", desc: "Multi-turn task decomposition" },
          { icon: Clock, label: "Auto-Renegotiate", desc: "Dynamic schedule rebalancing" },
          { icon: ShieldCheck, label: "Risk Radar", desc: "Predictive deadline risk scores" },
          { icon: Target, label: "Focus Mode", desc: "Deep work timer & tracking" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex flex-col gap-1 rounded-xl bg-zinc-900/60 border border-zinc-800 p-3.5 hover:bg-zinc-900/90 hover:border-emerald-500/30 transition-all duration-200"
          >
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </div>
            <span className="text-[12px] text-zinc-300 font-normal leading-tight">
              {item.desc}
            </span>
          </div>
        ))}
      </div>

      {/* Sign In Button */}
      <div className="space-y-4 relative z-10">
        <Button
          onClick={handleSignIn}
          disabled={isLoading}
          size="lg"
          className="w-full h-12 gap-3 text-base font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all duration-200 active:scale-[0.98] shadow-md shadow-emerald-500/20 cursor-pointer"
          data-testid="google-sign-in"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Connecting to Google...</span>
            </>
          ) : (
            <>
              <LogIn className="h-5 w-5" />
              <span>Sign in with Google</span>
            </>
          )}
        </Button>

        <p className="text-xs text-zinc-400 text-center leading-normal">
          Protected by Supabase Auth & RLS. Your credentials remain 100% private.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center ambient-bg p-6">
      <div className="w-full max-w-lg mx-auto">
        <Suspense
          fallback={
            <div className="glass-card rounded-3xl p-8 text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-400" />
              <p className="text-sm text-zinc-400">Loading login portal...</p>
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
