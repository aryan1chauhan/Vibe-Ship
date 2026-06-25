-- ============================================
-- CrunchAI — Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Profiles (extends Supabase Auth users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  daily_available_hours INTEGER DEFAULT 4,
  work_start_hour INTEGER DEFAULT 9,
  work_end_hour INTEGER DEFAULT 22,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks (user's goals/assignments)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMPTZ NOT NULL,
  task_type TEXT DEFAULT 'assignment'
    CHECK (task_type IN ('assignment','project','exam','personal','work')),
  status TEXT DEFAULT 'planned'
    CHECK (status IN ('planned','active','completed','missed','replanned')),
  priority TEXT DEFAULT 'medium'
    CHECK (priority IN ('critical','high','medium','low')),
  estimated_hours DECIMAL(4,1),
  actual_hours DECIMAL(4,1),
  ai_risk_level TEXT DEFAULT 'low'
    CHECK (ai_risk_level IN ('low','medium','high','critical')),
  ai_risk_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subtasks (AI-generated breakdown of a task)
CREATE TABLE subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  sequence_order INTEGER NOT NULL,
  estimated_minutes INTEGER NOT NULL,
  actual_minutes INTEGER,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','in_progress','completed','skipped')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sprint Sessions (the actual scheduled work blocks)
CREATE TABLE sprint_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  subtask_id UUID REFERENCES subtasks(id) ON DELETE CASCADE NOT NULL,
  planned_start TIMESTAMPTZ NOT NULL,
  planned_end TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  status TEXT DEFAULT 'planned'
    CHECK (status IN ('planned','in_progress','completed','missed','rescheduled')),
  notes TEXT,
  is_replanned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Events (audit trail — shows "thinking" in the UI)
CREATE TABLE agent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  tool_called TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprint_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their profile" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users own their tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their subtasks" ON subtasks
  FOR ALL USING (
    task_id IN (SELECT id FROM tasks WHERE user_id = auth.uid())
  );

CREATE POLICY "Users own their sessions" ON sprint_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their events" ON agent_events
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- Auto-create profile on signup
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', 'User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Realtime (enable for live dashboard)
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE sprint_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_events;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;

-- ============================================
-- Indexes for performance
-- ============================================

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);
CREATE INDEX idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX idx_sessions_user_id ON sprint_sessions(user_id);
CREATE INDEX idx_sessions_task_id ON sprint_sessions(task_id);
CREATE INDEX idx_sessions_planned_start ON sprint_sessions(planned_start);
CREATE INDEX idx_sessions_status ON sprint_sessions(status);
CREATE INDEX idx_agent_events_task_id ON agent_events(task_id);
