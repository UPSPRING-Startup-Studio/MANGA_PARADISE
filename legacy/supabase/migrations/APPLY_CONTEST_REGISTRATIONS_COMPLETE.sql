-- =====================================================
-- SCRIPT SQL CONSOLIDÉ : Contest Registrations (COMPLET)
-- DATE: 2026-02-16
-- DESCRIPTION: Crée la table contest_registrations avec toutes
--              les colonnes nécessaires (media_type, media_link, etc.)
--              et configure les politiques RLS
-- =====================================================
-- INSTRUCTIONS D'APPLICATION :
-- 1. Ouvrir Supabase Dashboard > SQL Editor
-- 2. Copier-coller ce script complet
-- 3. Exécuter (Run)
-- =====================================================

-- Drop table if exists (pour réinitialisation propre)
DROP TABLE IF EXISTS public.contest_registrations CASCADE;

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

  -- Media Support (Audio, Video, External Link)
  media_type TEXT DEFAULT 'audio' CHECK (media_type IN ('audio', 'video', 'link')),
  audio_file_url TEXT, -- Reused for both audio and video uploads
  media_link TEXT, -- For YouTube/Vimeo external links

  -- Additional Files
  ref_image_url TEXT,
  wip_image_url TEXT,

  -- Technical Needs
  lighting_needs JSONB DEFAULT '{}'::jsonb,
  props_needs TEXT,

  -- Minor Authorization
  is_minor BOOLEAN DEFAULT false,
  guardian_name TEXT,
  guardian_consent BOOLEAN DEFAULT false,
  guardian_phone TEXT,
  guardian_email TEXT,

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
COMMENT ON COLUMN public.contest_registrations.media_type IS 'Type of media: audio (MP3), video (MP4), or link (YouTube/Vimeo)';
COMMENT ON COLUMN public.contest_registrations.audio_file_url IS 'URL for uploaded audio or video file from Supabase Storage';
COMMENT ON COLUMN public.contest_registrations.media_link IS 'External link for YouTube/Vimeo videos (unlisted)';
COMMENT ON COLUMN public.contest_registrations.lighting_needs IS 'JSON object with lighting preferences: { enabled, details }';
COMMENT ON COLUMN public.contest_registrations.order_position IS 'Order of passage on stage, set by admin';

-- Indexes for performance
CREATE INDEX idx_contest_registrations_event ON public.contest_registrations(event_id);
CREATE INDEX idx_contest_registrations_activity ON public.contest_registrations(activity_id);
CREATE INDEX idx_contest_registrations_user ON public.contest_registrations(user_id);
CREATE INDEX idx_contest_registrations_status ON public.contest_registrations(status);

-- =====================================================
-- RLS POLICIES
-- =====================================================
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

-- =====================================================
-- VÉRIFICATION
-- =====================================================
-- Après exécution, vérifier que la table existe :
-- SELECT * FROM public.contest_registrations LIMIT 1;
