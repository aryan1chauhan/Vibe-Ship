<div align="center">

# ⚡ CrunchAI

### Your AI deadline agent. Not a reminder — a plan.

[![Next.js](https://img.shields.io/badge/Next.js_14-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?style=for-the-badge&logo=google-cloud)](https://cloud.google.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript)](https://typescriptlang.org)

**[Live Demo](https://YOUR_DEPLOYED_URL) · [Watch Demo Video](#) · [Report Bug](https://github.com/YOUR_USERNAME/crunchai/issues)**

</div>

---

## The Problem

Students and professionals miss deadlines not because they forget — but because they don't know *how* to fit everything in. Existing tools send reminders. That doesn't help when you have 6 hours of work and 2 days left.

## What CrunchAI Does Differently

CrunchAI is an AI **agent** — not an assistant. When you give it a task and a deadline, it doesn't remind you. It:

1. **Breaks the task** into concrete subtasks with effort estimates
2. **Schedules work sessions** automatically across your available time
3. **Detects risks** before they become missed deadlines
4. **Replans instantly** when life gets in the way

The agent uses Gemini function calling — a loop of tool calls where the AI decides what to do next, not just what to say.

---

## Demo

> *"Submit project report by June 29, 2pm"*

The user types one line. The agent runs in the background:

```
→ break_into_subtasks()    — "Outline, Draft, Write body, Edit, Review"
→ estimate_effort()         — 6.5 hours total across 5 subtasks
→ calculate_schedule()      — Day-by-day plan, 2h blocks
→ assess_risk()             — Flags June 28 as a tight window
→ Plan committed to DB      — Sessions created, dashboard updated
```

Miss a session? The **renegotiation agent** fires automatically — compressing the remaining work into a new schedule without you asking.

---

## Architecture

```
┌────────────────────────────────────────────┐
│          NEXT.JS 14 (App Router)           │
│  React Server Components + Client Islands  │
│  TanStack Query · Supabase Realtime        │
└─────────────────┬──────────────────────────┘
                  │
┌─────────────────▼──────────────────────────┐
│              API ROUTES                    │
│  /api/agent/plan  /api/agent/replan        │
│  /api/agent/brief /api/sessions/[id]       │
└──────────┬─────────────────┬───────────────┘
           │                 │
┌──────────▼──────┐ ┌────────▼───────────────┐
│  AGENT CORE     │ │      SUPABASE           │
│  6-tool loop    │ │  Auth · DB · Realtime   │
│  runAgentLoop() │ │  tasks · subtasks       │
│  runReplanLoop()│ │  sprint_sessions        │
└──────────┬──────┘ │  agent_events           │
           │        └────────────────────────┘
┌──────────▼──────┐
│ GEMINI 2.5 FLASH│
│ Function Calling│
│  (Google AI)    │
└─────────────────┘
```

---

## Key Features

| Feature | Description |
|---|---|
| 🤖 **Planning Agent** | Gemini function-calling loop: breaks tasks, estimates effort, builds schedule |
| 🔄 **Auto-Replan** | Missed a session? Agent rebuilds the schedule instantly, no action needed |
| 📊 **Risk Detection** | AI flags tight deadlines and bottlenecks before they happen |
| 🧠 **Daily Brief** | Gemini generates a personalized morning summary of what to tackle today |
| 📡 **Live Dashboard** | Supabase Realtime pushes agent updates to UI without page refresh |
| ⚡ **Focus Mode** | Full-screen session timer with SVG countdown, Complete / Miss actions |
| 📱 **Responsive** | Mobile-first layout, bottom navigation on small screens |
| 🔍 **Agent Log** | Terminal-style log shows every tool call the agent makes — full transparency |

---

## Google Technologies Used

| Technology | Role |
|---|---|
| **Gemini 2.5 Flash** (Google AI Studio) | Core agent brain — function calling, task reasoning, risk assessment, daily brief generation |
| **Google OAuth 2.0** | User authentication via Supabase's Google provider |
| **Google Cloud** | Production deployment — application hosted and served from Google Cloud infrastructure |

---

## Tech Stack

**Frontend**
- Next.js 14 (App Router, React Server Components)
- TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query v5 (server state)
- Supabase Realtime (live updates)

**Backend**
- Next.js API Routes (Edge-compatible)
- Gemini 2.5 Flash with Function Calling (`@google/generative-ai`)
- Supabase (PostgreSQL + Row Level Security + Auth)

**Deployment**
- Google Cloud (via Antigravity / Cloud Run)

---

## Local Setup

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project (free)
- A [Google AI Studio](https://aistudio.google.com) API key (free)

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/crunchai.git
cd crunchai
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set up the database

Go to your Supabase project → SQL Editor → paste and run the contents of [`schema.sql`](./schema.sql).

### 4. Configure Google OAuth

1. Go to Supabase Dashboard → Authentication → Providers → Google
2. Enable Google provider
3. Add your OAuth credentials (from [Google Cloud Console](https://console.cloud.google.com))
4. Add `http://localhost:3000/auth/callback` to your OAuth redirect URIs

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How the Agent Works

CrunchAI uses **Gemini Function Calling** — not a single prompt, but a tool-use loop where the model decides which function to call next.

### The 6 Tools

```typescript
break_into_subtasks(task, deadline)   // → structured subtask list
estimate_effort(subtask)              // → minutes per subtask
calculate_schedule(subtasks, prefs)   // → day-by-day session plan
assess_risk(plan, now)                // → risk level + reasons
rebalance_plan(remaining, deadline)   // → compressed new schedule
prioritize_tasks(tasks[])             // → ranked list + today focus
```

### The Planning Loop

```
User submits task
      ↓
Gemini receives task + user context
      ↓
Gemini calls break_into_subtasks() → gets 5 subtasks
Gemini calls estimate_effort()     → 6.5 hours total
Gemini calls calculate_schedule()  → 4 work sessions
Gemini calls assess_risk()         → flags risk on Day 3
      ↓
Plan saved to Supabase
Dashboard updates via Realtime
```

### Auto-Replan

When a session is marked missed via `PATCH /api/sessions/:id`, the API automatically triggers `runReplanLoop()` — the agent recalculates the remaining work against the remaining time and creates a fresh set of sessions.

---

## Project Structure

```
crunchai/
├── app/
│   ├── (auth)/login/           # Google OAuth login
│   ├── (app)/
│   │   ├── dashboard/          # Main view: brief, sessions, risks
│   │   ├── tasks/              # Task list + new task + task detail
│   │   └── focus/              # Full-screen session timer
│   └── api/
│       ├── agent/              # plan / replan / brief routes
│       └── sessions/           # session status update
├── components/
│   ├── agent/AgentThinkingLog  # Terminal-style live agent log
│   ├── dashboard/TodayBrief    # AI-generated daily summary
│   └── tasks/SprintTimeline    # Visual day-by-day plan
├── lib/
│   ├── agent/                  # Tool definitions + executor + loop
│   └── supabase/               # Client + server + types
└── schema.sql                  # Full database schema
```

---

## Hackathon Submission

Built for **BlockseBlock Hackathon 2026** — Problem Statement 1: *The Last-Minute Life Saver*

Submitted by: **[Your Name]**

---

<div align="center">
Built with ❤️ and Gemini 2.5 Flash
</div>
