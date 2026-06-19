-- =====================================================
-- MIGRATION: Add media_type and media_link to contest_registrations
-- DATE: 2026-02-16
-- DESCRIPTION: Extends contest_registrations to support video files
--              and external links (YouTube/Vimeo) in addition to audio
-- =====================================================

-- Add media_type column (audio, video, link)
ALTER TABLE public.contest_registrations 
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'audio' CHECK (media_type IN ('audio', 'video', 'link'));

-- Add media_link column for external URLs
ALTER TABLE public.contest_registrations 
ADD COLUMN IF NOT EXISTS media_link TEXT;

-- Add comments
COMMENT ON COLUMN public.contest_registrations.media_type IS 'Type of media: audio (MP3), video (MP4), or link (YouTube/Vimeo)';
COMMENT ON COLUMN public.contest_registrations.media_link IS 'External link for YouTube/Vimeo videos (unlisted)';

-- Note: audio_file_url will be reused for video uploads as well
COMMENT ON COLUMN public.contest_registrations.audio_file_url IS 'URL for uploaded audio or video file from Supabase Storage';
