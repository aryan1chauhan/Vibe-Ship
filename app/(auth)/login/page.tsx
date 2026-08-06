"use client";

import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const handleSignIn = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg">
      <div className="w-full max-w-md mx-auto px-6">
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
            size="lg"
            className="w-full gap-2 text-base font-semibold"
            data-testid="google-sign-in"
          >
            <LogIn className="h-5 w-5" />
            Sign in with Google
          </Button>

          <p className="text-xs text-muted-foreground">
            By signing in, you agree to let CrunchAI manage your task schedules.
          </p>
        </div>
      </div>
    </div>
  );
}
