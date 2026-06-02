-- Migration: Add shot_date to cosplay_photos
-- Description: Adds a dedicated DATE column for the day a photo was taken.
--              This is the normalized business date, distinct from:
--              - exif_date (technical source from EXIF metadata)
--              - event_date_manual (legacy field for external event date)
--              - created_at (upload timestamp)
-- Date: 2026-04-03

-- ─── 1. Colonne shot_date ─────────────────────────────────────────────────────

ALTER TABLE public.cosplay_photos
  ADD COLUMN IF NOT EXISTS shot_date DATE;

COMMENT ON COLUMN public.cosplay_photos.shot_date
  IS 'Jour de prise de vue normalisé. Priorité : saisie manuelle > exif_date > date événement.';

-- ─── 2. Index composite pour filtrage par événement + jour ────────────────────

CREATE INDEX IF NOT EXISTS idx_cosplay_photos_event_shot_date
  ON public.cosplay_photos(event_id, shot_date)
  WHERE event_id IS NOT NULL AND shot_date IS NOT NULL;

-- ─── 3. Index simple sur shot_date pour tri global ────────────────────────────

CREATE INDEX IF NOT EXISTS idx_cosplay_photos_shot_date
  ON public.cosplay_photos(shot_date)
  WHERE shot_date IS NOT NULL;

-- ─── 4. Backfill : dériver shot_date depuis exif_date pour les photos existantes

UPDATE public.cosplay_photos
SET shot_date = (exif_date AT TIME ZONE 'UTC')::DATE
WHERE shot_date IS NULL
  AND exif_date IS NOT NULL;

-- ─── Notify PostgREST ─────────────────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';
