-- =====================================================
-- MIGRATION: Add has_contest computed flag to events
-- DATE: 2026-02-16
-- DESCRIPTION: Adds a computed flag to detect if an event
--              has any cosplay contest activities
-- =====================================================

-- Add has_contest column to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS has_contest BOOLEAN DEFAULT false;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_events_has_contest
ON public.events(has_contest)
WHERE has_contest = true;

-- Add comment for documentation
COMMENT ON COLUMN public.events.has_contest IS 'Flag indicating if this event has at least one cosplay contest activity';

-- Create a function to update has_contest flag when event_schedule changes
CREATE OR REPLACE FUNCTION update_event_has_contest()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the has_contest flag for the event
  UPDATE public.events
  SET has_contest = EXISTS (
    SELECT 1 FROM public.event_schedule
    WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
    AND (category = 'contest' OR category = 'cosplay_contest' OR is_cosplay_contest = true)
  )
  WHERE id = COALESCE(NEW.event_id, OLD.event_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update has_contest when event_schedule changes
DROP TRIGGER IF EXISTS trigger_update_event_has_contest ON public.event_schedule;
CREATE TRIGGER trigger_update_event_has_contest
AFTER INSERT OR UPDATE OR DELETE ON public.event_schedule
FOR EACH ROW
EXECUTE FUNCTION update_event_has_contest();

-- Initial population of has_contest flag for existing events
UPDATE public.events
SET has_contest = EXISTS (
  SELECT 1 FROM public.event_schedule
  WHERE event_id = events.id
  AND (category = 'contest' OR category = 'cosplay_contest' OR is_cosplay_contest = true)
);
