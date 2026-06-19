-- =====================================================
-- MANUAL APPLICATION SCRIPT: Visual Line-Up Phase 1
-- DATE: 2026-02-16
-- DESCRIPTION: Execute this script directly in Supabase SQL Editor
--              to apply Visual Line-Up Phase 1 changes
-- =====================================================

-- =====================================================
-- STEP 1: TRUNCATE event_participants (Clean slate)
-- =====================================================

TRUNCATE TABLE public.event_participants CASCADE;

-- =====================================================
-- STEP 2: ADD NEW COLUMNS FOR VISUAL LINE-UP
-- =====================================================

-- Add attendance_dates column (array of dates)
ALTER TABLE public.event_participants
ADD COLUMN IF NOT EXISTS attendance_dates TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add role column (visitor, cosplayer, photographer, volunteer)
ALTER TABLE public.event_participants
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'visitor';

-- Add cosplay_details column (JSONB with character info per date)
ALTER TABLE public.event_participants
ADD COLUMN IF NOT EXISTS cosplay_details JSONB DEFAULT '{}'::JSONB;

-- Add cosplay_data column (JSONB - Array structure for advanced search)
ALTER TABLE public.event_participants
ADD COLUMN IF NOT EXISTS cosplay_data JSONB DEFAULT '[]'::JSONB;

-- Add universe column (TEXT - Indexed for fast search)
ALTER TABLE public.event_participants
ADD COLUMN IF NOT EXISTS universe TEXT;

-- =====================================================
-- STEP 3: ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN public.event_participants.attendance_dates 
IS 'Array of dates when the participant will attend (format: YYYY-MM-DD)';

COMMENT ON COLUMN public.event_participants.role 
IS 'Role of participant: visitor, cosplayer, photographer, volunteer';

COMMENT ON COLUMN public.event_participants.cosplay_details 
IS 'JSONB object mapping dates to cosplay info: {"2026-03-07": {"character": "Luffy", "universe": "One Piece", "imageUrl": "..."}}';

COMMENT ON COLUMN public.event_participants.cosplay_data 
IS 'JSONB array structure for advanced search: [{"character": "Luffy", "universe": "One Piece", "date": "2026-03-07", "imageUrl": "..."}]';

COMMENT ON COLUMN public.event_participants.universe 
IS 'Primary universe/franchise for indexed fast search (e.g., "One Piece", "Naruto", "Attack on Titan")';

-- =====================================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_event_participants_attendance_dates 
ON public.event_participants USING GIN (attendance_dates);

CREATE INDEX IF NOT EXISTS idx_event_participants_role 
ON public.event_participants(role);

CREATE INDEX IF NOT EXISTS idx_event_participants_universe 
ON public.event_participants(universe);

CREATE INDEX IF NOT EXISTS idx_event_participants_cosplay_data 
ON public.event_participants USING GIN (cosplay_data);

-- =====================================================
-- STEP 5: VERIFY RLS IS ENABLED AND UPDATE POLICIES
-- =====================================================

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
-- STEP 6: VERIFY INDEXES EXIST
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON public.event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON public.event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_event ON public.event_participants(user_id, event_id);

-- =====================================================
-- STEP 7: FINAL COMMENT
-- =====================================================

COMMENT ON TABLE public.event_participants IS 'Stores user registrations to events with role, attendance dates, and cosplay information for Visual Line-Up feature';

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify the schema is correct:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'event_participants' ORDER BY ordinal_position;
