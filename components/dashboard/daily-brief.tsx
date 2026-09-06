"use client";

import { useState } from "react";
import { Sparkles, RefreshCw, Bot, Terminal, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDailyBrief } from "@/lib/hooks/use-daily-brief";
import { format } from "date-fns";

export function DailyBrief() {
  const { data, isLoading, isError, error, regenerateBrief, isRegenerating } =
    useDailyBrief();
  const [copied, setCopied] = useState(false);

  const todayStr = format(new Date(), "EEEE, MMMM d, yyyy");

  // Simple, robust markdown line formatter
  const renderFormattedLine = (line: string, index: number) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return <div key={index} className="h-2" />;
    }

    if (trimmed.startsWith("### ")) {
      return (
        <h4 key={index} className="text-sm font-bold text-foreground mt-3 mb-1">
          {trimmed.replace(/^###\s+/, "")}
        </h4>
      );
    }

    if (trimmed.startsWith("## ")) {
      return (
        <h3 key={index} className="text-base font-extrabold text-foreground mt-4 mb-2">
          {trimmed.replace(/^##\s+/, "")}
        </h3>
      );
    }

    if (trimmed.startsWith("# ")) {
      return (
        <h2 key={index} className="text-lg font-black text-foreground mt-4 mb-2">
          {trimmed.replace(/^#\s+/, "")}
        </h2>
      );
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const content = trimmed.replace(/^[-*]\s+/, "");
      return (
        <li key={index} className="text-xs text-muted-foreground ml-4 list-disc my-1 leading-relaxed">
          <span dangerouslySetInnerHTML={{ __html: formatBoldAndCode(content) }} />
        </li>
      );
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const content = trimmed.replace(/^\d+\.\s+/, "");
      return (
        <li key={index} className="text-xs text-muted-foreground ml-4 list-decimal my-1 leading-relaxed">
          <span dangerouslySetInnerHTML={{ __html: formatBoldAndCode(content) }} />
        </li>
      );
    }

    return (
      <p
        key={index}
        className="text-xs text-muted-foreground leading-relaxed my-1.5"
        dangerouslySetInnerHTML={{ __html: formatBoldAndCode(trimmed) }}
      />
    );
  };

  const formatBoldAndCode = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-white/10 text-primary font-mono text-[11px]">$1</code>');
  };

  return (
    <div
      className="glass-card glass-card-hover rounded-3xl p-6 sm:p-7 relative overflow-hidden border border-border/40 space-y-5"
      data-testid="dashboard-daily-brief"
    >
      {/* Ambient background blur */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-border/30 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/30 to-emerald-950/40 border border-primary/30 flex items-center justify-center text-primary shadow-inner">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-foreground tracking-tight">
                AI Daily Briefing
              </h3>
              <span className="text-[10px] font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                Gemini 2.5
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
              <Calendar className="h-3 w-3" />
              <span>{todayStr}</span>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => regenerateBrief()}
          disabled={isLoading || isRegenerating}
          className="gap-2 h-9 rounded-xl border-border/60 hover:bg-white/5 text-xs"
          data-testid="daily-brief-regenerate-button"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isRegenerating ? "animate-spin text-primary" : ""}`}
          />
          <span className="hidden sm:inline">
            {isRegenerating ? "Analyzing..." : "Regenerate"}
          </span>
        </Button>
      </div>

      {/* Brief Content Body */}
      <div className="relative z-10">
        {isLoading || isRegenerating ? (
          <div className="space-y-3 py-2 animate-pulse" data-testid="daily-brief-loading">
            <div className="h-4 bg-white/10 rounded-lg w-3/4" />
            <div className="h-3 bg-white/5 rounded-lg w-full" />
            <div className="h-3 bg-white/5 rounded-lg w-5/6" />
            <div className="h-3 bg-white/5 rounded-lg w-2/3" />
            <div className="pt-2 flex gap-2">
              <div className="h-7 bg-white/10 rounded-lg w-24" />
              <div className="h-7 bg-white/10 rounded-lg w-28" />
            </div>
          </div>
        ) : isError ? (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
            <span>Unable to generate daily briefing: {error?.message || "Unknown error"}</span>
          </div>
        ) : data?.brief ? (
          <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-1">
            {data.brief.split("\n").map((line, idx) => renderFormattedLine(line, idx))}
          </div>
        ) : (
          <div className="text-center py-6 space-y-2">
            <Bot className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
            <p className="text-xs text-muted-foreground">
              No active tasks found for today. Add your first milestone to generate a personalized briefing!
            </p>
          </div>
        )}
      </div>

      {/* Footer Meta Badge */}
      <div className="pt-3 border-t border-border/20 flex items-center justify-between text-[11px] text-muted-foreground relative z-10">
        <div className="flex items-center gap-1.5">
          <Terminal className="h-3 w-3 text-primary" />
          <span>Real-time agent synthesis</span>
        </div>
        <span className="text-[10px] text-muted-foreground/80">
          Cached for 30m
        </span>
      </div>
    </div>
  );
}
