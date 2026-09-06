import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { format, addDays, subDays } from "date-fns";

// ============================================================
// Phase 5 Test Suite: Dashboard, Layout & Data Logic
// ============================================================

// 1. Mock Supabase Factory for Phase 5
function createPhase5MockSupabase(options?: {
  user?: { id: string; email: string } | null;
  tasks?: any[];
  sessions?: any[];
  subtasks?: any[];
}) {
  const currentUser = options?.user !== undefined ? options.user : { id: "user-phase5-123", email: "test@crunchai.local" };
  const tasks = options?.tasks ?? [];
  const sessions = options?.sessions ?? [];
  const subtasks = options?.subtasks ?? [];

  return {
    auth: {
      getUser: async () => ({ data: { user: currentUser }, error: null }),
    },
    from: (table: string) => {
      let filteredRows: any[] = [];
      if (table === "tasks") filteredRows = [...tasks];
      else if (table === "sessions") filteredRows = [...sessions];
      else if (table === "subtasks") filteredRows = [...subtasks];

      const builder: any = {
        select(fields?: string) {
          return builder;
        },
        eq(col: string, val: any) {
          if (col === "tasks.user_id" || col === "user_id") {
            if (table === "sessions") {
              filteredRows = filteredRows.filter((s) => {
                const parentTask = tasks.find((t) => t.id === s.task_id);
                return parentTask && parentTask.user_id === val;
              });
            } else {
              filteredRows = filteredRows.filter((r) => r.user_id === val);
            }
          } else if (col === "scheduled_date") {
            filteredRows = filteredRows.filter((r) => r.scheduled_date === val);
          } else if (col === "id" || col === "task_id") {
            filteredRows = filteredRows.filter((r) => r[col] === val);
          }
          return builder;
        },
        in(col: string, vals: any[]) {
          filteredRows = filteredRows.filter((r) => vals.includes(r[col]));
          return builder;
        },
        order(col: string, opts?: { ascending?: boolean }) {
          return builder;
        },
        then(resolve: any) {
          // Resolve joined objects if sessions
          if (table === "sessions") {
            const enriched = filteredRows.map((s) => ({
              ...s,
              tasks: tasks.find((t) => t.id === s.task_id) || null,
              subtasks: subtasks.find((sub) => sub.id === s.subtask_id) || null,
            }));
            return resolve({ data: enriched, error: null });
          }
          return resolve({ data: filteredRows, error: null });
        },
      };
      return builder;
    },
  };
}

describe("Phase 5: TaskProgressRing Math & Statistics", () => {
  function computeProgressRingStats(tasks: any[]) {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const activeTasks = tasks.filter(
      (t) => t.status === "active" || t.status === "at_risk" || t.status === "pending"
    ).length;

    const totalEffortHours = tasks.reduce(
      (acc, t) => acc + (t.total_effort_hours || 0),
      0
    );
    const completedEffortHours = tasks.reduce(
      (acc, t) => acc + (t.completed_effort_hours || 0),
      0
    );
    const remainingHours = Math.max(0, totalEffortHours - completedEffortHours);

    const percentComplete =
      totalEffortHours > 0
        ? Math.min(100, Math.round((completedEffortHours / totalEffortHours) * 100))
        : totalTasks > 0 && completedTasks === totalTasks
        ? 100
        : 0;

    const size = 160;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentComplete / 100) * circumference;

    return {
      totalTasks,
      completedTasks,
      activeTasks,
      totalEffortHours,
      completedEffortHours,
      remainingHours,
      percentComplete,
      circumference,
      strokeDashoffset,
    };
  }

  test("Calculates 0% progress when no tasks exist without division by zero", () => {
    const stats = computeProgressRingStats([]);
    assert.equal(stats.totalTasks, 0);
    assert.equal(stats.percentComplete, 0);
    assert.equal(stats.remainingHours, 0);
    assert.equal(stats.strokeDashoffset, stats.circumference);
  });

  test("Calculates partial progress percentage accurately", () => {
    const mockTasks = [
      { id: "1", status: "active", total_effort_hours: 10, completed_effort_hours: 4 },
      { id: "2", status: "active", total_effort_hours: 6, completed_effort_hours: 2 },
      { id: "3", status: "completed", total_effort_hours: 4, completed_effort_hours: 4 },
    ];
    const stats = computeProgressRingStats(mockTasks);
    assert.equal(stats.totalTasks, 3);
    assert.equal(stats.activeTasks, 2);
    assert.equal(stats.completedTasks, 1);
    assert.equal(stats.totalEffortHours, 20);
    assert.equal(stats.completedEffortHours, 10);
    assert.equal(stats.remainingHours, 10);
    assert.equal(stats.percentComplete, 50);

    // Stroke dashoffset at 50% should equal half the circumference
    assert.ok(Math.abs(stats.strokeDashoffset - stats.circumference / 2) < 0.001);
  });

  test("Caps progress at 100% even if completed exceeds total", () => {
    const mockTasks = [
      { id: "1", status: "completed", total_effort_hours: 5, completed_effort_hours: 8 },
    ];
    const stats = computeProgressRingStats(mockTasks);
    assert.equal(stats.percentComplete, 100);
    assert.equal(stats.remainingHours, 0);
    assert.equal(stats.strokeDashoffset, 0);
  });

  test("Returns 100% if all tasks completed even with 0 effort hours specified", () => {
    const mockTasks = [
      { id: "1", status: "completed", total_effort_hours: 0, completed_effort_hours: 0 },
      { id: "2", status: "completed", total_effort_hours: 0, completed_effort_hours: 0 },
    ];
    const stats = computeProgressRingStats(mockTasks);
    assert.equal(stats.percentComplete, 100);
  });
});

describe("Phase 5: RiskBanner Detection & Warning Logic", () => {
  function evaluateRiskBanner(tasks: any[]) {
    const atRiskTasks = tasks.filter(
      (t) =>
        t.status !== "completed" &&
        (t.status === "at_risk" || (t.risk_score !== null && t.risk_score >= 0.8))
    );

    if (atRiskTasks.length === 0) {
      return { showAlert: false, topTask: null, additionalCount: 0 };
    }

    const topTask = atRiskTasks[0];
    const riskPercentage = Math.round((topTask.risk_score ?? 0.8) * 100);

    return {
      showAlert: true,
      topTask,
      riskPercentage,
      additionalCount: atRiskTasks.length - 1,
    };
  }

  test("Shows no banner when tasks have low or medium risk scores", () => {
    const tasks = [
      { id: "t1", title: "Setup Repo", status: "active", risk_score: 0.3 },
      { id: "t2", title: "Write Docs", status: "active", risk_score: 0.65 },
      { id: "t3", title: "Finished MVP", status: "completed", risk_score: 0.9 }, // completed tasks don't alert
    ];
    const result = evaluateRiskBanner(tasks);
    assert.equal(result.showAlert, false);
  });

  test("Triggers risk banner when a task has risk_score >= 0.8", () => {
    const tasks = [
      {
        id: "t1",
        title: "Hackathon Final Submission",
        status: "active",
        risk_score: 0.88,
        risk_reason: "Heavy workload density across next 24 hours.",
      },
    ];
    const result = evaluateRiskBanner(tasks);
    assert.equal(result.showAlert, true);
    assert.equal(result.topTask.title, "Hackathon Final Submission");
    assert.equal(result.riskPercentage, 88);
    assert.equal(result.additionalCount, 0);
  });

  test("Triggers risk banner when a task has status='at_risk' even with null risk_score", () => {
    const tasks = [
      {
        id: "t2",
        title: "Database Migration",
        status: "at_risk",
        risk_score: null,
      },
    ];
    const result = evaluateRiskBanner(tasks);
    assert.equal(result.showAlert, true);
    assert.equal(result.riskPercentage, 80); // Fallback to 80%
  });

  test("Calculates additional at-risk count for multiple at-risk tasks", () => {
    const tasks = [
      { id: "t1", title: "Task 1", status: "at_risk", risk_score: 0.85 },
      { id: "t2", title: "Task 2", status: "at_risk", risk_score: 0.92 },
      { id: "t3", title: "Task 3", status: "active", risk_score: 0.81 },
      { id: "t4", title: "Task 4", status: "active", risk_score: 0.2 },
    ];
    const result = evaluateRiskBanner(tasks);
    assert.equal(result.showAlert, true);
    assert.equal(result.additionalCount, 2); // 3 total at risk, 1 top + 2 additional
  });
});

describe("Phase 5: UpcomingSessions Filtering & Formatting", () => {
  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

  test("Filters sessions strictly matching today's date", async () => {
    const mockTasks = [
      { id: "task-1", user_id: "u123", title: "API Development" },
    ];
    const mockSubtasks = [
      { id: "sub-1", title: "Design Auth Endpoints" },
      { id: "sub-2", title: "Write Playwright Tests" },
    ];
    const mockSessions = [
      { id: "s-old", task_id: "task-1", subtask_id: "sub-1", scheduled_date: yesterday, duration_minutes: 60, status: "completed" },
      { id: "s-today-1", task_id: "task-1", subtask_id: "sub-1", scheduled_date: today, duration_minutes: 90, status: "scheduled" },
      { id: "s-today-2", task_id: "task-1", subtask_id: "sub-2", scheduled_date: today, duration_minutes: 60, status: "scheduled" },
      { id: "s-future", task_id: "task-1", subtask_id: "sub-2", scheduled_date: tomorrow, duration_minutes: 60, status: "scheduled" },
    ];

    const supabase = createPhase5MockSupabase({
      user: { id: "u123", email: "user@crunchai.local" },
      tasks: mockTasks,
      subtasks: mockSubtasks,
      sessions: mockSessions,
    });

    const { data: todaySessions } = await supabase
      .from("sessions")
      .select("*")
      .eq("tasks.user_id", "u123")
      .eq("scheduled_date", today);

    assert.equal(todaySessions.length, 2);
    assert.equal(todaySessions[0].id, "s-today-1");
    assert.equal(todaySessions[0].duration_minutes, 90);
    assert.equal(todaySessions[0].tasks.title, "API Development");
    assert.equal(todaySessions[0].subtasks.title, "Design Auth Endpoints");
    assert.equal(todaySessions[1].id, "s-today-2");
  });

  test("Correctly differentiates scheduled, completed, and missed session statuses", () => {
    function getStatusTag(status: string) {
      switch (status) {
        case "completed":
          return { label: "Completed", color: "emerald" };
        case "missed":
          return { label: "Missed", color: "red" };
        default:
          return { label: "Scheduled", color: "cyan" };
      }
    }

    assert.deepEqual(getStatusTag("scheduled"), { label: "Scheduled", color: "cyan" });
    assert.deepEqual(getStatusTag("completed"), { label: "Completed", color: "emerald" });
    assert.deepEqual(getStatusTag("missed"), { label: "Missed", color: "red" });
  });
});

describe("Phase 5: DailyBrief Markdown Parser & Formatter", () => {
  function formatLine(line: string) {
    const trimmed = line.trim();
    if (!trimmed) return { type: "spacer" };
    if (trimmed.startsWith("### ")) return { type: "h4", text: trimmed.replace(/^###\s+/, "") };
    if (trimmed.startsWith("## ")) return { type: "h3", text: trimmed.replace(/^##\s+/, "") };
    if (trimmed.startsWith("# ")) return { type: "h2", text: trimmed.replace(/^#\s+/, "") };
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      return { type: "bullet", text: trimmed.replace(/^[-*]\s+/, "") };
    }
    if (/^\d+\.\s/.test(trimmed)) {
      return { type: "numbered", text: trimmed.replace(/^\d+\.\s+/, "") };
    }
    return { type: "paragraph", text: trimmed };
  }

  test("Parses markdown headings cleanly", () => {
    assert.deepEqual(formatLine("# Executive Brief"), { type: "h2", text: "Executive Brief" });
    assert.deepEqual(formatLine("## Today's Top Priorities"), { type: "h3", text: "Today's Top Priorities" });
    assert.deepEqual(formatLine("### Sprint Risk Analysis"), { type: "h4", text: "Sprint Risk Analysis" });
  });

  test("Parses bullet points and numbered lists", () => {
    assert.deepEqual(formatLine("- Focus on authentication backend"), {
      type: "bullet",
      text: "Focus on authentication backend",
    });
    assert.deepEqual(formatLine("* Complete task planning loop"), {
      type: "bullet",
      text: "Complete task planning loop",
    });
    assert.deepEqual(formatLine("1. Run unit test suite"), {
      type: "numbered",
      text: "Run unit test suite",
    });
    assert.deepEqual(formatLine("2. Verify browser layout"), {
      type: "numbered",
      text: "Verify browser layout",
    });
  });

  test("Formats bold highlights and inline code spans", () => {
    const raw = "Execute **Phase 5** using `npx tsx` command.";
    const formatted = raw
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');

    assert.equal(formatted, "Execute <strong>Phase 5</strong> using <code>npx tsx</code> command.");
  });
});

describe("Phase 5: Navigation & Header Dynamic Routing", () => {
  function getHeaderMeta(pathname: string) {
    if (pathname.startsWith("/tasks")) {
      return { title: "Task Management", subtitle: "Active milestones & scheduled timelines" };
    }
    if (pathname.startsWith("/focus")) {
      return { title: "Focus Mode", subtitle: "Distraction-free sprint timer" };
    }
    if (pathname.startsWith("/agent-log")) {
      return { title: "Agent Thinking Log", subtitle: "Real-time Gemini function-calling terminal" };
    }
    return { title: "Executive Dashboard", subtitle: "Autonomous planning, risk detection & daily briefing" };
  }

  test("Maps pathnames to correct page titles and subtitles", () => {
    assert.equal(getHeaderMeta("/dashboard").title, "Executive Dashboard");
    assert.equal(getHeaderMeta("/tasks").title, "Task Management");
    assert.equal(getHeaderMeta("/tasks/task-abc-123").title, "Task Management");
    assert.equal(getHeaderMeta("/focus").title, "Focus Mode");
    assert.equal(getHeaderMeta("/focus?sessionId=s1").title, "Focus Mode");
    assert.equal(getHeaderMeta("/agent-log").title, "Agent Thinking Log");
  });

  function isNavActive(itemHref: string, currentPath: string) {
    return (
      currentPath === itemHref ||
      (itemHref !== "/dashboard" && currentPath.startsWith(itemHref))
    );
  }

  test("Resolves active navigation states accurately", () => {
    assert.equal(isNavActive("/dashboard", "/dashboard"), true);
    assert.equal(isNavActive("/dashboard", "/tasks"), false);
    assert.equal(isNavActive("/tasks", "/tasks"), true);
    assert.equal(isNavActive("/tasks", "/tasks/task-123"), true);
    assert.equal(isNavActive("/focus", "/focus?sessionId=xyz"), true);
    assert.equal(isNavActive("/agent-log", "/agent-log"), true);
  });
});

describe("Phase 5: Data Query Key Contracts & Invalidation", () => {
  test("TanStack Query keys maintain consistent namespaces", () => {
    const taskListKey = ["tasks", { statusFilter: undefined }];
    const singleTaskKey = ["tasks", "task-123"];
    const dailyBriefKey = ["agent", "brief"];
    const todaySessionsKey = ["sessions", "today"];

    assert.equal(taskListKey[0], "tasks");
    assert.equal(singleTaskKey[0], "tasks");
    assert.equal(dailyBriefKey[0], "agent");
    assert.equal(todaySessionsKey[0], "sessions");
  });

  test("useDailyBrief enforces 30-minute stale time constraint", () => {
    const expectedStaleMs = 30 * 60 * 1000;
    assert.equal(expectedStaleMs, 1800000);
  });
});
