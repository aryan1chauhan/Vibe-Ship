import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { addDays, format, subDays } from "date-fns";

// Utilities
import {
  getWorkingDays,
  getAvailableHours,
  distributeEffort,
  buildWorkSchedule,
} from "../lib/utils/schedule";
import { calculateRiskScore, getRiskLevel } from "../lib/utils/risk";
import { formatRelativeDate, formatDuration, formatRiskLabel } from "../lib/utils/format";

// Validators & Schemas
import {
  SubtaskSchema,
  EffortEstimateSchema,
  SessionSchema,
  RiskAssessmentSchema,
  RebalancePlanInputSchema,
} from "../lib/gemini/schemas";
import { CreateTaskSchema, UpdateSessionSchema } from "../lib/validators/task";

// Agent
import { runAgent } from "../lib/gemini/agent";
import { toolHandlers } from "../lib/gemini/tool-handlers";

describe("Phase 3: Schedule Calculation Tests", () => {
  test("getWorkingDays excludes weekends by default", () => {
    // 2026-09-07 is Monday, 2026-09-13 is Sunday
    const days = getWorkingDays("2026-09-07", "2026-09-13", false);
    assert.equal(days.length, 5); // Monday to Friday
    assert.deepEqual(days, [
      "2026-09-07",
      "2026-09-08",
      "2026-09-09",
      "2026-09-10",
      "2026-09-11",
    ]);
  });

  test("getWorkingDays includes weekends when requested", () => {
    const days = getWorkingDays("2026-09-07", "2026-09-13", true);
    assert.equal(days.length, 7);
  });

  test("getAvailableHours calculates remaining time correctly", () => {
    const date = "2026-09-08";
    const existing = [
      { scheduled_date: date, duration_minutes: 90 },
      { scheduled_date: date, duration_minutes: 60 },
      { scheduled_date: "2026-09-09", duration_minutes: 120 },
    ];

    // Cap is 6 hours (360 mins). Used is 150 mins (2.5 hours). Remaining = 3.5 hours
    const available = getAvailableHours(date, existing, 6);
    assert.equal(available, 3.5);
  });

  test("distributeEffort balances workload across days", () => {
    const days = ["2026-09-08", "2026-09-09", "2026-09-10"];
    const allocation = distributeEffort(9, days, 4);

    assert.equal(allocation.length, 3);
    const sum = allocation.reduce((acc, a) => acc + a.hours, 0);
    assert.equal(Math.round(sum), 9);
  });

  test("buildWorkSchedule splits subtasks into reasonable session blocks", () => {
    const subtasks = [
      { title: "Design Architecture", effort_hours: 3 },
      { title: "Build Database", effort_hours: 2 },
    ];
    const deadline = "2026-09-15";
    const sessions = buildWorkSchedule(subtasks, deadline, "2026-09-08");

    assert.ok(sessions.length >= 2, "Should create multiple sessions");
    for (const session of sessions) {
      assert.ok(session.duration_minutes >= 30 && session.duration_minutes <= 120);
      assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(session.scheduled_date));
    }
  });
});

describe("Phase 3: Risk Assessment Algorithm Tests", () => {
  test("Calculates low risk for comfortable deadline and no missed sessions", () => {
    const futureDeadline = addDays(new Date(), 10);
    const result = calculateRiskScore({
      deadline: futureDeadline,
      totalEffortHours: 4,
      completedEffortHours: 1,
      sessions: [
        { scheduled_date: format(addDays(new Date(), 1), "yyyy-MM-dd"), duration_minutes: 60, status: "completed" },
        { scheduled_date: format(addDays(new Date(), 2), "yyyy-MM-dd"), duration_minutes: 60, status: "scheduled" },
      ],
    });

    assert.ok(result.score >= 0.0 && result.score <= 1.0);
    assert.equal(result.level, "on_track");
    assert.ok(result.score < 0.5);
  });

  test("Calculates high risk for imminent deadline and missed sessions", () => {
    // Deadline in 3 hours with 8 hours of remaining effort and 2 missed sessions
    const tightDeadline = new Date(Date.now() + 3 * 3600 * 1000);
    const result = calculateRiskScore({
      deadline: tightDeadline,
      totalEffortHours: 8,
      completedEffortHours: 0,
      sessions: [
        { scheduled_date: format(new Date(), "yyyy-MM-dd"), duration_minutes: 120, status: "missed" },
        { scheduled_date: format(new Date(), "yyyy-MM-dd"), duration_minutes: 120, status: "missed" },
        { scheduled_date: format(new Date(), "yyyy-MM-dd"), duration_minutes: 120, status: "scheduled" },
      ],
    });

    assert.ok(result.score >= 0.7, `Expected score to be high, got ${result.score}`);
    assert.ok(result.score <= 1.0);
    assert.ok(result.level === "at_risk" || result.level === "warning");
  });

  test("Detects bottleneck days with >= 3 hours (180 mins) of work", () => {
    const date1 = "2026-09-08";
    const date2 = "2026-09-09";
    const result = calculateRiskScore({
      deadline: addDays(new Date(), 5),
      totalEffortHours: 10,
      sessions: [
        { scheduled_date: date1, duration_minutes: 120, status: "scheduled" },
        { scheduled_date: date1, duration_minutes: 90, status: "scheduled" }, // total 210m >= 180m -> bottleneck!
        { scheduled_date: date2, duration_minutes: 60, status: "scheduled" },
      ],
    });

    assert.deepEqual(result.bottleneckDays, [date1]);
  });

  test("getRiskLevel maps scores accurately", () => {
    assert.equal(getRiskLevel(0.2), "on_track");
    assert.equal(getRiskLevel(0.49), "on_track");
    assert.equal(getRiskLevel(0.5), "warning");
    assert.equal(getRiskLevel(0.79), "warning");
    assert.equal(getRiskLevel(0.8), "at_risk");
    assert.equal(getRiskLevel(1.0), "at_risk");
  });
});

describe("Phase 3: Formatting Utilities Tests", () => {
  test("formatRelativeDate formats accurately", () => {
    const now = new Date();
    assert.equal(formatRelativeDate(now, now), "Due today");
    assert.equal(formatRelativeDate(addDays(now, 1), now), "Due tomorrow");
    assert.equal(formatRelativeDate(addDays(now, 4), now), "4 days left");
    assert.equal(formatRelativeDate(subDays(now, 1), now), "Overdue by 1 day");
    assert.equal(formatRelativeDate(subDays(now, 3), now), "Overdue by 3 days");
  });

  test("formatDuration formats minutes into clean strings", () => {
    assert.equal(formatDuration(45), "45m");
    assert.equal(formatDuration(60), "1h");
    assert.equal(formatDuration(90), "1h 30m");
    assert.equal(formatDuration(125), "2h 5m");
    assert.equal(formatDuration(0), "0m");
  });

  test("formatRiskLabel matches risk levels with emojis", () => {
    assert.equal(formatRiskLabel(0.2), "On Track ✅");
    assert.equal(formatRiskLabel(0.6), "Warning ⚠️");
    assert.equal(formatRiskLabel(0.85), "At Risk 🔴");
  });
});

describe("Phase 3: Zod Schemas Validation Tests", () => {
  test("SubtaskSchema validates correctly and rejects invalid shapes", () => {
    const valid = { title: "Draft schema", description: "Write Prisma or SQL", sequence: 1 };
    assert.ok(SubtaskSchema.parse(valid));

    assert.throws(() => SubtaskSchema.parse({ title: "", sequence: 1 }));
    assert.throws(() => SubtaskSchema.parse({ title: "Valid", sequence: -1 }));
  });

  test("EffortEstimateSchema enforces min 1 and max 40 hours", () => {
    assert.ok(EffortEstimateSchema.parse({ subtask_title: "Build API", effort_hours: 5 }));
    assert.throws(() => EffortEstimateSchema.parse({ subtask_title: "Build API", effort_hours: 0 }));
    assert.throws(() => EffortEstimateSchema.parse({ subtask_title: "Build API", effort_hours: 50 }));
  });

  test("SessionSchema enforces YYYY-MM-DD date format", () => {
    assert.ok(
      SessionSchema.parse({
        scheduled_date: "2026-09-08",
        subtask_title: "UI Design",
        duration_minutes: 60,
      })
    );

    assert.throws(() =>
      SessionSchema.parse({
        scheduled_date: "09/08/2026",
        subtask_title: "UI Design",
        duration_minutes: 60,
      })
    );
  });

  test("RiskAssessmentSchema enforces score bounds between 0 and 1", () => {
    assert.ok(
      RiskAssessmentSchema.parse({
        risk_score: 0.45,
        risk_reason: "On track with buffer",
        bottleneck_days: [],
      })
    );

    assert.throws(() =>
      RiskAssessmentSchema.parse({
        risk_score: 1.5,
        risk_reason: "Invalid",
        bottleneck_days: [],
      })
    );
  });

  test("CreateTaskSchema and UpdateSessionSchema validate properly", () => {
    assert.ok(
      CreateTaskSchema.parse({
        title: "Build Launch Page",
        deadline: new Date().toISOString(),
      })
    );

    assert.ok(UpdateSessionSchema.parse({ status: "completed" }));
    assert.ok(UpdateSessionSchema.parse({ status: "missed" }));
    assert.throws(() => UpdateSessionSchema.parse({ status: "invalid_status" }));
  });
});

describe("Phase 3: Core Agent Loop & Tool Handlers Integration Tests", () => {
  // Mock Supabase client that records database mutations in memory
  function createMockSupabase() {
    const tables: Record<string, any[]> = {
      tasks: [
        {
          id: "task-mock-123",
          user_id: "user-mock-456",
          title: "Build Mobile Dashboard",
          description: "Responsive dark-mode dashboard with charts",
          deadline: addDays(new Date(), 5).toISOString(),
          status: "pending",
          total_effort_hours: 0,
          completed_effort_hours: 0,
          risk_score: 0,
          priority: 99,
        },
      ],
      subtasks: [],
      sessions: [],
      agent_logs: [],
    };

    return {
      from(table: string) {
        return {
          select(query = "*") {
            const self = this;
            return {
              eq(col: string, val: any) {
                const results = (tables[table] || []).filter((row) => row[col] === val);
                return {
                  data: results,
                  error: null,
                  single: async () => ({ data: results[0] || null, error: null }),
                  then: (resolve: any) => resolve({ data: results, error: null }),
                };
              },
              single: async () => ({
                data: (tables[table] || [])[0] || null,
                error: null,
              }),
            };
          },
          insert(records: any | any[]) {
            const arr = Array.isArray(records) ? records : [records];
            for (const r of arr) {
              const recordWithId = { id: `mock-${Date.now()}-${Math.random()}`, ...r };
              (tables[table] = tables[table] || []).push(recordWithId);
            }
            return {
              select: () => ({
                data: arr,
                error: null,
              }),
              then: (resolve: any) => resolve({ data: arr, error: null }),
            };
          },
          update(updates: Record<string, any>) {
            const builder: any = {
              eq(col: string, val: any) {
                const rows = tables[table] || [];
                for (const row of rows) {
                  if (row[col] === val) {
                    Object.assign(row, updates);
                  }
                }
                return builder;
              },
              then: (resolve: any) => resolve({ data: tables[table] || [], error: null }),
            };
            return builder;
          },
          delete() {
            const builder: any = {
              eq(col: string, val: any) {
                tables[table] = (tables[table] || []).filter((row) => row[col] !== val);
                return builder;
              },
              then: (resolve: any) => resolve({ error: null }),
            };
            return builder;
          },
        };
      },
      _getTables: () => tables,
    };
  }

  test("Tool Handlers execute and persist to database tables", async () => {
    const mockSupabase = createMockSupabase();
    const taskId = "task-mock-123";
    const userId = "user-mock-456";

    // 1. break_into_subtasks
    const subtaskRes = await toolHandlers.break_into_subtasks(
      {
        title: "Build Mobile Dashboard",
        deadline: addDays(new Date(), 5).toISOString(),
      },
      {
        taskId,
        userId,
        supabase: mockSupabase as any,
        stepNumber: 1,
        agentMode: "plan",
      }
    );
    assert.ok((subtaskRes as any).subtasks.length > 0);
    assert.ok(mockSupabase._getTables().subtasks.length > 0);

    // 2. estimate_effort
    const effortRes = await toolHandlers.estimate_effort(
      {
        subtasks: (subtaskRes as any).subtasks,
      },
      {
        taskId,
        userId,
        supabase: mockSupabase as any,
        stepNumber: 2,
        agentMode: "plan",
      }
    );
    assert.ok((effortRes as any).estimates.length > 0);
    assert.ok(mockSupabase._getTables().tasks[0].total_effort_hours > 0);

    // 3. calculate_schedule
    const scheduleRes = await toolHandlers.calculate_schedule(
      {
        subtasks: (effortRes as any).estimates.map((e: any) => ({
          title: e.subtask_title,
          effort_hours: e.effort_hours,
        })),
        deadline: addDays(new Date(), 5).toISOString(),
      },
      {
        taskId,
        userId,
        supabase: mockSupabase as any,
        stepNumber: 3,
        agentMode: "plan",
      }
    );
    assert.ok((scheduleRes as any).sessions.length > 0);
    assert.ok(mockSupabase._getTables().sessions.length > 0);

    // 4. assess_risk
    const riskRes = await toolHandlers.assess_risk(
      {
        deadline: addDays(new Date(), 5).toISOString(),
      },
      {
        taskId,
        userId,
        supabase: mockSupabase as any,
        stepNumber: 4,
        agentMode: "plan",
      }
    );
    assert.ok(typeof (riskRes as any).risk_score === "number");
    assert.ok(mockSupabase._getTables().agent_logs.length >= 4);
  });

  test("runAgent in 'plan' mode executes full loop, logs real-time steps, and activates task", async () => {
    const mockSupabase = createMockSupabase();
    const taskId = "task-mock-123";
    const userId = "user-mock-456";

    const result = await runAgent({
      mode: "plan",
      taskId,
      userId,
      taskData: {
        title: "Launch Marketing Funnel",
        deadline: addDays(new Date(), 7).toISOString(),
      },
      supabaseClient: mockSupabase as any,
    });

    assert.equal(result.success, true);
    assert.equal(result.mode, "plan");
    assert.ok(result.summary.length > 0);
    assert.ok(result.steps.length >= 4);
    assert.ok(result.iterations <= 10, "Iterations must not exceed 10");

    // Verify task status was transitioned to 'active'
    const updatedTask = mockSupabase._getTables().tasks[0];
    assert.equal(updatedTask.status, "active");

    // Verify agent logs were written
    const logs = mockSupabase._getTables().agent_logs;
    assert.ok(logs.length >= 5, "Should have tool logs and completion log");
  });

  test("runAgent in 'renegotiate' mode rebalances plan and updates risk", async () => {
    const mockSupabase = createMockSupabase();
    const taskId = "task-mock-123";
    const userId = "user-mock-456";

    const result = await runAgent({
      mode: "renegotiate",
      taskId,
      userId,
      taskData: {
        title: "Build Mobile Dashboard",
        deadline: addDays(new Date(), 3).toISOString(),
        missedSessionId: "session-missed-999",
      },
      supabaseClient: mockSupabase as any,
    });

    assert.equal(result.success, true);
    assert.equal(result.mode, "renegotiate");
    assert.ok(result.summary.includes("Renegotiated"));
  });

  test("runAgent in 'brief' and 'prioritize' modes complete smoothly", async () => {
    const mockSupabase = createMockSupabase();
    const taskId = "task-mock-123";
    const userId = "user-mock-456";

    const briefResult = await runAgent({
      mode: "brief",
      taskId,
      userId,
      taskData: {
        title: "Daily Standup Task",
        deadline: addDays(new Date(), 1).toISOString(),
      },
      supabaseClient: mockSupabase as any,
    });
    assert.equal(briefResult.success, true);

    const prioritizeResult = await runAgent({
      mode: "prioritize",
      taskId,
      userId,
      taskData: {
        tasks: [
          { task_id: taskId, title: "Task 1", deadline: addDays(new Date(), 1).toISOString(), risk_score: 0.8 },
          { task_id: "task-2", title: "Task 2", deadline: addDays(new Date(), 5).toISOString(), risk_score: 0.2 },
        ],
      },
      supabaseClient: mockSupabase as any,
    });
    assert.equal(prioritizeResult.success, true);
    assert.ok(prioritizeResult.summary.includes("Prioritized"));
  });
});
