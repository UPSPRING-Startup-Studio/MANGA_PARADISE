-- =====================================================
-- MIGRATION: event_participants RLS Setup
-- DATE: 2026-02-14
-- DESCRIPTION: Ensures event_participants table has proper RLS policies
--              to allow users to read and manage their own registrations
-- =====================================================

-- Enable Row Level Security on event_participants if not already enabled
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "event_participants_select_own" ON public.event_participants;
DROP POLICY IF EXISTS "event_participants_insert_own" ON public.event_participants;
DROP POLICY IF EXISTS "event_participants_update_own" ON public.event_participants;
DROP POLICY IF EXISTS "event_participants_delete_own" ON public.event_participants;
DROP POLICY IF EXISTS "event_participants_admin_all" ON public.event_participants;
DROP POLICY IF EXISTS "event_participants_public_read" ON public.event_participants;

-- Policy: Users can read their own registrations
CREATE POLICY "event_participants_select_own" ON public.event_participants
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own registrations
CREATE POLICY "event_participants_insert_own" ON public.event_participants
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own registrations
CREATE POLICY "event_participants_update_own" ON public.event_participants
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own registrations
CREATE POLICY "event_participants_delete_own" ON public.event_participants
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Admins can read all registrations
CREATE POLICY "event_participants_admin_all" ON public.event_participants
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role_function = 'admin'
    )
  );

-- Policy: Public can read registrations (for event participant lists)
CREATE POLICY "event_participants_public_read" ON public.event_participants
  FOR SELECT
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON public.event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON public.event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_event ON public.event_participants(user_id, event_id);

-- Add comment to table
COMMENT ON TABLE public.event_participants IS 'Stores user registrations to events with role and cosplay information';
