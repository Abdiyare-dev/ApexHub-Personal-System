-- ============================================================================
-- STEP 2 -- RUN THIS ONCE IN THE SUPABASE SQL EDITOR
--
-- Fixes: new row for relation "tasks" violates check constraint
--        "tasks_status_check"
--
-- WHY: four different spellings of task status ended up in the codebase --
-- 'Incomplete', 'Completed', 'Pending' and 'pending'. The UI reads only
-- 'Incomplete' and 'Completed', so those become the canonical pair. The
-- matching code fixes are in the same commit as this file.
--
-- ⚠ THIS ONE TOUCHES DATA. Unlike step 1, it rewrites the `status` value of
-- existing task rows. It is a two-state collapse: anything that is not
-- 'Completed' becomes 'Incomplete'. The UI already treats it that way
-- (`t.status !== 'Completed'` is its definition of incomplete), so nothing
-- the interface ever showed you is lost. Still -- look before you run:
--
--     SELECT status, count(*) FROM tasks GROUP BY status;
--
-- ============================================================================

-- Drop first, so the normalisation below cannot violate the old rule.
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

-- Fold every historical spelling of "done" into 'Completed' ...
UPDATE tasks
   SET status = 'Completed'
 WHERE lower(status) IN ('completed', 'complete', 'done', 'finished');

-- ... and everything else into 'Incomplete'.
UPDATE tasks
   SET status = 'Incomplete'
 WHERE status IS NULL OR status <> 'Completed';

-- Now the constraint can be strict again.
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('Incomplete', 'Completed'));

ALTER TABLE tasks ALTER COLUMN status SET DEFAULT 'Incomplete';

NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- VERIFY -- expect only 'Incomplete' and/or 'Completed':
--   SELECT status, count(*) FROM tasks GROUP BY status;
-- ============================================================================
