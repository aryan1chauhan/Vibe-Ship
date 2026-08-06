# CrunchAI — Edge Cases & Corner Scenarios

> Comprehensive catalog of edge cases, failure modes, and corner scenarios derived from the [architecture](file:///c:/Users/ARYAN/vibe-ship/crunchai/docs/architecture.md) and [implementation plan](file:///c:/Users/ARYAN/vibe-ship/crunchai/docs/implementation-plan.md).
>
> Each entry includes: **scenario**, **expected behavior**, **severity**, and **handling strategy**.

---

## Table of Contents

1. [Authentication & Sessions](#1-authentication--sessions)
2. [Gemini Agent Engine](#2-gemini-agent-engine)
3. [Task Lifecycle](#3-task-lifecycle)
4. [Subtask Generation](#4-subtask-generation)
5. [Schedule Calculation](#5-schedule-calculation)
6. [Auto-Renegotiation](#6-auto-renegotiation)
7. [Risk Detection](#7-risk-detection)
8. [Focus Mode](#8-focus-mode)
9. [Daily Brief](#9-daily-brief)
10. [Task Prioritization](#10-task-prioritization)
11. [Supabase Realtime](#11-supabase-realtime)
12. [Database & RLS](#12-database--rls)
13. [API Routes & Validation](#13-api-routes--validation)
14. [UI/UX Edge Cases](#14-uiux-edge-cases)
15. [Concurrency & Race Conditions](#15-concurrency--race-conditions)
16. [Deployment & Environment](#16-deployment--environment)

---

## 1. Authentication & Sessions

| # | Scenario | Severity | Expected Behavior | Handling Strategy |
|---|---|---|---|---|
| 1.1 | User's Google account is suspended/deleted after sign-up | High | Auth token refresh fails silently | Catch `AuthSessionMissingError`, redirect to `/login` with "Session expired" toast |
| 1.2 | OAuth callback receives an expired or tampered `code` param | Medium | `exchangeCodeForSession()` throws | Redirect to `/login` with "Authentication failed" error message |
| 1.3 | User opens app in two tabs, signs out in one | Medium | Other tab still shows dashboard | `onAuthStateChange('SIGNED_OUT')` listener triggers redirect in all tabs |
| 1.4 | OAuth callback URL is bookmarked and revisited | Low | Stale code param, exchange fails | Redirect to `/login` gracefully, no crash |
| 1.5 | Profile sync trigger fails (DB constraint violation) | High | User authenticated but no profile row | Middleware checks for profile existence; if missing, re-run `handle_new_user()` or show onboarding |
| 1.6 | User revokes Google OAuth consent from Google account settings | Medium | Next token refresh fails | Detect on next `getUser()` call, clear session, redirect to login |
| 1.7 | Concurrent sign-in from multiple devices | Low | Multiple valid sessions created | Supabase handles this natively; all sessions valid until expiry |
| 1.8 | Middleware cookie parsing fails (corrupted cookie) | Medium | Auth check throws | Catch error, clear cookies, redirect to `/login` |
| 1.9 | User's email changes on Google side after sign-up | Low | Profile email becomes stale | Do NOT auto-update email on subsequent logins; email is immutable after profile creation, or sync on `SIGNED_IN` event |
| 1.10 | OAuth popup blocked by browser | Medium | Sign-in flow never completes | Use redirect flow (`signInWithOAuth`) instead of popup; show "popup blocked" fallback message |

---

## 2. Gemini Agent Engine

| # | Scenario | Severity | Expected Behavior | Handling Strategy |
|---|---|---|---|---|
| 2.1 | Gemini API returns 429 (rate limited) | High | Agent loop halts mid-plan | Exponential backoff with max 3 retries; if still failing, log error to `agent_logs`, set task status to `pending`, show "Agent busy, retrying..." |
| 2.2 | Gemini API returns 500/503 (server error) | High | Agent cannot function | Retry once after 2s; if still failing, mark agent_log as `error`, show "AI service temporarily unavailable" |
| 2.3 | Gemini returns malformed function call args | High | Zod validation fails | Catch `ZodError`, send error feedback to Gemini as tool result: `"Error: invalid arguments, please try again"`, allow 1 retry |
| 2.4 | Gemini enters infinite function-calling loop | Critical | Agent never terminates | Hard cap at 10 iterations; after limit, force stop, log warning, return partial results |
| 2.5 | Gemini calls a tool that doesn't exist | Medium | `toolHandlers[name]` is undefined | Return error to Gemini: `"Unknown tool: {name}. Available tools are: ..."`, continue loop |
| 2.6 | Gemini returns empty response (no text, no function call) | Medium | Agent hangs | Detect empty response, treat as termination signal, return "Agent completed with no summary" |
| 2.7 | Gemini API key is missing or invalid | Critical | All agent features non-functional | Check at server startup; return 503 from all `/api/agent/*` routes with "AI service not configured" |
| 2.8 | Gemini returns function call with `null` or `undefined` args | Medium | Tool handler crashes | Default to empty object `{}`; Zod validation will catch missing required fields |
| 2.9 | Network timeout to Gemini API (>30s) | High | Agent hangs, user sees spinner forever | Set `AbortController` with 30s timeout on fetch; abort → log error → show timeout message |
| 2.10 | Gemini returns extremely large response (>1MB) | Low | Memory pressure on serverless function | Truncate response to first 100KB before storing in `agent_logs.tool_output` |
| 2.11 | Multiple agent runs triggered simultaneously for same task | High | Race condition: conflicting subtasks/sessions | Use a per-task lock (DB advisory lock or `agent_running` flag on task); reject second request with 409 Conflict |
| 2.12 | Gemini responds with text instead of expected function call | Medium | Agent terminates prematurely | Accept text response as valid termination; log it as summary; if no subtasks created, warn user "Agent couldn't plan this task" |

---

## 3. Task Lifecycle

| # | Scenario | Severity | Expected Behavior | Handling Strategy |
|---|---|---|---|---|
| 3.1 | Deadline is in the past at creation time | High | Schedule impossible to calculate | Zod validation rejects: `deadline must be in the future` |
| 3.2 | Deadline is less than 1 hour away | Medium | Not enough time for meaningful planning | Allow creation but agent `assess_risk` returns `risk_score: 1.0`; show warning "Extremely tight deadline" |
| 3.3 | Task title is empty or whitespace-only | Medium | Meaningless task created | Zod validation: `title.trim().min(1)` |
| 3.4 | Task title is extremely long (>500 chars) | Low | UI overflow, DB bloat | Zod validation: `title.max(200)` |
| 3.5 | Task description contains malicious HTML/script | High | XSS attack | React auto-escapes JSX; additionally sanitize on API input |
| 3.6 | User creates 100+ tasks simultaneously | Medium | DB and agent overload | Rate limit `POST /api/tasks` to 5 req/min; queue agent planning calls |
| 3.7 | User deletes a task while agent is still planning it | High | Agent writes to deleted task → FK constraint violation | Check task existence before each DB write in tool handler; if deleted, abort agent loop |
| 3.8 | Task status transitions: invalid state changes | Medium | e.g., `completed` → `pending` | Enforce valid transitions: `pending→active`, `active→completed|at_risk|overdue`, `at_risk→active|completed` |
| 3.9 | Deadline is extended after planning is complete | Medium | Existing schedule may have unused buffer days | Re-trigger `calculate_schedule` and `assess_risk`; update sessions |
| 3.10 | Deadline is moved earlier after planning | High | Existing schedule may extend beyond new deadline | Auto-trigger renegotiation with tighter constraint; may result in `deadline_achievable: false` |
| 3.11 | User modifies task title/description after subtasks are generated | Low | Subtasks may no longer match | Show "Re-plan?" prompt; don't auto-invalidate existing plan |
| 3.12 | Task with no description provided | Low | Gemini has less context for subtask generation | Pass title-only to agent; Gemini will do its best with available info |

---

## 4. Subtask Generation

| # | Scenario | Severity | Expected Behavior | Handling Strategy |
|---|---|---|---|---|
| 4.1 | Gemini generates 0 subtasks | High | No work to schedule | Retry once with a more explicit prompt; if still 0, create 1 default subtask matching the task title |
| 4.2 | Gemini generates 50+ subtasks for a simple task | Medium | Excessive granularity | Cap at 20 subtasks; if Gemini returns more, take the first 20 and log a warning |
| 4.3 | Subtask titles are duplicated | Low | Confusing for the user | De-duplicate by appending suffix: "Research (1)", "Research (2)" |
| 4.4 | Subtask effort estimate is 0 hours | Medium | Session with 0 duration created | Enforce minimum 1 hour in Zod schema: `effort_hours.min(1)` |
| 4.5 | Subtask effort estimates sum to more hours than days available | High | Schedule is physically impossible | `assess_risk` flags this as `risk_score: 1.0`; show "Not enough time" warning with suggestion to extend deadline |
| 4.6 | Gemini generates subtasks in wrong language | Low | User sees non-English text | System prompt specifies English output; if detected, retry with explicit language instruction |
| 4.7 | Subtask description contains Gemini hallucinated details | Medium | Misleading subtask content | Can't fully prevent; user can edit/delete subtasks; consider adding "AI-generated" badge |
| 4.8 | Subtask `sequence` values have gaps or duplicates | Low | Display order is unpredictable | Normalize sequence values to 1, 2, 3... on insert |

---

## 5. Schedule Calculation

| # | Scenario | Severity | Expected Behavior | Handling Strategy |
|---|---|---|---|---|
| 5.1 | Deadline is on a weekend | Medium | `getWorkingDays()` might exclude the deadline day | Include deadline day regardless of weekend status; let user decide |
| 5.2 | All days between now and deadline are weekends/holidays | High | Zero working days available | Fall back to including weekends; show "Weekend work required" warning |
| 5.3 | Total effort exceeds available working hours (8h/day assumption) | High | Sessions overflow daily capacity | Cap sessions at 8h/day; spread overflow to additional days; flag risk if insufficient days |
| 5.4 | Only 1 day until deadline | High | All effort compressed into one day | Allow but show "Crunch day!" warning; `risk_score` will be high |
| 5.5 | User has sessions from multiple tasks on the same day | Medium | Conflicting sessions, over-scheduled day | `calculate_schedule` should check existing sessions for the user; `getAvailableHours()` accounts for all tasks |
| 5.6 | Deadline is exactly now (same minute) | High | Effectively impossible | Reject: "Deadline must be at least 1 hour in the future" |
| 5.7 | Timezone mismatch between user and server | Medium | Sessions scheduled on wrong dates | Store all timestamps in UTC; convert to user's timezone for display only |
| 5.8 | Daylight saving time transition during schedule period | Low | Day calculation off by 1 hour | Use `date-fns` with timezone-aware functions; DST doesn't affect date-level scheduling |
| 5.9 | Session `duration_minutes` is not a round number | Low | Awkward timer display | Round to nearest 5 minutes on creation |
| 5.10 | Schedule spans more than 90 days | Low | Very long timeline, lots of sessions | Warn user; cap schedule display to 30 days at a time with pagination |

---

## 6. Auto-Renegotiation

| # | Scenario | Severity | Expected Behavior | Handling Strategy |
|---|---|---|---|---|
| 6.1 | User misses ALL remaining sessions | Critical | Nothing left to reschedule | Agent sets `deadline_achievable: false`, task status → `overdue`, show "Deadline cannot be met" message |
| 6.2 | User misses a session, then misses the renegotiated session too | High | Cascade of renegotiations | Allow up to 3 consecutive renegotiations per task; after that, notify user "Multiple sessions missed, please review your plan" |
| 6.3 | Renegotiation runs while a focus session is active | High | Schedule changes under active timer | Don't renegotiate sessions with status `in_progress`; only renegotiate future `scheduled` sessions |
| 6.4 | Missed session is the last session before deadline | High | No days left to reschedule | Agent should attempt to add sessions on remaining hours of deadline day or mark as unachievable |
| 6.5 | Renegotiation creates sessions on days user already has other task sessions | Medium | Over-scheduled days | Check cross-task session conflicts; cap daily hours at 8h |
| 6.6 | Two renegotiations trigger simultaneously (race condition) | High | Duplicate sessions created | Lock mechanism: check `agent_logs` for running `renegotiate` mode; reject second request |
| 6.7 | Renegotiation after task is already completed | Low | Unnecessary agent run | Check task status before renegotiation; skip if `completed` |
| 6.8 | Gemini `rebalance_plan` drops critical subtasks | High | Important work silently removed | Show dropped subtasks prominently in UI; require user acknowledgment |
| 6.9 | Network failure during renegotiation (partial write) | High | Some old sessions deleted, new ones not created | Wrap in transaction: delete old + insert new atomically; rollback on failure |
| 6.10 | Session marked as "missed" retroactively (past date) | Medium | Agent tries to schedule on past dates | Filter `getWorkingDays()` to only include today and future dates |

---

## 7. Risk Detection

| # | Scenario | Severity | Expected Behavior | Handling Strategy |
|---|---|---|---|---|
| 7.1 | Task has 0 sessions (planning hasn't run yet) | Medium | Division by zero in `completed_sessions / total_sessions` | Return `risk_score: 0.0` if no sessions exist; risk is undefined until planned |
| 7.2 | `hours_until_deadline` is negative (overdue task) | High | Negative time pressure ratio | Clamp to `risk_score: 1.0`; set status to `overdue` |
| 7.3 | All sessions completed but task not marked complete | Low | Risk score misleadingly high | If `completed_effort >= total_effort`, force `risk_score: 0.0` and status → `completed` |
| 7.4 | Task has no deadline (null/undefined) | High | Risk calculation impossible | Deadline is required (Zod validation); this shouldn't happen, but default `risk_score: 0.5` as fallback |
| 7.5 | Risk score oscillates between 0.79 and 0.81 (threshold boundary) | Low | Task flickers between `active` and `at_risk` status | Add hysteresis: require 2 consecutive readings above/below threshold before changing status |
| 7.6 | `total_effort_hours` is null (agent hasn't estimated yet) | Medium | Risk formula breaks | Default to `risk_score: 0.5` with reason "Effort not yet estimated" |
| 7.7 | Bottleneck days calculation when there are no remaining days | Medium | Empty array, division by zero | If `remaining_days = 0`, bottleneck factor = 1.0 (maximum risk) |

---

## 8. Focus Mode

| # | Scenario | Severity | Expected Behavior | Handling Strategy |
|---|---|---|---|---|
| 8.1 | User closes browser tab during active focus session | High | Timer state lost, session neither completed nor missed | On next visit, detect sessions with `started_at` but no `completed_at`; show "You had an incomplete session" prompt |
| 8.2 | Timer reaches 0:00 but user takes no action | Medium | Session hangs indefinitely | Auto-prompt after timer ends: "Did you complete this session?" with Complete/Miss buttons; auto-miss after 10 min of inactivity |
| 8.3 | User starts focus mode with no `sessionId` in URL | Medium | No session to track | Show session picker: list today's scheduled sessions to choose from |
| 8.4 | `sessionId` in URL points to a completed/missed session | Low | Can't re-do a session | Show "This session is already completed/missed" message; offer to start next scheduled session |
| 8.5 | `sessionId` in URL points to another user's session | High | Security: cross-user data access | RLS blocks the query; show "Session not found" |
| 8.6 | `sessionId` in URL is invalid UUID | Low | DB query fails | Validate UUID format before query; show "Invalid session" |
| 8.7 | User's device goes to sleep during focus session | Medium | `setInterval` stops ticking | On wake, recalculate remaining time from `started_at` + `duration_minutes` vs. current time |
| 8.8 | Focus session duration is 0 minutes | Medium | Timer starts at 0:00 | Enforce minimum 5-minute session duration in schedule calculation |
| 8.9 | User clicks Complete/Miss rapidly (double submit) | Medium | Duplicate API calls | Disable buttons after first click; use TanStack mutation's `isPending` state |
| 8.10 | Browser notification permission denied | Low | No "session starting" reminders | Gracefully degrade; rely on in-app upcoming sessions list only |
| 8.11 | User opens focus mode on mobile device | Low | Full-screen layout may not work well | Ensure responsive design; use `dvh` units; hide address bar |
| 8.12 | Multiple focus sessions opened in different tabs | Medium | Both timers running for different sessions | Detect via `BroadcastChannel` API; show "Focus session active in another tab" |

---

## 9. Daily Brief

| # | Scenario | Severity | Expected Behavior | Handling Strategy |
|---|---|---|---|---|
| 9.1 | User has no tasks at all | Low | Brief has nothing to report | Return "No tasks yet! Create your first task to get started." |
| 9.2 | User has no sessions scheduled for today | Low | Brief skips "today's focus" section | Brief mentions "No sessions today — rest or get ahead on tomorrow's work" |
| 9.3 | Brief generation takes >10 seconds | Medium | User sees long loading spinner | Show skeleton loader; stream response if possible; cache brief for 30 min |
| 9.4 | Gemini generates a brief that contradicts actual data | Medium | Misleading advice | Always include ground-truth data alongside AI brief: "3 sessions today, 2 at-risk tasks" as factual header |
| 9.5 | Brief requested at 11:59 PM | Low | Brief references "today" but day changes in 1 minute | Pin brief to the date it was generated; show "Generated at 11:59 PM" timestamp |
| 9.6 | User refreshes dashboard rapidly (10x in 1 min) | Medium | Excessive Gemini API calls | TanStack Query `staleTime: 30 * 60 * 1000` (30 min cache); only re-fetch on explicit "Regenerate" click |
| 9.7 | Brief mentions tasks that were just deleted | Low | Stale context | Fetch fresh task data immediately before Gemini call; don't use cached data for brief context |
| 9.8 | Gemini returns brief in markdown with broken formatting | Low | UI renders garbage | Sanitize markdown; wrap in error boundary; show "Could not render brief" fallback |

---

## 10. Task Prioritization

| # | Scenario | Severity | Expected Behavior | Handling Strategy |
|---|---|---|---|---|
| 10.1 | User has only 1 task | Low | Prioritization is trivial | Return single task with `priority: 1`; skip Gemini call, calculate locally |
| 10.2 | Two tasks have identical deadlines and risk scores | Low | Arbitrary priority ordering | Gemini decides; fallback: alphabetical order by title |
| 10.3 | Completed tasks included in prioritization | Low | Wasted Gemini tokens | Filter out `status: completed` before sending to agent |
| 10.4 | Gemini returns priorities that don't match task IDs | High | Priority assignment fails | Validate returned `task_id` values exist in the input set; ignore unmatched entries |
| 10.5 | Gemini assigns duplicate priority numbers | Medium | Ambiguous ranking | Re-number sequentially based on returned order: 1, 2, 3... |
| 10.6 | User manually sets priority, then auto-prioritize runs | Low | User's manual priority overridden | Add `priority_locked` boolean flag; locked tasks keep their manual priority |
| 10.7 | Prioritization triggered during active planning agent | Medium | Priority based on incomplete data | Queue prioritization until active planning finishes |

---

## 11. Supabase Realtime

| # | Scenario | Severity | Expected Behavior | Handling Strategy |
|---|---|---|---|---|
| 11.1 | Realtime connection drops (network issue) | Medium | UI stops updating live | Detect disconnect via channel status callback; show "Live updates paused" banner; auto-reconnect |
| 11.2 | Realtime event arrives for a task the user has navigated away from | Low | Unnecessary state update | Unsubscribe from channels on component unmount; clean up in `useEffect` return |
| 11.3 | Burst of 50+ Realtime events in 1 second (agent rapid logging) | Medium | UI jank from excessive re-renders | Batch updates with `requestAnimationFrame` or debounce `setQueryData` calls (100ms) |
| 11.4 | Realtime delivers events out of order | Medium | Agent log shows steps in wrong sequence | Sort by `step_number` on render, not by arrival order |
| 11.5 | Realtime delivers duplicate events | Low | Duplicate entries in agent log | De-duplicate by `id` before merging into query cache |
| 11.6 | User has 10+ tasks, each with Realtime subscription | Medium | Too many open WebSocket channels | Use a single channel with broader filter (user-level); fan out events client-side |
| 11.7 | Realtime subscription fails due to RLS policy | High | No live updates at all | Verify RLS allows `SELECT` for authenticated user on subscribed tables; test during Phase 2 |
| 11.8 | Supabase free-tier Realtime quota exceeded | High | Realtime stops working | Show fallback: poll API every 5 seconds when Realtime is unavailable |

---

## 12. Database & RLS

| # | Scenario | Severity | Expected Behavior | Handling Strategy |
|---|---|---|---|---|
| 12.1 | RLS policy blocks agent's service role writes | Critical | Agent can't save results | Agent uses `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS; verify during setup |
| 12.2 | Cascading delete removes sessions while focus mode is active | High | Active focus session vanishes | Check for active sessions before allowing task deletion; show confirmation: "This will end your active focus session" |
| 12.3 | `gen_random_uuid()` collision (astronomically unlikely) | Low | Insert fails with duplicate key | PK constraint catches it; retry with new UUID |
| 12.4 | `CHECK` constraint violation on `status` column | Medium | Invalid status value submitted | Zod validation catches this at API layer before it reaches DB |
| 12.5 | Subtask `task_id` references a non-existent task | High | FK constraint violation | Validate `taskId` exists before inserting subtasks; handle FK error gracefully |
| 12.6 | User tries to read data during Supabase maintenance window | Medium | DB queries fail | Catch errors; show "Service temporarily unavailable, please try again" |
| 12.7 | Migration fails partially (e.g., index creation succeeds but RLS fails) | High | Inconsistent schema state | Test migrations in staging first; use transactions in migration files |
| 12.8 | `updated_at` not auto-updating on row modifications | Low | Stale timestamps | Add `BEFORE UPDATE` trigger to set `updated_at = now()` |
| 12.9 | Very large `ai_metadata` JSONB field (>1MB) | Low | Slow queries, storage bloat | Limit JSONB size in application layer; only store essential metadata |
| 12.10 | Concurrent updates to `completed_effort_hours` | High | Lost update: two sessions complete simultaneously | Use atomic increment: `completed_effort_hours = completed_effort_hours + X` instead of read-then-write |

---

## 13. API Routes & Validation

| # | Scenario | Severity | Expected Behavior | Handling Strategy |
|---|---|---|---|---|
| 13.1 | Request body is not valid JSON | Medium | `JSON.parse` throws | Catch `SyntaxError`; return 400: `"Invalid JSON body"` |
| 13.2 | Request body is empty for POST/PUT routes | Medium | Zod parse fails on `undefined` | Return 400: `"Request body is required"` before Zod parse |
| 13.3 | `[id]` param is not a valid UUID | Low | DB query returns null | Validate UUID format with regex or Zod; return 400: `"Invalid task ID format"` |
| 13.4 | User accesses task belonging to another user | High | Data leak | RLS handles this at DB level; API returns empty result, respond with 404 |
| 13.5 | API route handler throws unhandled exception | High | 500 error with stack trace in production | Global error handler wraps all routes; never expose stack traces; log to server only |
| 13.6 | Request exceeds Next.js body size limit (default 1MB) | Low | 413 Payload Too Large | No task/description should be anywhere near 1MB; Zod limits prevent this |
| 13.7 | `Content-Type` header is not `application/json` | Low | Body parsing may fail | Check content-type; return 415 if not JSON for POST/PUT routes |
| 13.8 | API called with expired auth token (edge case between middleware and handler) | Medium | Middleware refreshes but handler reads stale session | Always call `getUser()` in the route handler itself, not just middleware |
| 13.9 | GET request with extraneous query params | Low | Ignored silently | Ignore unknown params; only use documented ones |
| 13.10 | PUT with all optional fields omitted | Low | No-op update | Return 200 with unchanged data; or return 400: "No fields to update" |

---

## 14. UI/UX Edge Cases

| # | Scenario | Severity | Expected Behavior | Handling Strategy |
|---|---|---|---|---|
| 14.1 | Task title overflows card width | Low | Text wraps or truncates | CSS `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;` on card; show full title on hover/tooltip |
| 14.2 | 50+ tasks in list view | Low | Performance degradation, long scroll | Virtualized list with `react-window` or pagination (20 per page) |
| 14.3 | Schedule timeline with 30+ sessions | Low | Very tall component | Collapse past dates by default; show only upcoming sessions; "Show all" toggle |
| 14.4 | Agent log with 100+ entries | Medium | Performance issue, excessive DOM | Virtual scrolling; keep only last 50 entries in DOM; lazy-load older entries |
| 14.5 | User on slow 3G connection | Medium | Long loading times, broken layouts | Skeleton loaders for all async components; optimistic UI updates; compressed assets |
| 14.6 | User with screen reader (a11y) | Medium | Inaccessible interface | Use semantic HTML; ARIA labels on all interactive elements; keyboard navigation; shadcn/ui components are accessible by default |
| 14.7 | Dark mode text contrast issues | Low | Unreadable text | Test all text against WCAG AA contrast ratios (4.5:1 minimum) |
| 14.8 | Mobile sidebar covers content but has no close button | Medium | User trapped in sidebar | Sheet component with overlay click-to-close and close button; swipe gesture on mobile |
| 14.9 | Toast notification appears behind modal dialog | Low | User misses notification | Set toast z-index higher than dialog; or queue toasts to show after dialog closes |
| 14.10 | Browser "Back" button in single-page app | Low | Unexpected navigation | Use Next.js router; ensure proper history entries for all routes |
| 14.11 | User resizes browser window during focus mode | Low | SVG timer layout breaks | Use viewport-relative units (`vw`, `vh`); recalculate on `resize` event |
| 14.12 | Copy-paste into task title inserts rich text/HTML | Low | Encoded HTML in title | Strip HTML tags from input; use `textContent` extraction |

---

## 15. Concurrency & Race Conditions

| # | Scenario | Severity | Expected Behavior | Handling Strategy |
|---|---|---|---|---|
| 15.1 | User creates task and triggers plan simultaneously in two tabs | High | Two planning agents run for same task | DB flag `is_agent_running` on task; second request returns 409 Conflict |
| 15.2 | Session marked as completed while renegotiation is running | High | Renegotiation uses stale session data | Lock sessions for the task during renegotiation; or re-fetch sessions after each tool call |
| 15.3 | User deletes subtask while agent is estimating effort for it | Medium | Agent references non-existent subtask | Agent re-fetches subtask list before each tool call; skip missing subtasks |
| 15.4 | Two API requests update `completed_effort_hours` simultaneously | High | Lost update | Use SQL `UPDATE tasks SET completed_effort_hours = completed_effort_hours + $1` (atomic) |
| 15.5 | Realtime event triggers re-fetch, which triggers mutation, which triggers Realtime event | High | Infinite loop | Break cycle: don't trigger mutations from Realtime-induced state changes; only update local cache |
| 15.6 | Prioritization runs while new task is being created | Medium | New task not included in prioritization | Re-run prioritization after task creation completes |
| 15.7 | User rapidly clicks "Complete" on multiple sessions | Medium | API requests race, inconsistent state | Debounce session updates; use TanStack mutation queue (sequential, not parallel) |

---

## 16. Deployment & Environment

| # | Scenario | Severity | Expected Behavior | Handling Strategy |
|---|---|---|---|---|
| 16.1 | `GEMINI_API_KEY` env var not set in production | Critical | All agent routes crash | Check at build time or server startup; return clear 503 errors from agent routes |
| 16.2 | `SUPABASE_SERVICE_ROLE_KEY` exposed in client bundle | Critical | Full DB access for anyone | Never prefix with `NEXT_PUBLIC_`; audit build output for leaked keys |
| 16.3 | Vercel serverless function cold start takes >5 seconds | Medium | First request to agent is slow | Use Vercel's "Fluid Functions" or pre-warm strategy; show "Warming up..." state in UI |
| 16.4 | Vercel function times out (default 10s for hobby, 60s for pro) | High | Agent planning exceeds timeout | Use Vercel Pro for 60s limit; optimize agent to complete in <30s; consider streaming response |
| 16.5 | Supabase free-tier connection pool exhausted | High | DB queries fail randomly | Connection pooling via Supabase's PgBouncer; use serverless connection string |
| 16.6 | CORS issues when deployed to custom domain | Medium | API calls blocked by browser | Next.js API routes are same-origin; no CORS needed; if using external domain, configure in `next.config.ts` |
| 16.7 | SSL certificate issue on Supabase connection | High | Server-side DB calls fail | Use Supabase's official connection strings which include SSL by default |
| 16.8 | Git push triggers deployment but build fails | Medium | App goes down if previous deployment is replaced | Vercel keeps previous deployment active until new one succeeds (automatic rollback) |
| 16.9 | Environment variable value contains special characters | Low | ENV parsing fails | Wrap values in quotes in `.env.local`; Vercel UI handles this automatically |
| 16.10 | Node.js version mismatch between dev and production | Medium | Code works locally but fails on Vercel | Specify `engines.node` in `package.json`; Vercel uses Node 20.x by default |

---

## Summary Statistics

| Category | Total Edge Cases |
|---|---|
| Authentication & Sessions | 10 |
| Gemini Agent Engine | 12 |
| Task Lifecycle | 12 |
| Subtask Generation | 8 |
| Schedule Calculation | 10 |
| Auto-Renegotiation | 10 |
| Risk Detection | 7 |
| Focus Mode | 12 |
| Daily Brief | 8 |
| Task Prioritization | 7 |
| Supabase Realtime | 8 |
| Database & RLS | 10 |
| API Routes & Validation | 10 |
| UI/UX Edge Cases | 12 |
| Concurrency & Race Conditions | 7 |
| Deployment & Environment | 10 |
| **Total** | **153** |

---

## Priority Matrix

| Severity | Count | Action |
|---|---|---|
| **Critical** | 6 | Must fix before launch — system non-functional or security risk |
| **High** | 45 | Fix during development — data loss, security, or broken core flow |
| **Medium** | 62 | Address during Phase 8 polish — degraded UX but not broken |
| **Low** | 40 | Track as known issues — minor UX papercuts, unlikely scenarios |
