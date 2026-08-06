-- CrunchAI — Initial Database Schema
-- Migration 001: Core tables, indexes, RLS, and Realtime

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── Profiles ───
-- Synced from auth.users via trigger (see migration 002)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── Tasks ───
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  deadline timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending','active','completed','at_risk','overdue')),
  total_effort_hours int,
  completed_effort_hours int default 0,
  risk_score real default 0.0,
  risk_reason text,
  priority int default 99,
  ai_metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── Subtasks ───
create table public.subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  title text not null,
  description text,
  effort_hours int not null default 1,
  sequence int not null default 0,
  is_completed boolean default false,
  created_at timestamptz default now()
);

-- ─── Sessions (work blocks) ───
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  subtask_id uuid references public.subtasks(id) on delete set null,
  scheduled_date date not null,
  duration_minutes int not null default 60,
  status text not null default 'scheduled'
    check (status in ('scheduled','completed','missed','rescheduled')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- ─── Agent Logs ───
create table public.agent_logs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  agent_mode text not null
    check (agent_mode in ('plan','renegotiate','brief','prioritize')),
  tool_name text not null,
  tool_input jsonb default '{}'::jsonb,
  tool_output jsonb default '{}'::jsonb,
  step_number int not null default 0,
  status text not null default 'running'
    check (status in ('running','completed','error')),
  created_at timestamptz default now()
);

-- ─── Indexes ───
create index idx_tasks_user_id on public.tasks(user_id);
create index idx_tasks_deadline on public.tasks(deadline);
create index idx_tasks_status on public.tasks(status);
create index idx_subtasks_task_id on public.subtasks(task_id);
create index idx_sessions_task_id on public.sessions(task_id);
create index idx_sessions_date on public.sessions(scheduled_date);
create index idx_sessions_status on public.sessions(status);
create index idx_agent_logs_task_id on public.agent_logs(task_id);
create index idx_agent_logs_user_id on public.agent_logs(user_id);

-- ─── Row-Level Security ───
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.subtasks enable row level security;
alter table public.sessions enable row level security;
alter table public.agent_logs enable row level security;

-- Profiles: users can read/update own profile
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Tasks: full CRUD on own tasks
create policy "Users can CRUD own tasks"
  on public.tasks for all using (auth.uid() = user_id);

-- Subtasks: CRUD on subtasks belonging to user's own tasks
create policy "Users can CRUD subtasks of own tasks"
  on public.subtasks for all
  using (task_id in (select id from public.tasks where user_id = auth.uid()));

-- Sessions: CRUD on sessions belonging to user's own tasks
create policy "Users can CRUD sessions of own tasks"
  on public.sessions for all
  using (task_id in (select id from public.tasks where user_id = auth.uid()));

-- Agent logs: read own logs, system inserts via service role
create policy "Users can view own agent logs"
  on public.agent_logs for select using (auth.uid() = user_id);
create policy "Users can insert own agent logs"
  on public.agent_logs for insert with check (auth.uid() = user_id);

-- ─── Auto-update updated_at ───
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ─── Enable Realtime ───
alter publication supabase_realtime add table public.agent_logs;
alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.tasks;
