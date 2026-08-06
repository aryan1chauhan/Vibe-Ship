"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogIn, Loader2, AlertCircle } from "lucide-react";

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

      // Ensure redirect URL uses current origin (e.g., http://localhost:3000/callback)
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
    <div className="glass rounded-2xl p-8 text-center space-y-8 animate-fade-in-up">
      {/* Logo / Brand */}
      <div className="space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
          <span className="text-3xl font-bold text-primary">C</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">CrunchAI</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          AI-powered deadline agent that plans, schedules, and renegotiates
          your work automatically.
        </p>
      </div>

      {/* Error Alert if any */}
      {errorMsg && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-left animate-shake">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Features */}
      <div className="grid grid-cols-2 gap-3 text-left">
        {[
          { emoji: "🧠", label: "AI Planning" },
          { emoji: "🔄", label: "Auto-Renegotiation" },
          { emoji: "⚠️", label: "Risk Detection" },
          { emoji: "🎯", label: "Focus Mode" },
        ].map((feature) => (
          <div
            key={feature.label}
            className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm"
          >
            <span>{feature.emoji}</span>
            <span className="text-muted-foreground">{feature.label}</span>
          </div>
        ))}
      </div>

      {/* Sign In Button */}
      <Button
        onClick={handleSignIn}
        disabled={isLoading}
        size="lg"
        className="w-full gap-2 text-base font-semibold transition-all shadow-lg hover:shadow-primary/20"
        data-testid="google-sign-in"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Connecting to Google...
          </>
        ) : (
          <>
            <LogIn className="h-5 w-5" />
            Sign in with Google
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground">
        By signing in, you agree to let CrunchAI manage your task schedules.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg p-6">
      <div className="w-full max-w-md mx-auto">
        <Suspense fallback={
          <div className="glass rounded-2xl p-8 text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Loading login page...</p>
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
