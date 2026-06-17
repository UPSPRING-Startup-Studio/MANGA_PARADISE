-- Add passage_order column to contest_registrations
ALTER TABLE contest_registrations
ADD COLUMN IF NOT EXISTS passage_order INTEGER;

-- Add index for better performance when ordering
CREATE INDEX IF NOT EXISTS idx_contest_registrations_passage_order 
ON contest_registrations(event_id, passage_order) 
WHERE status = 'approved';

-- Add comment
COMMENT ON COLUMN contest_registrations.passage_order IS 'Order of passage for approved contestants on contest day';
