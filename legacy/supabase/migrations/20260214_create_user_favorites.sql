-- =====================================================
-- MIGRATION: user_favorites Table Setup
-- DATE: 2026-02-14
-- DESCRIPTION: Creates the user_favorites table for 
--              managing user's favorite schedule activities
-- =====================================================

-- Create user_favorites table
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.event_schedule(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, activity_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_activity_id ON public.user_favorites(activity_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_event_id ON public.user_favorites(event_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_event ON public.user_favorites(user_id, event_id);

-- Enable Row Level Security
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Users can read their own favorites
CREATE POLICY "user_favorites_select_policy" ON public.user_favorites
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own favorites
CREATE POLICY "user_favorites_insert_policy" ON public.user_favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own favorites
CREATE POLICY "user_favorites_delete_policy" ON public.user_favorites
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments to table
COMMENT ON TABLE public.user_favorites IS 'Stores user favorite schedule activities for events';
COMMENT ON COLUMN public.user_favorites.user_id IS 'User who favorited the activity';
COMMENT ON COLUMN public.user_favorites.activity_id IS 'Reference to event_schedule activity';
COMMENT ON COLUMN public.user_favorites.event_id IS 'Reference to the event (for faster filtering)';
