"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronRight, X, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTaskList } from "@/lib/hooks/use-tasks";
import { formatRiskLabel } from "@/lib/utils/format";

export function RiskBanner() {
  const [isDismissed, setIsDismissed] = useState(false);
  const { data: taskData, isLoading } = useTaskList();

  if (isLoading || isDismissed) return null;

  const atRiskTasks = (taskData?.tasks || []).filter(
    (t) =>
      t.status !== "completed" &&
      (t.status === "at_risk" || (t.risk_score !== null && t.risk_score >= 0.8))
  );

  if (atRiskTasks.length === 0) return null;

  const topRiskTask = atRiskTasks[0];
  const riskPercentage = Math.round((topRiskTask.risk_score || 0.8) * 100);

  return (
    <div
      id="risk-section"
      className="mb-8 p-4 sm:p-5 rounded-2xl bg-linear-to-r from-red-950/40 via-amber-950/30 to-background/50 border border-red-500/30 shadow-lg shadow-red-950/20 relative overflow-hidden animate-fade-in"
      data-testid="dashboard-risk-banner"
    >
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-36 h-36 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
            <ShieldAlert className="h-5 w-5 animate-pulse" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-sm text-foreground">
                Critical Deadline Risk Detected
              </h3>
              <span className="text-[11px] font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">
                {riskPercentage}% Risk Score
              </span>
              {atRiskTasks.length > 1 && (
                <span className="text-[11px] text-muted-foreground">
                  (+{atRiskTasks.length - 1} more)
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Task <strong className="text-foreground">"{topRiskTask.title}"</strong> has tight deadlines or high workload density:{" "}
              <span className="text-red-300">
                {topRiskTask.risk_reason || "Immediate action recommended before milestone failure."}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <Link href={`/tasks/${topRiskTask.id}`}>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-9 rounded-xl border-red-500/40 text-red-300 hover:bg-red-500/10 hover:text-red-200"
            >
              <span>Review Plan</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </Link>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsDismissed(true)}
            className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-xl"
            title="Dismiss Alert"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
