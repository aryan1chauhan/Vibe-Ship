import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, CheckCircle2, ShieldCheck, Zap, Layers, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const signOut = async () => {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  };

  const userInitials =
    user.user_metadata?.full_name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() || "U";

  return (
    <div className="min-h-screen ambient-bg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl glass-card glass-card-hover rounded-3xl p-8 sm:p-10 space-y-8 shadow-2xl animate-fade-in-up border border-white/10 relative overflow-hidden">
        {/* Ambient Glow Orbs inside dashboard card */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between border-b border-border/50 pb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/30 to-emerald-950/40 border border-primary/30 flex items-center justify-center font-extrabold text-primary text-2xl shadow-inner">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight">CrunchAI</h1>
                <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                  v0.1.0
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Phase 1 & Phase 2 Verified
              </p>
            </div>
          </div>

          <form action={signOut}>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl border-border/60 hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all duration-200"
              data-testid="sign-out-button"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </form>
        </div>

        {/* User Identity Profile Card */}
        <div className="flex items-center gap-4 bg-muted/30 rounded-2xl p-5 border border-border/40 hover:border-primary/30 transition-all duration-200 relative z-10">
          <div className="relative">
            <Avatar className="h-16 w-16 border-2 border-primary/30 shadow-md">
              <AvatarImage
                src={user.user_metadata?.avatar_url}
                alt={user.user_metadata?.full_name || "User"}
              />
              <AvatarFallback className="bg-primary/20 text-primary font-bold text-xl">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background shadow-sm" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold truncate">
                {user.user_metadata?.full_name || "Authenticated User"}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>

          <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20 shrink-0">
            <CheckCircle2 className="h-3.5 w-3.5" /> Verified
          </span>
        </div>

        {/* Verification Status Matrix */}
        <div className="space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-primary" /> System Verification Status
            </h3>
            <span className="text-[11px] font-medium text-emerald-400">
              2 / 8 Phases Ready
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-background/60 border border-border/40 hover:border-primary/30 transition-colors">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
              <div>
                <div className="font-semibold text-xs">Supabase Auth & SSR</div>
                <div className="text-[11px] text-muted-foreground">Session & Cookie Sync</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-background/60 border border-border/40 hover:border-primary/30 transition-colors">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
              <div>
                <div className="font-semibold text-xs">Next.js Proxy Guard</div>
                <div className="text-[11px] text-muted-foreground">Edge Route Protection</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-background/60 border border-border/40 hover:border-primary/30 transition-colors">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
              <div>
                <div className="font-semibold text-xs">Tailwind v4 Theme</div>
                <div className="text-[11px] text-muted-foreground">Glass & Ambient Tokens</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-background/60 border border-border/40 hover:border-amber-400/30 transition-colors">
              <Zap className="h-5 w-5 text-amber-400 shrink-0 animate-pulse" />
              <div>
                <div className="font-semibold text-xs text-amber-300">Phase 3: Agent Engine</div>
                <div className="text-[11px] text-muted-foreground">Gemini 2.5 Multi-Turn</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-2 text-center relative z-10">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 px-4 py-2 rounded-full border border-border/30">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Phase 1 & 2 UI refinement complete. Ready for Phase 3!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
