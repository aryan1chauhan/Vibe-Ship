import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { runAgent } from "@/lib/gemini/agent";

/**
 * POST /api/agent/prioritize
 * Ranks all active tasks by urgency and updates priority column.
 * Returns: { ranked: [{ taskId, priority, reason }] }
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all active/pending/at_risk tasks
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "pending", "at_risk"])
      .order("deadline", { ascending: true });

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({
        ranked: [],
        message: "No active tasks to prioritize",
      });
    }

    // Use the first task as the primary context ID
    const primaryTaskId = tasks[0].id;

    const result = await runAgent({
      mode: "prioritize",
      taskId: primaryTaskId,
      userId: user.id,
      taskData: {
        title: tasks[0].title,
        deadline: tasks[0].deadline,
        tasks: tasks.map((t) => ({
          task_id: t.id,
          title: t.title,
          deadline: t.deadline,
          risk_score: t.risk_score,
          completed_effort_hours: t.completed_effort_hours,
          total_effort_hours: t.total_effort_hours ?? undefined,
        })),
      },
    });

    // Extract priority rankings from agent steps
    const prioritizeStep = result.steps.find(
      (s) => s.toolName === "prioritize_tasks"
    );
    const rankings =
      (
        prioritizeStep?.output as {
          ranked?: { task_id: string; priority: number; reason: string }[];
        }
      )?.ranked ?? [];

    // Update priority column on each task using service client (bypasses RLS)
    if (rankings.length > 0) {
      const serviceClient = await createServiceClient();
      await Promise.all(
        rankings.map((r) =>
          serviceClient
            .from("tasks")
            .update({
              priority: r.priority,
              updated_at: new Date().toISOString(),
            })
            .eq("id", r.task_id)
        )
      );
    }

    return NextResponse.json({
      success: result.success,
      summary: result.summary,
      ranked: rankings,
    });
  } catch (error) {
    console.error("POST /api/agent/prioritize error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
