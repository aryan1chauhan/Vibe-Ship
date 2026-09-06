# Graph Report - crunchai  (2026-09-06)

## Corpus Check
- 73 files · ~42,473 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 591 nodes · 855 edges · 28 communities (25 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b760ddc1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 60 edges
2. `runAgent()` - 22 edges
3. `CrunchAI — Edge Cases & Corner Scenarios` - 20 edges
4. `CrunchAI — Detailed System Architecture` - 19 edges
5. `Button()` - 15 edges
6. `createClient()` - 12 edges
7. `CrunchAI — Phase-Wise Implementation Plan` - 12 edges
8. `Phase 3: Gemini Agent Engine` - 10 edges
9. `useTaskList()` - 9 edges
10. `Phase 5: Dashboard & Layout UI` - 8 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `runAgent()`  [EXTRACTED]
  app/api/agent/brief/route.ts → lib/gemini/agent.ts
- `POST()` --calls--> `runAgent()`  [EXTRACTED]
  app/api/agent/plan/route.ts → lib/gemini/agent.ts
- `POST()` --calls--> `runAgent()`  [EXTRACTED]
  app/api/agent/renegotiate/route.ts → lib/gemini/agent.ts
- `AvatarBadge()` --calls--> `cn()`  [EXTRACTED]
  components/ui/avatar.tsx → lib/utils.ts
- `AvatarGroup()` --calls--> `cn()`  [EXTRACTED]
  components/ui/avatar.tsx → lib/utils.ts

## Communities (28 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (52): DashboardShell(), DashboardShellProps, navItems, Sidebar(), SidebarProps, cn(), Avatar(), AvatarBadge() (+44 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (47): GET(), AgentRunResult, AgentStepLog, buildInitialUserPrompt(), finalizeTaskPlanning(), getAgentSupabaseClient(), logAgentCompletion(), runAgent() (+39 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (45): 10. Component Architecture, 11. State Management Strategy, 12. Auto-Renegotiation Logic, 13. Risk Detection Algorithm, 14. Environment Variables, 15. Deployment Architecture, 16. Security Considerations, 1. High-Level System Diagram (+37 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (20): DailyBrief(), metadata, RiskBanner(), TaskProgressRing(), UpcomingSessions(), DailyBriefResponse, useDailyBrief(), Session (+12 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (35): Acceptance Criteria, Acceptance Criteria, code:bash (npx -y create-next-app@latest ./ --ts --tailwind --app --esl), code:block14 (States: idle → running → paused → completed | missed), code:block15 (1. Create a task → watch agent log populate in real-time), code:mermaid (graph LR), code:bash (# Supabase), code:bash (NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co) (+27 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (21): allComplete, allDone, alloc, allSubtasks, available, days, emptyPayload, mock (+13 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (24): Acceptance Criteria, code:typescript (// break_into_subtasks output), code:typescript (const toolHandlers: Record<string, ToolHandler> = {), code:block8 (async function runAgent(mode, context):), code:bash (# Unit test: risk.ts scoring with known inputs), [NEW] `lib/gemini/agent.ts`, [NEW] `lib/gemini/client.ts`, [NEW] `lib/gemini/prompts.ts` (+16 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (20): EffortEstimateSchema, SessionSchema, SubtaskSchema, allocation, available, days, existing, futureDeadline (+12 more)

### Community 8 - "Community 8"
Cohesion: 0.1
Nodes (18): config, middleware(), updateSession(), AgentLog, AgentLogInsert, AgentLogStatus, Database, Profile (+10 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (15): dailyBriefKey, formatted, mockSessions, mockSubtasks, mockTasks, result, singleTaskKey, stats (+7 more)

### Community 10 - "Community 10"
Cohesion: 0.09
Nodes (23): Acceptance Criteria, code:typescript (// useTaskList() — GET /api/tasks), code:typescript (// useDailyBrief() — GET /api/agent/brief), [MODIFY] `app/layout.tsx`, [MODIFY] `app/page.tsx`, [NEW] `app/(dashboard)/layout.tsx`, [NEW] `app/(dashboard)/page.tsx`, [NEW] `components/dashboard/daily-brief.tsx` (+15 more)

### Community 11 - "Community 11"
Cohesion: 0.1
Nodes (20): 10. Task Prioritization, 11. Supabase Realtime, 12. Database & RLS, 13. API Routes & Validation, 14. UI/UX Edge Cases, 15. Concurrency & Race Conditions, 16. Deployment & Environment, 1. Authentication & Sessions (+12 more)

### Community 12 - "Community 12"
Cohesion: 0.1
Nodes (19): AssessRiskInput, BreakIntoSubtasksInput, BreakIntoSubtasksOutputSchema, CalculateScheduleInput, CalculateScheduleOutputSchema, EffortEstimate, EstimateEffortInput, EstimateEffortOutputSchema (+11 more)

### Community 13 - "Community 13"
Cohesion: 0.16
Nodes (18): AssessRiskInputSchema, AssessRiskOutput, BreakIntoSubtasksInputSchema, CalculateScheduleInputSchema, CalculateScheduleOutput, EstimateEffortInputSchema, EstimateEffortOutput, PrioritizeTasksInputSchema (+10 more)

### Community 14 - "Community 14"
Cohesion: 0.11
Nodes (18): Acceptance Criteria, code:sql (-- Auto-create profile row when a user signs up), code:bash (# Test auth flow manually in browser), [NEW] `app/(auth)/callback/route.ts`, [NEW] `app/(auth)/login/page.tsx`, [NEW] `lib/supabase/client.ts`, [NEW] `lib/supabase/middleware.ts`, [NEW] `lib/supabase/server.ts` (+10 more)

### Community 15 - "Community 15"
Cohesion: 0.12
Nodes (16): Acceptance Criteria, code:typescript (try {), code:bash (# Test with curl or Thunder Client:), [NEW] `app/api/agent/brief/route.ts`, [NEW] `app/api/agent/plan/route.ts`, [NEW] `app/api/agent/prioritize/route.ts`, [NEW] `app/api/agent/renegotiate/route.ts`, [NEW] `app/api/tasks/[id]/route.ts` (+8 more)

### Community 16 - "Community 16"
Cohesion: 0.14
Nodes (14): Acceptance Criteria, [NEW] `app/(dashboard)/tasks/[id]/page.tsx`, [NEW] `app/(dashboard)/tasks/page.tsx`, [NEW] `components/agent/agent-status-badge.tsx`, [NEW] `components/tasks/create-task-dialog.tsx`, [NEW] `components/tasks/schedule-timeline.tsx`, [NEW] `components/tasks/subtask-list.tsx`, [NEW] `components/tasks/task-card.tsx` (+6 more)

### Community 17 - "Community 17"
Cohesion: 0.15
Nodes (13): code:typescript (export const metadata: Metadata = {), code:bash (npx vitest run), code:bash (npx playwright test), E2E Tests (Playwright), [MODIFY] `app/layout.tsx`, Phase 8: Polish, Testing & Deployment, Step 8.1 — Micro-Animations & Transitions, Step 8.2 — Error & Edge Cases (+5 more)

### Community 18 - "Community 18"
Cohesion: 0.24
Nodes (6): geistMono, inter, metadata, ReticleDev(), Providers(), Toaster()

### Community 19 - "Community 19"
Cohesion: 0.2
Nodes (9): 1. Gemini 2.5 Flash — Google AI Studio, 2. Google OAuth 2.0, 3. Google Cloud, CrunchAI — Project Submission Document, Google Technologies Utilized, Key Features, Problem Statement Selected, Solution Overview (+1 more)

### Community 20 - "Community 20"
Cohesion: 0.22
Nodes (8): Available MCP Servers & Tools, Graphify First (Token Efficiency), Installed Project Skills (.agents/skills/), Mandatory Pre-Action Skill & MCP Check Protocol (ALWAYS ACTIVE), Ponytail Mode Active, Reticle Integration (Always Active), This is NOT the Next.js you know, UI/UX Pro Max First (Mandatory UI/UX Standard)

### Community 21 - "Community 21"
Cohesion: 0.33
Nodes (6): handleAssessRisk(), calculateRiskScore(), generateRiskReason(), RiskCalculationParams, RiskCalculationResult, RiskLevel

### Community 22 - "Community 22"
Cohesion: 0.4
Nodes (4): code:bash (npm run dev), Deploy on Vercel, Getting Started, Learn More

## Knowledge Gaps
- **266 isolated node(s):** `eslintConfig`, `config`, `nextConfig`, `config`, `inter` (+261 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 0` to `Community 3`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Why does `CrunchAI — Phase-Wise Implementation Plan` connect `Community 4` to `Community 6`, `Community 10`, `Community 14`, `Community 15`, `Community 16`, `Community 17`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `Button()` connect `Community 3` to `Community 0`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `config`, `nextConfig` to the rest of the system?**
  _266 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._