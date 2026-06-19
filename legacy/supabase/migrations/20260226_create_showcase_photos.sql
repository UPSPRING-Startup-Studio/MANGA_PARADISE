-- Migration: Create Cosplay Showcase Photos
-- Description: Add photo gallery (Book Photo) for finished cosplay projects
-- Date: 2026-02-26

-- ─── Table: cosplay_showcase_photos ───────────────────────────────────────────
-- Stores photos uploaded by users for their finished cosplay showcase pages.
-- Each photo is linked to a cosplay_plan (the finished project).

CREATE TABLE IF NOT EXISTS public.cosplay_showcase_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cosplay_plan_id UUID NOT NULL REFERENCES public.cosplay_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_showcase_photos_cosplay_plan_id
  ON public.cosplay_showcase_photos(cosplay_plan_id);

CREATE INDEX IF NOT EXISTS idx_showcase_photos_user_id
  ON public.cosplay_showcase_photos(user_id);

-- ─── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE public.cosplay_showcase_photos ENABLE ROW LEVEL SECURITY;

-- Users can view their own photos
CREATE POLICY "Users can view their own showcase photos"
  ON public.cosplay_showcase_photos
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own photos
CREATE POLICY "Users can insert their own showcase photos"
  ON public.cosplay_showcase_photos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own photos
CREATE POLICY "Users can delete their own showcase photos"
  ON public.cosplay_showcase_photos
  FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Storage Bucket: showcase-photos ──────────────────────────────────────────
-- Creates the Supabase Storage bucket for showcase photo uploads.
-- Files are stored under: {user_id}/{cosplay_plan_id}/{filename}

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'showcase-photos',
  'showcase-photos',
  true,
  10485760, -- 10 MB max per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own showcase photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'showcase-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS: Allow public read access (photos are public in the showcase)
CREATE POLICY "Public read access for showcase photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'showcase-photos');

-- Storage RLS: Allow users to delete their own photos
CREATE POLICY "Users can delete their own showcase photo files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'showcase-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─── Notify PostgREST to reload schema ────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
