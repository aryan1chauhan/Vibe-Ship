import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AgentRenegotiateRequestSchema } from "@/lib/validators/task";
import { runAgent } from "@/lib/gemini/agent";
import { z } from "zod";

/**
 * POST /api/agent/renegotiate
 * Triggers the renegotiation agent after a missed session.
 * Body: { taskId: string, missedSessionId?: string }
 * Returns: { summary, newSessionCount, riskScore }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body is required" },
        { status: 400 }
      );
    }

    const { taskId, missedSessionId } =
      AgentRenegotiateRequestSchema.parse(body);

    // Verify task ownership
    const { data: task } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .single();

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Run the renegotiation agent
    const result = await runAgent({
      mode: "renegotiate",
      taskId,
      userId: user.id,
      taskData: {
        title: task.title,
        description: task.description,
        deadline: task.deadline,
        missedSessionId,
      },
    });

    // Fetch updated session count and risk score
    const [sessionsResult, taskResult] = await Promise.all([
      supabase
        .from("sessions")
        .select("id", { count: "exact" })
        .eq("task_id", taskId)
        .in("status", ["scheduled", "rescheduled"]),
      supabase
        .from("tasks")
        .select("risk_score")
        .eq("id", taskId)
        .single(),
    ]);

    return NextResponse.json({
      success: result.success,
      summary: result.summary,
      newSessionCount: sessionsResult.count ?? 0,
      riskScore: taskResult.data?.risk_score ?? 0,
      iterations: result.iterations,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/agent/renegotiate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
