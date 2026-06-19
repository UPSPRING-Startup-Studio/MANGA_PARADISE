-- =====================================================
-- MIGRATION: Visual Line-Up Phase 1 - Cleanup & Schema Evolution
-- DATE: 2026-02-16
-- DESCRIPTION: 
--   1. Truncate event_participants table (remove all test data)
--   2. Add new columns for Visual Line-Up feature:
--      - attendance_dates: TEXT[] (array of dates)
--      - role: TEXT (visitor, cosplayer, photographer, volunteer)
--      - cosplay_details: JSONB (character info per date)
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
-- STEP 5: VERIFY RLS IS ENABLED
-- =====================================================

ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- Ensure existing RLS policies are in place
-- (These should already exist from 20260214_event_participants_rls.sql)
-- The policies allow users to INSERT/UPDATE their own rows
