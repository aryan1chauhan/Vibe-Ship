# CrunchAI Agent Architecture

CrunchAI is not one AI model doing everything. It's a pipeline of cooperating components, each with a single responsibility.

```
                USER
                  │
                  ▼
          1. Trigger Layer           ← API routes (app/api/*)
                  │
                  ▼
        2. Agent Orchestrator        ← lib/agent/orchestrator.ts
                  │
                  ▼
      3. Reasoning Loop (Gemini)     ← lib/agent/reasoning.ts
         ▲                 │
         │                 ▼
   Tool Results      Tool Calls
         ▲                 │
         └────────┬────────┘
                  ▼
            4. Tool Layer            ← lib/agent/tools.ts
                  │
                  ▼
      5. Validation Layer            ← lib/agent/validation.ts
                  │
                  ▼
  6. Deterministic Business Logic    ← lib/agent/scheduling.ts
                  │
                  ▼
      7. Persistence (Supabase)      ← lib/agent/persistence.ts
                  │
                  ▼
   8. Realtime/Event Notification    ← lib/agent/events.ts
                  │
                  ▼
              Frontend
```

---

## Component Reference

### 1. Trigger Layer — `app/api/*`

Answers: **Why is the agent waking up?**

| Trigger | Route | Method |
|---------|-------|--------|
| User creates task | `/api/tasks` | POST |
| User requests plan | `/api/agent/plan` | POST |
| User requests replan | `/api/agent/replan` | POST |
| User marks session missed | `/api/sessions/[id]` | PATCH |
| User requests daily brief | `/api/agent/brief` | GET |
| User fetches today's sessions | `/api/sessions/today` | GET |

Each trigger authenticates the user, loads preferences, and calls `after(() => runAgentLoop(...))` for background execution.

### 2. Agent Orchestrator — `lib/agent/orchestrator.ts`

The conductor. It coordinates but does not think.

```
Task received → Init memory → Emit thinking_start
  → If replan: mark missed sessions, load existing subtasks
  → If subtasks needed: Gemini reasoning loop
  → Else: deterministic recalculation
  → Validate plan (retry once if invalid)
  → If still invalid: mark needs_review, stop
  → Save plan to Supabase
  → Emit thinking_complete
```

Exports: `runAgentLoop()`, `runReplanLoop()`

### 3. Reasoning Loop — `lib/agent/reasoning.ts`

Gemini decides **what should happen next**. Not calculations. Decisions.

- Starts a multi-turn chat with `AGENT_SYSTEM_PROMPT`
- Gemini calls tools: `break_into_subtasks` → `estimate_effort` (per subtask) → `calculate_schedule` → `assess_risk`
- Each tool result flows back into the chat for the next decision
- **Stop condition**: no more tool calls OR 10 iterations max

### 4. Tool Layer — `lib/agent/tools.ts` + `lib/agent/tool-schemas.ts`

Gemini cannot access the backend directly. It requests tools.

**`tool-schemas.ts`** — Gemini function declarations (what tools exist and their parameters)

**`tools.ts`** — Implementations + dispatcher:
- `breakIntoSubtasks()` — Gemini structured output → subtask titles
- `estimateEffort()` — Gemini structured output → minutes estimate
- `assessRisk()` — Gemini structured output → risk level + reason
- `prioritizeTasks()` — Gemini structured output → urgency ranking
- `executeTool(name, args, memory)` — routes tool calls to the right function, updates memory

### 5. Validation Layer — `lib/agent/validation.ts`

The quality inspector. Runs after the AI produces data, before it's trusted.

Checks:
- ✔ Do subtasks have valid UUIDs?
- ✔ Are estimated_minutes in range (5–480)?
- ✔ Do sessions reference real subtask IDs?
- ✔ Are sessions within work hours?
- ✔ Is risk level a valid enum?
- ✔ Is risk reason present?

If validation fails twice → task marked `needs_review`, no corrupt data written.

### 6. Deterministic Business Logic — `lib/agent/scheduling.ts`

Pure functions. One correct answer. Code > LLM here.

- `calculateSchedule()` — packs subtasks into time slots within work hours
- `rebalancePlan()` — merges missed + remaining subtasks, recalculates

No AI, no database, no side effects.

### 7. Persistence — `lib/agent/persistence.ts`

Every Supabase read/write in one place:

- `loadTask()` — fetch task by ID
- `clearPreviousEvents()` — wipe old agent events for fresh plan
- `markMissedSessions()` — detect past-due sessions, mark as missed
- `deletePendingSessions()` — remove future planned sessions before replan
- `loadExistingSubtasks()` — fetch subtasks for replan mode
- `savePlan()` — write subtasks + sessions + task status
- `markNeedsReview()` — flag task as needing human review

### 8. Event/Notification Layer — `lib/agent/events.ts`

Backend finishes → database updated → Supabase Realtime → React updates instantly.

`createEventEmitter(supabase, userId, taskId)` returns `{ emit(type, tool?, payload?) }`

Events broadcast via `agent_events` table (added to `supabase_realtime` publication).

### 9. Agent Working Memory — `lib/agent/memory.ts`

Not conversation memory. Working memory for one agent run.

```typescript
interface AgentMemory {
  task: Task;
  userPrefs: UserPrefs;
  mode: 'plan' | 'replan';
  subtasks: SubtaskEntry[];       // filled by break_into_subtasks or loaded from DB
  sessions: ScheduledSession[];   // filled by calculate_schedule
  riskAssessment: RiskAssessment; // filled by assess_risk
}
```

Without this, the agent would repeat work or lose track of what it's already produced.

### 10. Stop Condition — inside `lib/agent/reasoning.ts`

Every agent needs to know "when am I done?"

- ✔ Gemini returns no tool calls → plan is complete
- ✔ 10 iterations reached → force stop
- ✔ Validation fails twice → halt with `needs_review`
- ✔ Exception thrown → caught by orchestrator, logged as error event

---

## Shared Types — `lib/agent/types.ts`

Agent-internal types: `SubtaskEntry`, `ScheduledSession`, `RiskAssessment`, `ValidationResult`, `PrioritizedTask`, `UserPrefs`, `AgentContext`, `AgentLoopOptions`.

## Barrel Export — `lib/agent/index.ts`

Re-exports `runAgentLoop` and `runReplanLoop` from orchestrator. API routes import from `@/lib/agent` without knowing about the internal structure.

---

## Key Mental Model

| Component | Responsibility | Owns |
|-----------|---------------|------|
| Trigger | Why is the agent waking up? | HTTP request handling |
| Orchestrator | Coordinate the pipeline | Control flow only |
| Reasoning | What should happen next? | Gemini chat loop |
| Tools | Execute what Gemini requests | Gemini-backed functions |
| Validation | Is this data sane? | Pre-write checks |
| Scheduling | Deterministic calculations | Date math, slot packing |
| Persistence | Read/write state | All Supabase operations |
| Events | Notify the frontend | Realtime broadcasting |
| Memory | In-flight state | One run's working data |
| Stop Condition | When is the agent done? | Loop termination |

Gemini decides. Tools execute. Code calculates. Validation checks. Supabase stores. Realtime notifies.
