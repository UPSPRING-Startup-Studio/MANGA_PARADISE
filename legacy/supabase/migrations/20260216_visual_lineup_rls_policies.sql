-- =====================================================
-- MIGRATION: Visual Line-Up RLS Policies Update
-- DATE: 2026-02-16
-- DESCRIPTION: Ensures RLS policies allow users to INSERT/UPDATE
--              the new Visual Line-Up columns (attendance_dates, role, cosplay_details)
-- =====================================================

-- =====================================================
-- VERIFY RLS IS ENABLED
-- =====================================================

ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DROP EXISTING POLICIES (to avoid conflicts)
-- =====================================================

DROP POLICY IF EXISTS "event_participants_select_own" ON public.event_participants;
DROP POLICY IF EXISTS "event_participants_insert_own" ON public.event_participants;
DROP POLICY IF EXISTS "event_participants_update_own" ON public.event_participants;
DROP POLICY IF EXISTS "event_participants_delete_own" ON public.event_participants;
DROP POLICY IF EXISTS "event_participants_admin_all" ON public.event_participants;
DROP POLICY IF EXISTS "event_participants_public_read" ON public.event_participants;

-- =====================================================
-- CREATE NEW RLS POLICIES
-- =====================================================

-- Policy: Users can read their own registrations
CREATE POLICY "event_participants_select_own" ON public.event_participants
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own registrations (including new columns)
CREATE POLICY "event_participants_insert_own" ON public.event_participants
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own registrations (including new columns)
-- This is crucial for Visual Line-Up: users must be able to update
-- attendance_dates, role, and cosplay_details
CREATE POLICY "event_participants_update_own" ON public.event_participants
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own registrations
CREATE POLICY "event_participants_delete_own" ON public.event_participants
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Admins can perform all operations on event_participants
CREATE POLICY "event_participants_admin_all" ON public.event_participants
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role_function = 'admin'
    )
  );

-- Policy: Public can read registrations (for event participant lists)
-- This allows displaying the Visual Line-Up publicly
CREATE POLICY "event_participants_public_read" ON public.event_participants
  FOR SELECT
  USING (true);

-- =====================================================
-- VERIFY INDEXES EXIST
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON public.event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON public.event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_event ON public.event_participants(user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_attendance_dates ON public.event_participants USING GIN (attendance_dates);
CREATE INDEX IF NOT EXISTS idx_event_participants_role ON public.event_participants(role);

-- =====================================================
-- FINAL COMMENT
-- =====================================================

COMMENT ON TABLE public.event_participants IS 'Stores user registrations to events with role, attendance dates, and cosplay information for Visual Line-Up feature';
