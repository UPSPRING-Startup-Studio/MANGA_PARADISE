-- =====================================================
-- MIGRATION: contest_registrations Table
-- DATE: 2026-02-16
-- DESCRIPTION: Creates a table to store cosplay contest
--              registration entries with full candidate details
-- =====================================================

-- Drop table if exists (for idempotency)
DROP TABLE IF EXISTS public.contest_registrations;

-- Create the contest registrations table
CREATE TABLE public.contest_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.event_schedule(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'waitlist')),

  -- Cosplay Data
  character_name TEXT NOT NULL,
  universe TEXT,
  format TEXT NOT NULL CHECK (format IN ('solo', 'duo', 'trio', 'quatuor', 'group')),
  group_name TEXT,

  -- File URLs (Supabase Storage)
  ref_image_url TEXT,
  wip_image_url TEXT,
  audio_file_url TEXT,

  -- Technical Needs
  lighting_needs JSONB DEFAULT '{}'::jsonb,
  props_needs TEXT,

  -- Minor Authorization
  is_minor BOOLEAN DEFAULT false,
  guardian_name TEXT,
  guardian_consent BOOLEAN DEFAULT false,

  -- Admin Management
  admin_notes TEXT,
  order_position INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments
COMMENT ON TABLE public.contest_registrations IS 'Stores cosplay contest registration entries with candidate details, files, and admin management';
COMMENT ON COLUMN public.contest_registrations.status IS 'Registration status: pending, approved, rejected, waitlist';
COMMENT ON COLUMN public.contest_registrations.format IS 'Performance format: solo, duo, trio, quatuor, group';
COMMENT ON COLUMN public.contest_registrations.lighting_needs IS 'JSON object with lighting preferences: { color, details }';
COMMENT ON COLUMN public.contest_registrations.order_position IS 'Order of passage on stage, set by admin';

-- Indexes for performance
CREATE INDEX idx_contest_registrations_event ON public.contest_registrations(event_id);
CREATE INDEX idx_contest_registrations_activity ON public.contest_registrations(activity_id);
CREATE INDEX idx_contest_registrations_user ON public.contest_registrations(user_id);
CREATE INDEX idx_contest_registrations_status ON public.contest_registrations(status);

-- RLS Policies
ALTER TABLE public.contest_registrations ENABLE ROW LEVEL SECURITY;

-- Users can read their own registrations
CREATE POLICY "Users can view own registrations"
  ON public.contest_registrations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own registrations
CREATE POLICY "Users can create own registrations"
  ON public.contest_registrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending registrations
CREATE POLICY "Users can update own pending registrations"
  ON public.contest_registrations
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all registrations (via service role or admin check)
CREATE POLICY "Admins can view all registrations"
  ON public.contest_registrations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Admins can update all registrations (status, notes, order)
CREATE POLICY "Admins can update all registrations"
  ON public.contest_registrations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Grant access
GRANT SELECT, INSERT, UPDATE ON public.contest_registrations TO authenticated;
