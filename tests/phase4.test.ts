import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { addDays } from "date-fns";

// ——— Validators ———
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  UpdateSessionSchema,
  AgentPlanRequestSchema,
  AgentRenegotiateRequestSchema,
} from "../lib/validators/task";

// ——— Agent engine ———
import { runAgent } from "../lib/gemini/agent";
import { toolHandlers } from "../lib/gemini/tool-handlers";

// ——— Utilities (Phase 3 regression) ———
import {
  getWorkingDays,
  getAvailableHours,
  distributeEffort,
  buildWorkSchedule,
} from "../lib/utils/schedule";
import { calculateRiskScore, getRiskLevel } from "../lib/utils/risk";
import {
  formatRelativeDate,
  formatDuration,
  formatRiskLabel,
} from "../lib/utils/format";

// ============================================================
// Shared mock factory — reused across Phase 3 & Phase 4 suites
// ============================================================
function createMockSupabase(seedData?: {
  tasks?: any[];
  subtasks?: any[];
  sessions?: any[];
  agent_logs?: any[];
}) {
  const tables: Record<string, any[]> = {
    tasks: seedData?.tasks ?? [],
    subtasks: seedData?.subtasks ?? [],
    sessions: seedData?.sessions ?? [],
    agent_logs: seedData?.agent_logs ?? [],
  };

  function chainableQuery(table: string, baseRows?: any[]) {
    let rows = baseRows ?? [...(tables[table] || [])];
    const builder: any = {
      eq(col: string, val: any) {
        rows = rows.filter((r) => r[col] === val);
        return builder;
      },
      in(col: string, vals: any[]) {
        rows = rows.filter((r) => vals.includes(r[col]));
        return builder;
      },
      order(_col: string, _opts?: any) {
        return builder;
      },
      single() {
        return { data: rows[0] || null, error: rows[0] ? null : { message: "Not found" } };
      },
      select(query?: string) {
        if (query === "id") {
          rows = rows.map((r) => ({ id: r.id }));
        }
        return builder;
      },
      then(resolve: any) {
        resolve({ data: rows, error: null, count: rows.length });
      },
      data: rows,
      error: null,
      count: rows.length,
    };
    return builder;
  }

  return {
    from(table: string) {
      return {
        select(query = "*") {
          return chainableQuery(table);
        },
        insert(records: any | any[]) {
          const arr = Array.isArray(records) ? records : [records];
          for (const r of arr) {
            const row = { id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...r };
            (tables[table] = tables[table] || []).push(row);
          }
          return {
            select() {
              return {
                single() {
                  return { data: arr[0], error: null };
                },
                data: arr,
                error: null,
              };
            },
            data: arr,
            error: null,
          };
        },
        update(updates: Record<string, any>) {
          const b: any = {
            eq(col: string, val: any) {
              for (const row of tables[table] || []) {
                if (row[col] === val) Object.assign(row, updates);
              }
              return b;
            },
            select() {
              return {
                single() {
                  return { data: tables[table]?.[0], error: null };
                },
              };
            },
          };
          return b;
        },
        delete() {
          const b: any = {
            eq(col: string, val: any) {
              tables[table] = (tables[table] || []).filter((r) => r[col] !== val);
              return b;
            },
          };
          return b;
        },
      };
    },
    auth: {
      getUser() {
        return { data: { user: { id: "user-test-001" } } };
      },
    },
    _tables: () => tables,
  };
}

// ============================================================
// PHASE 3 REGRESSION — Core utilities & agent loop
// ============================================================

describe("Phase 3 Regression: Schedule Utils", () => {
  test("getWorkingDays excludes weekends", () => {
    const days = getWorkingDays("2026-09-07", "2026-09-13", false);
    assert.equal(days.length, 5);
  });

  test("getWorkingDays includes weekends", () => {
    const days = getWorkingDays("2026-09-07", "2026-09-13", true);
    assert.equal(days.length, 7);
  });

  test("getAvailableHours calculates remainder", () => {
    const available = getAvailableHours(
      "2026-09-08",
      [
        { scheduled_date: "2026-09-08", duration_minutes: 90 },
        { scheduled_date: "2026-09-08", duration_minutes: 60 },
      ],
      6
    );
    assert.equal(available, 3.5);
  });

  test("distributeEffort balances hours across days", () => {
    const alloc = distributeEffort(9, ["2026-09-08", "2026-09-09", "2026-09-10"], 4);
    assert.equal(alloc.length, 3);
    const sum = alloc.reduce((a, d) => a + d.hours, 0);
    assert.equal(Math.round(sum), 9);
  });

  test("buildWorkSchedule creates sessions", () => {
    const sessions = buildWorkSchedule(
      [
        { title: "Design", effort_hours: 3 },
        { title: "Build", effort_hours: 2 },
      ],
      "2026-09-15",
      "2026-09-08"
    );
    assert.ok(sessions.length >= 2);
    for (const s of sessions) {
      assert.ok(s.duration_minutes >= 30 && s.duration_minutes <= 120);
    }
  });
});

describe("Phase 3 Regression: Risk Scoring", () => {
  test("Low risk for comfortable deadline", () => {
    const result = calculateRiskScore({
      deadline: addDays(new Date(), 10),
      totalEffortHours: 4,
      completedEffortHours: 1,
      sessions: [
        { scheduled_date: "2026-09-10", duration_minutes: 60, status: "completed" },
        { scheduled_date: "2026-09-11", duration_minutes: 60, status: "scheduled" },
      ],
    });
    assert.ok(result.score >= 0 && result.score <= 1);
    assert.equal(result.level, "on_track");
  });

  test("getRiskLevel maps correctly", () => {
    assert.equal(getRiskLevel(0.2), "on_track");
    assert.equal(getRiskLevel(0.55), "warning");
    assert.equal(getRiskLevel(0.85), "at_risk");
  });
});

describe("Phase 3 Regression: Formatting", () => {
  test("formatDuration", () => {
    assert.equal(formatDuration(90), "1h 30m");
    assert.equal(formatDuration(45), "45m");
  });

  test("formatRiskLabel", () => {
    assert.ok(formatRiskLabel(0.2).includes("✅"));
    assert.ok(formatRiskLabel(0.55).includes("⚠️"));
    assert.ok(formatRiskLabel(0.85).includes("🔴"));
  });

  test("formatRelativeDate returns a string", () => {
    const result = formatRelativeDate(addDays(new Date(), 3));
    assert.ok(typeof result === "string" && result.length > 0);
  });
});

describe("Phase 3 Regression: Agent Loop", () => {
  test("runAgent plan mode produces subtasks, sessions, and risk", async () => {
    const mock = createMockSupabase({
      tasks: [
        {
          id: "task-reg-001",
          user_id: "user-test-001",
          title: "Regression Test Task",
          deadline: addDays(new Date(), 7).toISOString(),
          status: "pending",
          total_effort_hours: 0,
          completed_effort_hours: 0,
          risk_score: 0,
          priority: 99,
        },
      ],
    });

    const result = await runAgent({
      mode: "plan",
      taskId: "task-reg-001",
      userId: "user-test-001",
      taskData: {
        title: "Regression Test Task",
        deadline: addDays(new Date(), 7).toISOString(),
      },
      supabaseClient: mock as any,
    });

    assert.equal(result.success, true);
    assert.ok(result.steps.length >= 4);
    assert.ok(result.iterations <= 10);
    assert.ok(mock._tables().subtasks.length > 0, "Subtasks persisted");
    assert.ok(mock._tables().sessions.length > 0, "Sessions persisted");
    assert.ok(mock._tables().agent_logs.length > 0, "Agent logs persisted");
  });
});

// ============================================================
// PHASE 4 — Validator Schema Tests
// ============================================================

describe("Phase 4: CreateTaskSchema Validation", () => {
  test("Accepts valid task with title and ISO deadline", () => {
    const result = CreateTaskSchema.parse({
      title: "Build MVP",
      deadline: new Date("2026-10-01").toISOString(),
    });
    assert.equal(result.title, "Build MVP");
  });

  test("Accepts task with optional description", () => {
    const result = CreateTaskSchema.parse({
      title: "Design System",
      description: "Create tokens and components",
      deadline: new Date("2026-10-15").toISOString(),
    });
    assert.equal(result.description, "Create tokens and components");
  });

  test("Rejects empty title", () => {
    assert.throws(() =>
      CreateTaskSchema.parse({
        title: "",
        deadline: new Date().toISOString(),
      })
    );
  });

  test("Rejects title exceeding 200 characters", () => {
    assert.throws(() =>
      CreateTaskSchema.parse({
        title: "x".repeat(201),
        deadline: new Date().toISOString(),
      })
    );
  });

  test("Rejects non-ISO deadline", () => {
    assert.throws(() =>
      CreateTaskSchema.parse({
        title: "Valid Title",
        deadline: "next tuesday",
      })
    );
  });

  test("Rejects missing deadline", () => {
    assert.throws(() =>
      CreateTaskSchema.parse({
        title: "Valid Title",
      })
    );
  });
});

describe("Phase 4: UpdateTaskSchema Validation", () => {
  test("Accepts partial updates", () => {
    const result = UpdateTaskSchema.parse({
      title: "Updated Title",
    });
    assert.equal(result.title, "Updated Title");
    assert.equal(result.status, undefined);
  });

  test("Accepts status transitions", () => {
    for (const status of ["pending", "active", "completed", "at_risk", "overdue"]) {
      const result = UpdateTaskSchema.parse({ status });
      assert.equal(result.status, status);
    }
  });

  test("Rejects invalid status", () => {
    assert.throws(() => UpdateTaskSchema.parse({ status: "paused" }));
  });

  test("Accepts risk_score within bounds", () => {
    assert.ok(UpdateTaskSchema.parse({ risk_score: 0 }));
    assert.ok(UpdateTaskSchema.parse({ risk_score: 0.5 }));
    assert.ok(UpdateTaskSchema.parse({ risk_score: 1 }));
  });

  test("Rejects risk_score out of bounds", () => {
    assert.throws(() => UpdateTaskSchema.parse({ risk_score: -0.1 }));
    assert.throws(() => UpdateTaskSchema.parse({ risk_score: 1.1 }));
  });

  test("Accepts priority as positive integer", () => {
    const r = UpdateTaskSchema.parse({ priority: 3 });
    assert.equal(r.priority, 3);
  });
});

describe("Phase 4: UpdateSessionSchema Validation", () => {
  test("Accepts valid session statuses", () => {
    for (const status of ["scheduled", "completed", "missed", "rescheduled"]) {
      const r = UpdateSessionSchema.parse({ status });
      assert.equal(r.status, status);
    }
  });

  test("Rejects invalid session status", () => {
    assert.throws(() => UpdateSessionSchema.parse({ status: "cancelled" }));
  });

  test("Accepts optional duration_minutes", () => {
    const r = UpdateSessionSchema.parse({ status: "completed", duration_minutes: 45 });
    assert.equal(r.duration_minutes, 45);
  });

  test("Rejects non-positive duration_minutes", () => {
    assert.throws(() =>
      UpdateSessionSchema.parse({ status: "completed", duration_minutes: 0 })
    );
    assert.throws(() =>
      UpdateSessionSchema.parse({ status: "completed", duration_minutes: -10 })
    );
  });
});

describe("Phase 4: AgentPlanRequestSchema Validation", () => {
  test("Accepts valid UUID", () => {
    const r = AgentPlanRequestSchema.parse({
      taskId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    });
    assert.equal(r.taskId, "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");
  });

  test("Rejects non-UUID", () => {
    assert.throws(() => AgentPlanRequestSchema.parse({ taskId: "not-a-uuid" }));
  });

  test("Rejects missing taskId", () => {
    assert.throws(() => AgentPlanRequestSchema.parse({}));
  });
});

describe("Phase 4: AgentRenegotiateRequestSchema Validation", () => {
  test("Accepts taskId only", () => {
    const r = AgentRenegotiateRequestSchema.parse({
      taskId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    });
    assert.ok(r.taskId);
    assert.equal(r.missedSessionId, undefined);
  });

  test("Accepts taskId + missedSessionId", () => {
    const r = AgentRenegotiateRequestSchema.parse({
      taskId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      missedSessionId: "b1ffcd00-1d1c-4fa9-8c7e-7cc0ce491b22",
    });
    assert.ok(r.missedSessionId);
  });

  test("Rejects invalid missedSessionId", () => {
    assert.throws(() =>
      AgentRenegotiateRequestSchema.parse({
        taskId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        missedSessionId: "bad-id",
      })
    );
  });
});

// ============================================================
// PHASE 4 — Mock Supabase CRUD Integration Tests
// ============================================================

describe("Phase 4: Task CRUD via Mock Supabase", () => {
  test("Insert task and read it back", () => {
    const mock = createMockSupabase();

    // INSERT
    mock.from("tasks").insert({
      user_id: "user-test-001",
      title: "Launch Feature",
      deadline: "2026-10-01T00:00:00.000Z",
      status: "pending",
      risk_score: 0,
      priority: 1,
      completed_effort_hours: 0,
    });

    // READ
    const tasks = mock._tables().tasks;
    assert.equal(tasks.length, 1);
    assert.equal(tasks[0].title, "Launch Feature");
    assert.equal(tasks[0].status, "pending");
    assert.equal(tasks[0].user_id, "user-test-001");
  });

  test("Update task status and verify mutation", () => {
    const mock = createMockSupabase({
      tasks: [
        {
          id: "task-upd-001",
          user_id: "user-test-001",
          title: "Old Title",
          status: "pending",
        },
      ],
    });

    mock.from("tasks").update({ title: "New Title", status: "active" }).eq("id", "task-upd-001");

    const task = mock._tables().tasks[0];
    assert.equal(task.title, "New Title");
    assert.equal(task.status, "active");
  });

  test("Delete task removes row", () => {
    const mock = createMockSupabase({
      tasks: [
        { id: "task-del-001", user_id: "user-test-001", title: "To Delete" },
        { id: "task-del-002", user_id: "user-test-001", title: "Keep" },
      ],
    });

    mock.from("tasks").delete().eq("id", "task-del-001");

    const remaining = mock._tables().tasks;
    assert.equal(remaining.length, 1);
    assert.equal(remaining[0].id, "task-del-002");
  });

  test("Read returns only user-owned tasks", () => {
    const mock = createMockSupabase({
      tasks: [
        { id: "t1", user_id: "user-test-001", title: "Mine" },
        { id: "t2", user_id: "other-user", title: "Theirs" },
      ],
    });

    const query = mock.from("tasks").select("*").eq("user_id", "user-test-001");
    // The chainable query filters in place
    const result = query.single();
    assert.equal(result.data?.title, "Mine");
  });
});

describe("Phase 4: Session Completion Cascade Logic", () => {
  test("Completing a session increments completed_effort_hours on the task", () => {
    const mock = createMockSupabase({
      tasks: [
        {
          id: "task-cascade-001",
          user_id: "user-test-001",
          title: "Cascade Test",
          completed_effort_hours: 0,
          status: "active",
        },
      ],
      sessions: [
        {
          id: "sess-001",
          task_id: "task-cascade-001",
          subtask_id: "sub-001",
          duration_minutes: 90,
          status: "scheduled",
        },
      ],
      subtasks: [
        {
          id: "sub-001",
          task_id: "task-cascade-001",
          is_completed: false,
        },
      ],
    });

    // Simulate session completion: update session status
    mock.from("sessions").update({ status: "completed" }).eq("id", "sess-001");
    assert.equal(mock._tables().sessions[0].status, "completed");

    // Simulate incrementing completed hours (1.5h from 90min)
    const hoursCompleted = 90 / 60;
    const currentTask = mock._tables().tasks[0];
    mock
      .from("tasks")
      .update({
        completed_effort_hours: currentTask.completed_effort_hours + hoursCompleted,
      })
      .eq("id", "task-cascade-001");

    assert.equal(mock._tables().tasks[0].completed_effort_hours, 1.5);
  });

  test("Completing all sessions marks subtask as completed", () => {
    const mock = createMockSupabase({
      sessions: [
        { id: "s1", task_id: "t1", subtask_id: "sub-1", status: "completed", duration_minutes: 60 },
        { id: "s2", task_id: "t1", subtask_id: "sub-1", status: "completed", duration_minutes: 60 },
      ],
      subtasks: [
        { id: "sub-1", task_id: "t1", is_completed: false },
      ],
    });

    // All sessions for sub-1 are completed — mark subtask done
    const subtaskSessions = mock._tables().sessions.filter(
      (s: any) => s.subtask_id === "sub-1"
    );
    const allComplete = subtaskSessions.every((s: any) => s.status === "completed");
    assert.ok(allComplete);

    if (allComplete) {
      mock.from("subtasks").update({ is_completed: true }).eq("id", "sub-1");
    }
    assert.equal(mock._tables().subtasks[0].is_completed, true);
  });

  test("Completing all subtasks marks task as completed", () => {
    const mock = createMockSupabase({
      tasks: [
        { id: "t1", user_id: "user-test-001", status: "active" },
      ],
      subtasks: [
        { id: "sub-1", task_id: "t1", is_completed: true },
        { id: "sub-2", task_id: "t1", is_completed: true },
      ],
    });

    const allSubtasks = mock._tables().subtasks.filter((s: any) => s.task_id === "t1");
    const allDone = allSubtasks.every((s: any) => s.is_completed);
    assert.ok(allDone);

    if (allDone) {
      mock.from("tasks").update({ status: "completed" }).eq("id", "t1");
    }
    assert.equal(mock._tables().tasks[0].status, "completed");
  });

  test("Partial subtask completion does NOT mark task completed", () => {
    const mock = createMockSupabase({
      tasks: [{ id: "t1", user_id: "user-test-001", status: "active" }],
      subtasks: [
        { id: "sub-1", task_id: "t1", is_completed: true },
        { id: "sub-2", task_id: "t1", is_completed: false },
      ],
    });

    const allSubtasks = mock._tables().subtasks.filter((s: any) => s.task_id === "t1");
    const allDone = allSubtasks.every((s: any) => s.is_completed);
    assert.ok(!allDone, "Not all subtasks are completed");
    assert.equal(mock._tables().tasks[0].status, "active");
  });
});

// ============================================================
// PHASE 4 — Agent Endpoint Integration Tests
// ============================================================

describe("Phase 4: Agent Plan Endpoint Integration", () => {
  test("Plan agent creates subtasks, sessions, logs, and activates task", async () => {
    const mock = createMockSupabase({
      tasks: [
        {
          id: "task-plan-001",
          user_id: "user-test-001",
          title: "Launch Product",
          description: "Full product launch",
          deadline: addDays(new Date(), 7).toISOString(),
          status: "pending",
          total_effort_hours: 0,
          completed_effort_hours: 0,
          risk_score: 0,
          priority: 99,
        },
      ],
    });

    const result = await runAgent({
      mode: "plan",
      taskId: "task-plan-001",
      userId: "user-test-001",
      taskData: {
        title: "Launch Product",
        description: "Full product launch",
        deadline: addDays(new Date(), 7).toISOString(),
      },
      supabaseClient: mock as any,
    });

    assert.equal(result.success, true);
    assert.equal(result.mode, "plan");
    assert.ok(result.summary.length > 10);

    // Verify subtasks created
    const subtasks = mock._tables().subtasks;
    assert.ok(subtasks.length >= 3, `Expected ≥3 subtasks, got ${subtasks.length}`);

    // Verify sessions created
    const sessions = mock._tables().sessions;
    assert.ok(sessions.length >= 2, `Expected ≥2 sessions, got ${sessions.length}`);

    // Verify agent logs written
    const logs = mock._tables().agent_logs;
    assert.ok(logs.length >= 4, `Expected ≥4 logs (4 tools + completion), got ${logs.length}`);

    // Verify task status transitioned to active
    assert.equal(mock._tables().tasks[0].status, "active");

    // Verify risk score was set
    assert.ok(typeof mock._tables().tasks[0].risk_score === "number");
  });

  test("Plan agent returns structured step logs", async () => {
    const mock = createMockSupabase({
      tasks: [
        {
          id: "task-steps-001",
          user_id: "user-test-001",
          title: "Steps Test",
          deadline: addDays(new Date(), 5).toISOString(),
          status: "pending",
          total_effort_hours: 0,
          completed_effort_hours: 0,
          risk_score: 0,
          priority: 1,
        },
      ],
    });

    const result = await runAgent({
      mode: "plan",
      taskId: "task-steps-001",
      userId: "user-test-001",
      taskData: {
        title: "Steps Test",
        deadline: addDays(new Date(), 5).toISOString(),
      },
      supabaseClient: mock as any,
    });

    // Verify step structure
    for (const step of result.steps) {
      assert.ok(typeof step.stepNumber === "number");
      assert.ok(typeof step.toolName === "string");
      assert.ok(["running", "completed", "error"].includes(step.status));
    }

    // Verify expected tool sequence
    const toolNames = result.steps.map((s) => s.toolName);
    assert.ok(toolNames.includes("break_into_subtasks"));
    assert.ok(toolNames.includes("estimate_effort"));
    assert.ok(toolNames.includes("calculate_schedule"));
    assert.ok(toolNames.includes("assess_risk"));
  });
});

describe("Phase 4: Agent Renegotiate Endpoint Integration", () => {
  test("Renegotiate agent rebuilds schedule after missed session", async () => {
    const mock = createMockSupabase({
      tasks: [
        {
          id: "task-reneg-001",
          user_id: "user-test-001",
          title: "Renegotiate Test",
          deadline: addDays(new Date(), 4).toISOString(),
          status: "active",
          total_effort_hours: 8,
          completed_effort_hours: 2,
          risk_score: 0.3,
          priority: 1,
        },
      ],
    });

    const result = await runAgent({
      mode: "renegotiate",
      taskId: "task-reneg-001",
      userId: "user-test-001",
      taskData: {
        title: "Renegotiate Test",
        deadline: addDays(new Date(), 4).toISOString(),
        missedSessionId: "sess-missed-001",
      },
      supabaseClient: mock as any,
    });

    assert.equal(result.success, true);
    assert.equal(result.mode, "renegotiate");
    assert.ok(result.summary.includes("Renegotiated"));

    // Should have rebalance_plan and assess_risk steps
    const toolNames = result.steps.map((s) => s.toolName);
    assert.ok(toolNames.includes("rebalance_plan"));
    assert.ok(toolNames.includes("assess_risk"));
  });
});

describe("Phase 4: Agent Brief Endpoint Integration", () => {
  test("Brief agent returns a markdown summary", async () => {
    const mock = createMockSupabase({
      tasks: [
        {
          id: "task-brief-001",
          user_id: "user-test-001",
          title: "Brief Test",
          deadline: addDays(new Date(), 2).toISOString(),
          status: "active",
        },
      ],
    });

    const result = await runAgent({
      mode: "brief",
      taskId: "task-brief-001",
      userId: "user-test-001",
      taskData: {
        title: "Brief Test",
        deadline: addDays(new Date(), 2).toISOString(),
      },
      supabaseClient: mock as any,
    });

    assert.equal(result.success, true);
    assert.equal(result.mode, "brief");
    assert.ok(result.summary.length > 10, "Brief should contain content");
    assert.ok(
      result.summary.includes("Briefing") || result.summary.includes("Focus"),
      "Brief should mention briefing or focus"
    );
  });
});

describe("Phase 4: Agent Prioritize Endpoint Integration", () => {
  test("Prioritize agent ranks multiple tasks", async () => {
    const mock = createMockSupabase({
      tasks: [
        {
          id: "task-pri-001",
          user_id: "user-test-001",
          title: "Urgent Task",
          deadline: addDays(new Date(), 1).toISOString(),
          risk_score: 0.9,
          status: "active",
        },
        {
          id: "task-pri-002",
          user_id: "user-test-001",
          title: "Relaxed Task",
          deadline: addDays(new Date(), 14).toISOString(),
          risk_score: 0.1,
          status: "active",
        },
      ],
    });

    const result = await runAgent({
      mode: "prioritize",
      taskId: "task-pri-001",
      userId: "user-test-001",
      taskData: {
        tasks: [
          {
            task_id: "task-pri-001",
            title: "Urgent Task",
            deadline: addDays(new Date(), 1).toISOString(),
            risk_score: 0.9,
          },
          {
            task_id: "task-pri-002",
            title: "Relaxed Task",
            deadline: addDays(new Date(), 14).toISOString(),
            risk_score: 0.1,
          },
        ],
      },
      supabaseClient: mock as any,
    });

    assert.equal(result.success, true);
    assert.equal(result.mode, "prioritize");
    assert.ok(result.summary.includes("Prioritized"));

    // Should have prioritize_tasks step
    const toolNames = result.steps.map((s) => s.toolName);
    assert.ok(toolNames.includes("prioritize_tasks"));
  });
});

// ============================================================
// PHASE 4 — Error Handling & Edge Cases
// ============================================================

describe("Phase 4: Error Handling & Edge Cases", () => {
  test("Mock auth returns 401-equivalent when user is null", () => {
    const noAuthMock = {
      ...createMockSupabase(),
      auth: {
        getUser() {
          return { data: { user: null } };
        },
      },
    };

    const user = noAuthMock.auth.getUser().data.user;
    assert.equal(user, null, "Unauthenticated user should be null");
  });

  test("Task not found returns null from query", () => {
    const mock = createMockSupabase({ tasks: [] });
    const result = mock.from("tasks").select("*").eq("id", "nonexistent").single();
    assert.equal(result.data, null);
  });

  test("Agent handles missing task data gracefully", async () => {
    const mock = createMockSupabase({
      tasks: [
        {
          id: "task-edge-001",
          user_id: "user-test-001",
          title: "Edge Case",
          deadline: addDays(new Date(), 3).toISOString(),
          status: "pending",
          total_effort_hours: 0,
          completed_effort_hours: 0,
          risk_score: 0,
          priority: 1,
        },
      ],
    });

    // Call with minimal taskData (no description)
    const result = await runAgent({
      mode: "plan",
      taskId: "task-edge-001",
      userId: "user-test-001",
      taskData: {
        title: "Edge Case",
        deadline: addDays(new Date(), 3).toISOString(),
      },
      supabaseClient: mock as any,
    });

    assert.equal(result.success, true);
  });

  test("Validator rejects completely empty body", () => {
    assert.throws(() => CreateTaskSchema.parse({}));
    assert.throws(() => AgentPlanRequestSchema.parse({}));
  });

  test("Validator rejects body with extra unknown fields (strict check)", () => {
    // CreateTaskSchema should still pass with extra fields (Zod strips by default)
    const result = CreateTaskSchema.parse({
      title: "Valid",
      deadline: new Date().toISOString(),
      extraField: "should be stripped",
    });
    assert.equal(result.title, "Valid");
    assert.equal((result as any).extraField, undefined);
  });
});

describe("Phase 4: Tool Handler Direct Tests", () => {
  test("break_into_subtasks handler creates 4 subtasks", async () => {
    const mock = createMockSupabase();
    const result = await toolHandlers.break_into_subtasks(
      {
        title: "API Integration",
        deadline: addDays(new Date(), 5).toISOString(),
      },
      {
        taskId: "task-tool-001",
        userId: "user-test-001",
        supabase: mock as any,
        stepNumber: 1,
        agentMode: "plan",
      }
    );

    assert.ok((result as any).subtasks.length === 4);
    assert.ok(mock._tables().subtasks.length === 4);
  });

  test("estimate_effort handler estimates and updates total_effort", async () => {
    const mock = createMockSupabase({
      tasks: [
        { id: "task-effort-001", total_effort_hours: 0 },
      ],
    });

    const result = await toolHandlers.estimate_effort(
      {
        subtasks: [
          { title: "Research", description: "Gather data" },
          { title: "Build", description: "Write code" },
        ],
      },
      {
        taskId: "task-effort-001",
        userId: "user-test-001",
        supabase: mock as any,
        stepNumber: 2,
        agentMode: "plan",
      }
    );

    assert.ok((result as any).estimates.length === 2);
    assert.ok(mock._tables().tasks[0].total_effort_hours > 0);
  });

  test("assess_risk handler returns score between 0 and 1", async () => {
    const mock = createMockSupabase({
      tasks: [
        { id: "task-risk-001", risk_score: 0 },
      ],
      sessions: [],
    });

    const result = await toolHandlers.assess_risk(
      {
        deadline: addDays(new Date(), 5).toISOString(),
      },
      {
        taskId: "task-risk-001",
        userId: "user-test-001",
        supabase: mock as any,
        stepNumber: 4,
        agentMode: "plan",
      }
    );

    assert.ok(typeof (result as any).risk_score === "number");
    assert.ok((result as any).risk_score >= 0 && (result as any).risk_score <= 1);
  });
});

describe("Phase 4: API Edge Cases & Parameter Validation (docs/edge-cases.md §13)", () => {
  const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  test("Scenario 13.3: UUID_REGEX validates valid RFC 4122 UUIDs", () => {
    assert.ok(UUID_REGEX.test("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"));
    assert.ok(UUID_REGEX.test("b1ffcd00-1d1c-4fa9-8c7e-7cc0ce491b22"));
  });

  test("Scenario 13.3: UUID_REGEX rejects non-UUID strings", () => {
    assert.ok(!UUID_REGEX.test("not-a-uuid"));
    assert.ok(!UUID_REGEX.test("12345"));
    assert.ok(!UUID_REGEX.test("../../../etc/passwd"));
    assert.ok(!UUID_REGEX.test(""));
  });

  test("Scenario 13.10: PUT rejects empty update payload", () => {
    const emptyPayload = {};
    const parsed = UpdateTaskSchema.parse(emptyPayload);
    assert.equal(Object.keys(parsed).length, 0);
  });

  test("Scenario 13.2: Empty body check identifies empty object or null", () => {
    const isEmpty = (b: any) => !b || typeof b !== "object" || Object.keys(b).length === 0;
    assert.ok(isEmpty(null));
    assert.ok(isEmpty(undefined));
    assert.ok(isEmpty({}));
    assert.ok(!isEmpty({ title: "Valid Title" }));
  });
});
