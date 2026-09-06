import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";

/**
 * GET /api/sessions/today
 * Lists today's scheduled or active sessions for the authenticated user.
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

    // Fetch sessions scheduled for today
    const { data: sessions, error } = await supabase
      .from("sessions")
      .select(
        `
        id,
        task_id,
        subtask_id,
        scheduled_date,
        duration_minutes,
        status,
        started_at,
        completed_at,
        tasks!inner(title, deadline, user_id),
        subtasks(title)
      `
      )
      .eq("tasks.user_id", user.id)
      .eq("scheduled_date", today)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching today's sessions:", error);
      return NextResponse.json(
        { error: "Failed to fetch sessions" },
        { status: 500 }
      );
    }

    // Format output
    const formatted = (sessions || []).map((s: any) => ({
      id: s.id,
      task_id: s.task_id,
      subtask_id: s.subtask_id,
      scheduled_date: s.scheduled_date,
      duration_minutes: s.duration_minutes,
      status: s.status,
      started_at: s.started_at,
      completed_at: s.completed_at,
      task: s.tasks ? { title: s.tasks.title, deadline: s.tasks.deadline } : undefined,
      subtask: s.subtasks ? { title: s.subtasks.title } : undefined,
    }));

    return NextResponse.json({ sessions: formatted });
  } catch (error) {
    console.error("GET /api/sessions/today error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
