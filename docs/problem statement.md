# CrunchAI — Project Submission Document
**BlockseBlock Hackathon 2026**

## Problem Statement Selected

**Problem Statement 1: The Last-Minute Life Saver**

## Solution Overview

CrunchAI is an AI-powered deadline agent that plans, schedules, and renegotiates your work automatically. When a user adds a task with a deadline, a Gemini-powered agent breaks it into subtasks, estimates effort, schedules work sessions across available days, and detects risks before deadlines are missed.

The core innovation is the renegotiation agent — if a user misses a session, the AI automatically rebuilds the schedule around remaining time with no action required from the user.

## Key Features
- **Planning Agent** — Gemini function-calling loop breaks tasks into subtasks, estimates effort, builds a day-by-day sprint schedule, and flags risks
- **Auto-Renegotiation** — Missed a session? Agent instantly rebuilds the plan without the user asking
- **Risk Detection** — AI flags tight deadlines and bottleneck days before they become problems
- **AI Daily Brief** — Gemini generates a personalized summary every day: what to focus on, what's at risk, recommended order of work
- **Live Dashboard** — Supabase Realtime pushes agent updates to UI instantly without page refresh
- **Agent Thinking Log** — Terminal-style log shows every tool call the agent makes in real time — full transparency into AI reasoning
- **Focus Mode** — Full-screen distraction-free session timer with SVG countdown, Complete and Miss actions
- **Task Prioritization** — When multiple tasks exist, AI ranks by urgency and recommends today's exact focus

## Technologies Used
- Next.js 14 (App Router, React Server Components)
- TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query v5
- Supabase (PostgreSQL + Auth + Realtime + Row Level Security)
- Google Gemini 2.5 Flash with Function Calling
- Vercel (deployment on Google Cloud infrastructure)

## Google Technologies Utilized

### 1. Gemini 2.5 Flash — Google AI Studio

Gemini is the brain of every agentic action in CrunchAI, used in three ways:
- **Function Calling Loop** — The planning agent sends a task to Gemini alongside 6 registered function definitions: `break_into_subtasks`, `estimate_effort`, `calculate_schedule`, `assess_risk`, `rebalance_plan`, and `prioritize_tasks`. Gemini decides which functions to call, in what order, and with what arguments. This multi-turn tool-use loop is what makes CrunchAI genuinely agentic.
- **Structured Output** — `break_into_subtasks`, `estimate_effort`, and `assess_risk` use Gemini to generate structured JSON directly committed to the database.
- **Natural Language Brief** — `/api/agent/brief` calls Gemini with the user's upcoming sessions and risk data to generate a personalized daily briefing on the dashboard.

### 2. Google OAuth 2.0

User authentication is handled via Google OAuth 2.0 integrated through Supabase's Google provider. Users sign in with their existing Google account — no separate credentials required.

### 3. Google Cloud

The production application is deployed on Google Cloud infrastructure via Vercel, which runs on Google Cloud. The Firebase project `crunchai-app` was also created as part of the Google Cloud setup for this submission.
