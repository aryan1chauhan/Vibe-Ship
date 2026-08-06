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
    <div className="glass-card glass-card-hover rounded-3xl p-8 sm:p-10 text-center space-y-8 animate-fade-in-up border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Decorative ambient background glow inside card */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="space-y-3 relative z-10">
        <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-emerald-900/40 border border-primary/30 mb-2 shadow-inner group">
          <span className="text-4xl font-extrabold text-primary tracking-tight transition-transform duration-300 group-hover:scale-110">
            C
          </span>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-ping opacity-75" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Autonomous Deadline Agent
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
          CrunchAI
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
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

      {/* Feature Grid with Micro-Interactions */}
      <div className="grid grid-cols-2 gap-3 text-left relative z-10">
        {[
          { icon: Sparkles, label: "AI Planning", desc: "Multi-turn task decomposition" },
          { icon: Clock, label: "Auto-Renegotiate", desc: "Dynamic schedule rebalancing" },
          { icon: ShieldCheck, label: "Risk Radar", desc: "Predictive deadline scores" },
          { icon: Target, label: "Focus Mode", desc: "Deep work timer & tracking" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex flex-col gap-1.5 rounded-2xl bg-muted/30 border border-border/40 p-3.5 hover:bg-muted/60 hover:border-primary/30 transition-all duration-200 group cursor-default"
          >
            <div className="flex items-center gap-2 text-primary font-medium text-xs">
              <item.icon className="h-4 w-4 transition-transform group-hover:scale-110" />
              <span>{item.label}</span>
            </div>
            <span className="text-[11px] text-muted-foreground line-clamp-1">
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
          className="w-full h-13 gap-3 text-base font-bold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 active:scale-[0.98] shadow-lg shadow-primary/25 cursor-pointer"
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

        <p className="text-[11px] text-muted-foreground/80 leading-normal">
          Protected by Supabase Auth & RLS. Your credentials remain 100% private.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center ambient-bg p-6">
      <div className="w-full max-w-md mx-auto">
        <Suspense
          fallback={
            <div className="glass-card rounded-3xl p-8 text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">Loading login portal...</p>
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
