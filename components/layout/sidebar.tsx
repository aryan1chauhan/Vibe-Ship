"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Target,
  Terminal,
  LogOut,
  Sparkles,
  Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user?: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  } | null;
  onNavigate?: () => void;
  className?: string;
}

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    testId: "sidebar-nav-dashboard",
  },
  {
    label: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
    testId: "sidebar-nav-tasks",
  },
  {
    label: "Focus Mode",
    href: "/focus",
    icon: Target,
    testId: "sidebar-nav-focus",
  },
  {
    label: "Agent Log",
    href: "/agent-log",
    icon: Terminal,
    testId: "sidebar-nav-agent-log",
  },
];

export function Sidebar({ user, onNavigate, className }: SidebarProps) {
  const pathname = usePathname();

  const userInitials =
    user?.user_metadata?.full_name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  const handleSignOut = async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (err) {
      console.error("Sign out error:", err);
      window.location.href = "/login";
    }
  };

  return (
    <aside
      className={cn(
        "w-64 flex flex-col h-full bg-card/60 backdrop-blur-xl border-r border-border/40 select-none relative overflow-hidden",
        className
      )}
      data-testid="app-sidebar"
    >
      {/* Ambient background glow orb inside sidebar */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

      {/* Brand Header */}
      <div className="p-6 border-b border-border/30 flex items-center justify-between relative z-10">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 group"
          onClick={onNavigate}
        >
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary/30 to-emerald-950/40 border border-primary/40 flex items-center justify-center font-extrabold text-primary text-xl shadow-inner group-hover:scale-105 transition-transform">
            C
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-foreground text-lg">
                CrunchAI
              </span>
              <span className="text-[9px] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded border border-primary/20">
                AI
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">Deadline Agent</p>
          </div>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto relative z-10">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
          Core Workspace
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              data-testid={item.testId}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group",
                isActive
                  ? "bg-primary/15 text-primary font-semibold border border-primary/30 shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition-transform group-hover:scale-110",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </Link>
          );
        })}

        {/* Pro / Agent Status Card in Sidebar */}
        <div className="pt-6 px-1">
          <div className="rounded-2xl p-4 bg-linear-to-br from-primary/10 via-background/40 to-background/20 border border-primary/20 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-xs font-bold text-foreground">
                Renegotiation Engine
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Auto-shifts missed sessions into remaining work slots.
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Agent Online</span>
            </div>
          </div>
        </div>
      </nav>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-border/30 bg-card/40 relative z-10">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
          <Avatar className="h-9 w-9 border border-primary/30 shrink-0">
            <AvatarImage
              src={user?.user_metadata?.avatar_url}
              alt={user?.user_metadata?.full_name || "User"}
            />
            <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
              {userInitials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">
              {user?.user_metadata?.full_name || "Active User"}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {user?.email || "user@crunchai.local"}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
            title="Sign Out"
            data-testid="sidebar-sign-out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
