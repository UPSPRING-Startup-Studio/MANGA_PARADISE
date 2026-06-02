-- =====================================================
-- MIGRATION: event_schedule Table Setup
-- DATE: 2025-02-12
-- DESCRIPTION: Creates the event_schedule table for 
--              managing chronological event programs
-- =====================================================

-- Create event_schedule table
CREATE TABLE IF NOT EXISTS public.event_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  time TEXT NOT NULL,
  end_time TEXT,
  title TEXT NOT NULL,
  location TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  description TEXT,
  day_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries by event_id
CREATE INDEX IF NOT EXISTS idx_event_schedule_event_id ON public.event_schedule(event_id);
CREATE INDEX IF NOT EXISTS idx_event_schedule_time ON public.event_schedule(time);

-- Enable Row Level Security
ALTER TABLE public.event_schedule ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Anyone can read approved event schedules
CREATE POLICY "event_schedule_select_policy" ON public.event_schedule
  FOR SELECT
  USING (true);

-- Policy: Admins can insert schedule items
CREATE POLICY "event_schedule_insert_policy" ON public.event_schedule
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role_function = 'admin'
    )
  );

-- Policy: Admins can update schedule items
CREATE POLICY "event_schedule_update_policy" ON public.event_schedule
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role_function = 'admin'
    )
  );

-- Policy: Admins can delete schedule items
CREATE POLICY "event_schedule_delete_policy" ON public.event_schedule
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role_function = 'admin'
    )
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_schedule_updated_at
  BEFORE UPDATE ON public.event_schedule
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add comment to table
COMMENT ON TABLE public.event_schedule IS 'Stores chronological schedule items for events (activities, panels, concerts, etc.)';
COMMENT ON COLUMN public.event_schedule.time IS 'Start time in HH:MM format';
COMMENT ON COLUMN public.event_schedule.end_time IS 'End time in HH:MM format (optional)';
COMMENT ON COLUMN public.event_schedule.category IS 'Category: animation, conference, meet_greet, concert, gaming, cosplay, workshop, contest, screening, other';
COMMENT ON COLUMN public.event_schedule.day_date IS 'Date for multi-day events in YYYY-MM-DD format';
