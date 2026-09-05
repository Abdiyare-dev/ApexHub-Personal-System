-- ============================================================================
-- RUN THIS ONCE IN THE SUPABASE SQL EDITOR
--
--   Supabase dashboard -> SQL Editor -> New query -> paste all of this -> Run
--
-- Fixes: "Could not find the 'goal_id' column of 'tasks' in the schema cache"
--        "Could not find the 'end_date' column of 'projects' in the schema cache"
--
-- Every statement is idempotent. Running it twice changes nothing.
-- ============================================================================

-- ---------------------------------------------------------------- tasks ----
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS goal_id  UUID REFERENCES goals(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS period   TEXT;

-- ---------------------------------------------------------------- goals ----
ALTER TABLE goals ADD COLUMN IF NOT EXISTS type       TEXT DEFAULT 'Yearly';
ALTER TABLE goals ADD COLUMN IF NOT EXISTS milestones JSONB DEFAULT '[]'::jsonb;

-- ------------------------------------------------------------- projects ----
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type   TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date     DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS end_date       DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_completed   BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tasks          JSONB DEFAULT '[]'::jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS specific_goals TEXT;

-- ------------------------------------------------------ productivity_meta --
-- Persists custom project types. The shape matters: ProductivityContext reads
-- `mData.project_types` and upserts with onConflict: 'user_id', so user_id has
-- to be the primary key.
CREATE TABLE IF NOT EXISTS productivity_meta (
  user_id       uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  project_types jsonb DEFAULT '[]'::jsonb,
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE productivity_meta ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own productivity meta" ON productivity_meta;
CREATE POLICY "Users manage own productivity meta" ON productivity_meta
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------ refresh schema cache -----
-- PGRST204 is a *cache* error. Supabase normally reloads on its own, but
-- asking explicitly makes the fix take effect immediately.
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- VERIFY -- run this after the above and confirm you see the new columns:
-- ============================================================================
-- SELECT table_name, column_name
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name IN ('tasks','goals','projects')
--   AND column_name IN ('goal_id','reminder','period','type','milestones',
--                       'project_type','start_date','end_date','is_completed',
--                       'tasks','specific_goals')
-- ORDER BY table_name, column_name;
--
-- And check RLS is on everywhere:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
