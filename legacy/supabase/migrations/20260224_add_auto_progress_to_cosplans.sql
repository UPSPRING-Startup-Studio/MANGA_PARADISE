-- Add auto_progress column to cosplay_plans table
-- This column tracks whether the progress should be automatically calculated from tasks

ALTER TABLE cosplay_plans
ADD COLUMN IF NOT EXISTS auto_progress BOOLEAN DEFAULT false NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN cosplay_plans.auto_progress IS 'If true, progress_level is automatically calculated from completed tasks';

-- CRITICAL: Reload PostgREST schema cache to avoid PGRST204 errors
NOTIFY pgrst, 'reload schema';
