-- =============================================
-- BLOCK 1: Projects (may already exist — check first)
-- Only run this if a projects table does NOT already exist
-- =============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active','paused','completed','archived')),
  due_date TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- =============================================
-- BLOCK 2: Add missing columns to tasks table
-- Only run the ALTER statements for columns that don't already exist
-- =============================================
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium'
  CHECK (priority IN ('low','medium','high','urgent'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_rule TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_from_timetable BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);

-- =============================================
-- BLOCK 3: Habits
-- =============================================
CREATE TABLE habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily','weekly')),
  target_days INTEGER[] DEFAULT '{}',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own habits" ON habits
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_habits_user_id ON habits(user_id);

CREATE TABLE habit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL,
  completed BOOLEAN DEFAULT TRUE,
  UNIQUE(habit_id, log_date)
);
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own habit logs" ON habit_logs
  FOR ALL USING (
    habit_id IN (SELECT id FROM habits WHERE user_id = auth.uid())
  );
CREATE INDEX idx_habit_logs_habit_id ON habit_logs(habit_id);

-- =============================================
-- BLOCK 4: Goals & Milestones
-- =============================================
CREATE TABLE goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'personal'
    CHECK (category IN ('career','education','financial','health','personal','custom')),
  status TEXT DEFAULT 'not_started'
    CHECK (status IN ('not_started','in_progress','completed','paused')),
  target_date DATE,
  color TEXT DEFAULT '#10B981',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own goals" ON goals
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_goals_user_id ON goals(user_id);

CREATE TABLE milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'locked'
    CHECK (status IN ('locked','active','completed')),
  step_number INTEGER NOT NULL,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  depends_on UUID[] DEFAULT '{}',
  linked_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own milestones" ON milestones
  FOR ALL USING (
    goal_id IN (SELECT id FROM goals WHERE user_id = auth.uid())
  );
CREATE INDEX idx_milestones_goal_id ON milestones(goal_id);

-- =============================================
-- BLOCK 5: Finance additions
-- (only if budgets and savings_goals don't already exist)
-- =============================================
CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID,
  amount NUMERIC NOT NULL,
  period TEXT DEFAULT 'monthly' CHECK (period IN ('monthly','weekly')),
  month DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own budgets" ON budgets
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);

CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC DEFAULT 0,
  deadline DATE,
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active','reached','abandoned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own savings goals" ON savings_goals
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- BLOCK 6: Timetable
-- =============================================
CREATE TABLE timetable_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE timetable_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own timetable" ON timetable_entries
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_timetable_user_id ON timetable_entries(user_id);

-- =============================================
-- BLOCK 7: Journal & Planner
-- =============================================
CREATE TABLE journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  content TEXT NOT NULL,
  mood TEXT CHECK (mood IN ('great','good','neutral','low','rough')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own journal" ON journal_entries
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_journal_user_id ON journal_entries(user_id);

CREATE TABLE planner_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  type TEXT DEFAULT 'note' CHECK (type IN ('note','focus','reflection')),
  content TEXT,
  linked_task_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE planner_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own planner items" ON planner_items
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_planner_user_date ON planner_items(user_id, date);

-- =============================================
-- BLOCK 8: Auto-update updated_at on all tables
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_habits_updated_at
  BEFORE UPDATE ON habits FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_milestones_updated_at
  BEFORE UPDATE ON milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_savings_goals_updated_at
  BEFORE UPDATE ON savings_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_timetable_updated_at
  BEFORE UPDATE ON timetable_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_journal_updated_at
  BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- MISSING PIECES (added after a schema audit — run these in Supabase SQL editor)
-- ============================================================================

-- 1. productivity_meta
-- ProductivityContext reads and upserts this table to persist custom project
-- types, but it was never created. Every load logged a "table not found" error
-- and custom project types silently vanished on refresh.
CREATE TABLE IF NOT EXISTS productivity_meta (
  user_id       uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  project_types jsonb DEFAULT '[]'::jsonb,
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE productivity_meta ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own productivity meta" ON productivity_meta;
CREATE POLICY "Users manage own productivity meta" ON productivity_meta
  FOR ALL USING (auth.uid() = user_id);

-- 2. OPTIONAL — live sync across devices/tabs.
-- The app no longer depends on realtime (every write refreshes its own data),
-- but enabling this makes changes appear instantly in other open tabs.
-- ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
-- ALTER PUBLICATION supabase_realtime ADD TABLE goals;
-- ALTER PUBLICATION supabase_realtime ADD TABLE projects;
-- ALTER PUBLICATION supabase_realtime ADD TABLE transactions;

-- NOTE: `tasks`, `categories` and `transactions` exist in the live database but
-- have no CREATE TABLE here — they were created outside this file. Verify their
-- RLS is enabled and scoped to auth.uid() = user_id, e.g.:
--   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- ============================================================================
-- SCHEMA RECONCILIATION  (run this in the Supabase SQL editor)
--
-- The Productivity module writes fields that do not exist on the live tables,
-- so every create silently failed. The first symptom was:
--   "Could not find the 'goal_id' column of 'tasks' in the schema cache"
-- but a column-by-column probe showed the same problem across tasks, goals
-- and projects.
--
-- Safe to re-run: every statement uses IF NOT EXISTS.
-- ============================================================================

-- tasks: the create-task form sends a linked goal, a reminder flag and a
-- recurrence period; none of those columns existed.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS goal_id  UUID REFERENCES goals(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS period   TEXT;

-- goals: the UI stores a timeframe ("Yearly"/"Monthly"/"Weekly") and keeps
-- milestones inline as JSON. Note this is deliberately NOT the separate
-- `milestones` table — nothing in the UI reads that table, only the unused
-- /api/goals/[id]/milestones routes do.
ALTER TABLE goals ADD COLUMN IF NOT EXISTS type       TEXT DEFAULT 'Yearly';
ALTER TABLE goals ADD COLUMN IF NOT EXISTS milestones JSONB DEFAULT '[]'::jsonb;

-- projects: the form collects a type, a date range, completion state, an
-- inline task list and free-text goals.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type   TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date     DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS end_date       DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_completed   BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tasks          JSONB DEFAULT '[]'::jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS specific_goals TEXT;

-- Verify afterwards:
--   SELECT table_name, column_name FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name IN ('tasks','goals','projects')
--   ORDER BY table_name, column_name;
