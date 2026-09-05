import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runAgent } from "@/lib/gemini/agent";
import { format } from "date-fns";

/**
 * GET /api/agent/brief
 * Generates a personalized daily briefing for the authenticated user.
 * Returns: { brief: string } (markdown)
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = format(new Date(), "yyyy-MM-dd");

    // Fetch today's sessions and at-risk tasks
    const [sessionsResult, tasksResult] = await Promise.all([
      supabase
        .from("sessions")
        .select("*, tasks!inner(title, deadline, user_id)")
        .eq("tasks.user_id", user.id)
        .eq("scheduled_date", today)
        .in("status", ["scheduled"]),
      supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["active", "at_risk", "pending"])
        .order("priority", { ascending: true }),
    ]);

    // Use a sentinel task ID for briefing context (first task or placeholder)
    const primaryTask = tasksResult.data?.[0];
    const taskId = primaryTask?.id ?? "00000000-0000-0000-0000-000000000000";

    const result = await runAgent({
      mode: "brief",
      taskId,
      userId: user.id,
      taskData: {
        title: primaryTask?.title ?? "No active tasks",
        description: primaryTask?.description,
        deadline: primaryTask?.deadline ?? new Date().toISOString(),
        tasks: (tasksResult.data ?? []).map((t) => ({
          task_id: t.id,
          title: t.title,
          deadline: t.deadline,
          risk_score: t.risk_score,
          completed_effort_hours: t.completed_effort_hours,
          total_effort_hours: t.total_effort_hours ?? undefined,
        })),
      },
    });

    return NextResponse.json({
      brief: result.summary,
      todaySessionCount: sessionsResult.data?.length ?? 0,
      activeTaskCount: tasksResult.data?.length ?? 0,
    });
  } catch (error) {
    console.error("GET /api/agent/brief error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
