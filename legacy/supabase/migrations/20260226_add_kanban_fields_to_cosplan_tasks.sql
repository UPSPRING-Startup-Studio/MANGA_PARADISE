-- ============================================================
-- Migration: Create cosplay_plan_tasks table (if not exists)
-- and add Kanban fields: status, category, price
-- ============================================================

-- 1. Create the table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS cosplay_plan_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES cosplay_plans(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  is_done BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  category TEXT NOT NULL DEFAULT 'craft' CHECK (category IN ('craft', 'achat', 'dressing')),
  price NUMERIC(10, 2) DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. If the table already existed, add the new columns safely
ALTER TABLE cosplay_plan_tasks
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'todo';

ALTER TABLE cosplay_plan_tasks
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'craft';

ALTER TABLE cosplay_plan_tasks
  ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) DEFAULT NULL;

-- 3. Add CHECK constraints if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'cosplay_plan_tasks_status_check'
  ) THEN
    ALTER TABLE cosplay_plan_tasks
      ADD CONSTRAINT cosplay_plan_tasks_status_check
      CHECK (status IN ('todo', 'in_progress', 'done'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'cosplay_plan_tasks_category_check'
  ) THEN
    ALTER TABLE cosplay_plan_tasks
      ADD CONSTRAINT cosplay_plan_tasks_category_check
      CHECK (category IN ('craft', 'achat', 'dressing'));
  END IF;
END $$;

-- 4. Migrate existing data: tasks that are is_done = true → status = 'done'
UPDATE cosplay_plan_tasks
  SET status = 'done'
  WHERE is_done = TRUE AND status = 'todo';

-- 5. Add index for faster queries by plan_id + status
CREATE INDEX IF NOT EXISTS idx_cosplay_plan_tasks_plan_status
  ON cosplay_plan_tasks (plan_id, status);

-- 6. Enable Row Level Security
ALTER TABLE cosplay_plan_tasks ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
-- SELECT: users can read tasks of their own plans
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cosplay_plan_tasks'
    AND policyname = 'Users can view their own tasks'
  ) THEN
    CREATE POLICY "Users can view their own tasks"
      ON cosplay_plan_tasks
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM cosplay_plans
          WHERE cosplay_plans.id = cosplay_plan_tasks.plan_id
          AND cosplay_plans.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- INSERT: users can create tasks for their own plans
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cosplay_plan_tasks'
    AND policyname = 'Users can insert their own tasks'
  ) THEN
    CREATE POLICY "Users can insert their own tasks"
      ON cosplay_plan_tasks
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM cosplay_plans
          WHERE cosplay_plans.id = cosplay_plan_tasks.plan_id
          AND cosplay_plans.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- UPDATE: users can update tasks of their own plans
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cosplay_plan_tasks'
    AND policyname = 'Users can update their own tasks'
  ) THEN
    CREATE POLICY "Users can update their own tasks"
      ON cosplay_plan_tasks
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM cosplay_plans
          WHERE cosplay_plans.id = cosplay_plan_tasks.plan_id
          AND cosplay_plans.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- DELETE: users can delete tasks of their own plans
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cosplay_plan_tasks'
    AND policyname = 'Users can delete their own tasks'
  ) THEN
    CREATE POLICY "Users can delete their own tasks"
      ON cosplay_plan_tasks
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM cosplay_plans
          WHERE cosplay_plans.id = cosplay_plan_tasks.plan_id
          AND cosplay_plans.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================================
-- VERIFICATION QUERY (run after applying migration):
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'cosplay_plan_tasks'
-- ORDER BY ordinal_position;
-- ============================================================
