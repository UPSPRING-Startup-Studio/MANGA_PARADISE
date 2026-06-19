-- Add target_event_id column to cosplay_plans table
-- This allows users to link their cosplay project to a specific event

ALTER TABLE cosplay_plans
ADD COLUMN IF NOT EXISTS target_event_id UUID REFERENCES events(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_cosplay_plans_target_event_id 
ON cosplay_plans(target_event_id);

-- Add comment for documentation
COMMENT ON COLUMN cosplay_plans.target_event_id IS 'Optional reference to an event that this cosplay project is targeting';

-- CRITICAL: Reload PostgREST schema cache to avoid PGRST204 errors
NOTIFY pgrst, 'reload schema';
