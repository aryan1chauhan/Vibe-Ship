import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
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
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl glass rounded-2xl p-8 space-y-6 shadow-2xl animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center font-bold text-primary text-xl">
              C
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">CrunchAI</h1>
              <p className="text-xs text-muted-foreground">
                Phase 1 & Phase 2 Active
              </p>
            </div>
          </div>

          <form action={signOut}>
            <Button variant="outline" size="sm" className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </form>
        </div>

        {/* User Info Card */}
        <div className="flex items-center gap-4 bg-muted/40 rounded-xl p-4 border border-border/40">
          <Avatar className="h-14 w-14 border-2 border-primary/20">
            <AvatarImage
              src={user.user_metadata?.avatar_url}
              alt={user.user_metadata?.full_name || "User"}
            />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">
              {user.user_metadata?.full_name || "Authenticated User"}
            </h2>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="h-3.5 w-3.5" /> Verified
          </span>
        </div>

        {/* System Diagnostics / Verification List */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Verification Status
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-background/60 border border-border/30">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Supabase Auth & SSR</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-background/60 border border-border/30">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Next.js Proxy Guard</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-background/60 border border-border/30">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Tailwind v4 Theme</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-background/60 border border-border/30">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>Phase 3: Agent Engine</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          You have successfully verified Phase 1 & Phase 2 setup. Ready for Phase 3!
        </p>
      </div>
    </div>
  );
}
