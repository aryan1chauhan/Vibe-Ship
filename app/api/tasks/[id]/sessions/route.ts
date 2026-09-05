import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { UpdateSessionSchema } from "@/lib/validators/task";
import { runAgent } from "@/lib/gemini/agent";
import { z } from "zod";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/tasks/[id]/sessions
 * Lists all sessions for a task, ordered by scheduled date.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: taskId } = await params;
    if (!UUID_REGEX.test(taskId)) {
      return NextResponse.json(
        { error: "Invalid task ID format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify task ownership
    const { data: task } = await supabase
      .from("tasks")
      .select("id")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .single();

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const { data: sessions, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("task_id", taskId)
      .order("scheduled_date", { ascending: true });

    if (error) {
      console.error("Error fetching sessions:", error);
      return NextResponse.json(
        { error: "Failed to fetch sessions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessions: sessions ?? [] });
  } catch (error) {
    console.error("GET /api/tasks/[id]/sessions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tasks/[id]/sessions
 * Marks a session as completed or missed.
 * Body: { sessionId: string, status: "completed" | "missed" }
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: taskId } = await params;
    if (!UUID_REGEX.test(taskId)) {
      return NextResponse.json(
        { error: "Invalid task ID format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const sessionId = body.sessionId;
    if (!sessionId || typeof sessionId !== "string" || !UUID_REGEX.test(sessionId)) {
      return NextResponse.json(
        { error: "Valid sessionId UUID is required" },
        { status: 400 }
      );
    }

    const parsed = UpdateSessionSchema.parse({
      status: body.status,
      duration_minutes: body.duration_minutes,
    });

    // Verify session belongs to this task
    const { data: session } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("task_id", taskId)
      .single();

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Use service client for cross-table writes (bypasses RLS for agent operations)
    const serviceClient = await createServiceClient();

    if (parsed.status === "completed") {
      // 1. Update session row
      await serviceClient
        .from("sessions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      // 2. Increment completed effort hours on task
      const hoursCompleted = session.duration_minutes / 60;
      await serviceClient
        .from("tasks")
        .update({
          completed_effort_hours:
            (task.completed_effort_hours || 0) + hoursCompleted,
          updated_at: new Date().toISOString(),
        })
        .eq("id", taskId);

      // 3. Check if all sessions for the subtask are complete
      if (session.subtask_id) {
        const { data: subtaskSessions } = await serviceClient
          .from("sessions")
          .select("status")
          .eq("subtask_id", session.subtask_id);

        const allComplete =
          subtaskSessions &&
          subtaskSessions.every((s) => s.status === "completed");
        if (allComplete) {
          await serviceClient
            .from("subtasks")
            .update({ is_completed: true })
            .eq("id", session.subtask_id);
        }
      }

      // 4. Check if all subtasks are complete → mark task completed
      const { data: allSubtasks } = await serviceClient
        .from("subtasks")
        .select("is_completed")
        .eq("task_id", taskId);

      if (allSubtasks && allSubtasks.length > 0) {
        const taskComplete = allSubtasks.every((st) => st.is_completed);
        if (taskComplete) {
          await serviceClient
            .from("tasks")
            .update({
              status: "completed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", taskId);
        }
      }

      return NextResponse.json({
        session: { ...session, status: "completed" },
        message: "Session marked as completed",
      });
    } else if (parsed.status === "missed") {
      // 1. Update session row
      await serviceClient
        .from("sessions")
        .update({ status: "missed" })
        .eq("id", sessionId);

      // 2. Auto-trigger renegotiation
      let renegotiationResult = null;
      try {
        renegotiationResult = await runAgent({
          mode: "renegotiate",
          taskId,
          userId: user.id,
          taskData: {
            title: task.title,
            description: task.description,
            deadline: task.deadline,
            missedSessionId: sessionId,
          },
        });
      } catch (agentErr) {
        console.error("Renegotiation agent error:", agentErr);
      }

      return NextResponse.json({
        session: { ...session, status: "missed" },
        message: "Session marked as missed — schedule renegotiated",
        renegotiation: renegotiationResult
          ? {
              summary: renegotiationResult.summary,
              steps: renegotiationResult.steps.length,
            }
          : null,
      });
    } else {
      // Scheduled / rescheduled — just update status
      await serviceClient
        .from("sessions")
        .update({ status: parsed.status })
        .eq("id", sessionId);

      return NextResponse.json({
        session: { ...session, status: parsed.status },
        message: `Session updated to ${parsed.status}`,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("PUT /api/tasks/[id]/sessions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
