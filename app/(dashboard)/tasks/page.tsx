"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckSquare,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowLeft,
  Sparkles,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTaskList, useCreateTask } from "@/lib/hooks/use-tasks";
import { formatRelativeDate, formatRiskLabel } from "@/lib/utils/format";

export default function TasksPage() {
  const { data, isLoading, isError } = useTaskList();
  const createTask = useCreateTask();

  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "at_risk" | "completed">("all");

  const tasks = data?.tasks || [];

  const filteredTasks = tasks.filter((t) => {
    if (filter === "active") return t.status === "active" || t.status === "pending";
    if (filter === "at_risk") return t.status === "at_risk" || (t.risk_score && t.risk_score >= 0.8);
    if (filter === "completed") return t.status === "completed";
    return true;
  });

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !deadline) return;

    try {
      await createTask.mutateAsync({
        title,
        description: description || undefined,
        deadline: new Date(deadline).toISOString(),
      });
      setTitle("");
      setDeadline("");
      setDescription("");
      setIsCreating(false);
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" data-testid="tasks-page-container">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/30 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <h2 className="text-2xl font-black text-foreground tracking-tight mt-1 flex items-center gap-2.5">
            <CheckSquare className="h-6 w-6 text-primary" />
            <span>Task Milestones</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your sprint deliverables and track AI planning schedules.
          </p>
        </div>

        <Button
          onClick={() => setIsCreating(!isCreating)}
          className="gap-2 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
        >
          <Plus className="h-4 w-4" />
          <span>{isCreating ? "Cancel" : "Add Task"}</span>
        </Button>
      </div>

      {/* Quick Task Creator Drawer / Card */}
      {isCreating && (
        <form
          onSubmit={handleQuickCreate}
          className="glass-card rounded-3xl p-6 border border-primary/30 shadow-xl space-y-4 animate-scale-in"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Create New Task & Trigger Agent Plan</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Task Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Launch MVP Marketing Campaign"
                className="w-full h-10 px-3.5 rounded-xl bg-background/60 border border-border/50 text-sm text-foreground focus:border-primary outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Deadline Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl bg-background/60 border border-border/50 text-sm text-foreground focus:border-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Scope / Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide technical context for the Gemini planning loop..."
              className="w-full h-10 px-3.5 rounded-xl bg-background/60 border border-border/50 text-sm text-foreground focus:border-primary outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreating(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createTask.isPending}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              {createTask.isPending ? "Creating..." : "Save & Plan"}
            </Button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border/20 pb-3">
        {(["all", "active", "at_risk", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
              filter === f
                ? "bg-primary/20 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            {f === "at_risk" ? "At Risk" : f}
          </button>
        ))}
      </div>

      {/* Tasks List Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="h-40 glass-card rounded-2xl animate-pulse" />
          <div className="h-40 glass-card rounded-2xl animate-pulse" />
          <div className="h-40 glass-card rounded-2xl animate-pulse" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl glass-card border border-dashed border-border/50 space-y-3">
          <Bot className="h-12 w-12 text-muted-foreground/60 mx-auto" />
          <h3 className="text-base font-bold text-foreground">No tasks found</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {filter === "all"
              ? "You haven't created any tasks yet. Add a task to trigger autonomous planning and daily scheduling!"
              : `No tasks matching the "${filter}" filter.`}
          </p>
          <Button
            onClick={() => setIsCreating(true)}
            size="sm"
            variant="outline"
            className="rounded-xl mt-2 text-xs border-primary/30 text-primary hover:bg-primary/10"
          >
            Create Your First Task
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTasks.map((task) => {
            const riskPct = Math.round((task.risk_score || 0) * 100);
            return (
              <div
                key={task.id}
                className="glass-card glass-card-hover rounded-3xl p-5 border border-border/40 flex flex-col justify-between space-y-4 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        task.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : task.status === "at_risk"
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : "bg-primary/10 text-primary border-primary/20"
                      }`}
                    >
                      {task.status.toUpperCase()}
                    </span>

                    {task.risk_score !== null && (
                      <span className="text-[10px] text-muted-foreground">
                        Risk: {riskPct}%
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {task.title}
                  </h3>

                  {task.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {task.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-border/20 flex items-center justify-between text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-primary" />
                    <span>{formatRelativeDate(task.deadline)}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-cyan-400" />
                    <span>
                      {task.completed_effort_hours || 0}h / {task.total_effort_hours || 0}h
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
