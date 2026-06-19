-- Add is_cosplay_contest flag to event_schedule table
-- This distinguishes official cosplay contests from regular cosplay activities

ALTER TABLE event_schedule
ADD COLUMN is_cosplay_contest BOOLEAN DEFAULT false;

-- Create index for faster filtering
CREATE INDEX idx_event_schedule_is_cosplay_contest 
ON event_schedule(is_cosplay_contest) 
WHERE is_cosplay_contest = true;

-- Add comment for documentation
COMMENT ON COLUMN event_schedule.is_cosplay_contest IS 'Flag to indicate if this is an official cosplay contest requiring registration and dossier submission';
