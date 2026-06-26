# CrunchAI — Project Description
## BlockseBlock Hackathon 2026 Submission

---

## Problem Statement Selected

**Problem Statement 1: The Last-Minute Life Saver**

Students, professionals, and entrepreneurs frequently miss deadlines — not from forgetting, but from not knowing how to realistically fit work into the time remaining. Existing tools send passive reminders that are easy to ignore and do nothing to help users actually complete their tasks.

---

## Solution Overview

CrunchAI is an AI-powered deadline agent — not a reminder app, but a planning system that actively manages your time for you.

When a user adds a task with a deadline, a Gemini-powered agent runs a multi-step function-calling loop: it breaks the task into concrete subtasks, estimates the effort required, schedules specific work sessions across the user's available days, and detects risk before deadlines are missed.

The core innovation is the **renegotiation agent**: if a user misses a work session, the agent automatically fires and rebuilds the schedule around the remaining time — no action required from the user. This moves CrunchAI from a passive tool into an active, autonomous productivity companion.

The agent's reasoning is fully transparent to the user through a real-time terminal-style Agent Thinking Log, which shows each tool call as it fires and builds trust in the system's decisions.

---

## Key Features

**1. Planning Agent (Gemini Function Calling)**
The core loop uses Gemini 2.5 Flash's function calling capability with 6 registered tools: `break_into_subtasks`, `estimate_effort`, `calculate_schedule`, `assess_risk`, `rebalance_plan`, and `prioritize_tasks`. Gemini decides which tools to call and in what order — this is genuine agentic behavior, not a single prompt.

**2. Auto-Renegotiation**
When any sprint session is marked as missed, the `/api/sessions/:id` PATCH route automatically triggers `runReplanLoop()`. The agent receives the missed sessions, remaining subtasks, and deadline, and produces a compressed new schedule instantly.

**3. Risk Detection**
The `assess_risk` tool evaluates whether the current plan is realistic given the remaining time. It flags specific bottleneck days and generates human-readable risk explanations shown on the dashboard.

**4. AI Daily Brief**
Each day, `/api/agent/brief` calls Gemini to generate a personalized morning summary: what to focus on today, what's at risk, and the recommended order of work. This updates in real time via Supabase Realtime.

**5. Live Dashboard with Realtime Sync**
The dashboard subscribes to Supabase Realtime on three tables — `tasks`, `sprint_sessions`, and `agent_events` — so any agent activity updates the UI instantly without polling or page refresh.

**6. Focus Mode**
A full-screen, distraction-free session view with an SVG countdown timer showing exactly how long remains in the current work block. Complete and Miss actions are the only controls visible.

**7. Agent Thinking Log**
A terminal-styled component shows every tool the agent calls, with its parameters and output, in real time. This is visible on the task detail page and makes the agentic behavior tangible to users and evaluators.

**8. Intelligent Task Prioritization**
When a user has multiple active tasks, the `prioritize_tasks` tool ranks them by urgency (deadline proximity, estimated effort remaining, and risk level) and surfaces the recommended focus for today.

---

## Technologies Used

**Frontend**
- Next.js 14 (App Router with React Server Components and Client Components)
- TypeScript (strict mode)
- Tailwind CSS + shadcn/ui component library
- TanStack Query v5 for server state management
- Supabase Realtime for live push updates

**Backend**
- Next.js API Routes (serverless, edge-compatible)
- Gemini 2.5 Flash with Function Calling via `@google/generative-ai` SDK
- Supabase (PostgreSQL database with Row Level Security)
- Supabase Auth with Google OAuth provider

**Database Schema**
- `profiles` — user preferences (timezone, working hours, daily availability)
- `tasks` — task metadata with AI-generated priority and risk fields
- `subtasks` — AI-generated breakdown of each task
- `sprint_sessions` — scheduled work blocks with planned and actual times
- `agent_events` — complete audit trail of every agent action

**Deployment**
- Google Cloud (application deployed to Google Cloud infrastructure)

---

## Google Technologies Utilized

### 1. Gemini 2.5 Flash — Google AI Studio
Gemini is the brain of every agentic action in CrunchAI. It is used in three distinct ways:

- **Function Calling Loop**: The planning agent sends a task to Gemini alongside 6 registered function definitions. Gemini decides which functions to call, in what order, and with what arguments. This multi-turn tool-use loop is what makes CrunchAI genuinely agentic rather than just AI-powered.
- **Structured Output Generation**: The `break_into_subtasks`, `estimate_effort`, and `assess_risk` tools use Gemini to generate structured JSON responses that are directly committed to the database.
- **Natural Language Brief**: The `/api/agent/brief` route calls Gemini with the user's upcoming sessions and task risk data to generate a personalized, conversational daily briefing rendered on the dashboard.

The Gemini API is accessed via the official `@google/generative-ai` Node.js SDK using a key from Google AI Studio. The free tier (1,500 requests/day, 15 req/min) is sufficient for all hackathon usage.

### 2. Google OAuth 2.0
User authentication is handled via Google OAuth 2.0, integrated through Supabase's Google provider. This means users sign in with their existing Google account — no separate credentials required. The OAuth flow uses the standard Authorization Code flow with PKCE, handled entirely by Supabase's auth client libraries.

### 3. Google Cloud
The production application is deployed on Google Cloud infrastructure. Google Cloud serves as the hosting and compute layer for the live application, satisfying the hackathon's mandatory Google Cloud deployment requirement.

---

*Document prepared for BlockseBlock Hackathon 2026 submission.*
*All links and the deployed application will remain accessible throughout the evaluation period.*
