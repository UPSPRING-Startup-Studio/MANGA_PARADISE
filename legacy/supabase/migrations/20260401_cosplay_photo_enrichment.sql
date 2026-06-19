-- Migration: Cosplay Photo Enrichment
-- Description: Système de photos enrichies par projet cosplay
--              (types, tags de personnes, métadonnées EXIF, infos événement)
-- Date: 2026-04-01

-- ─── Helper: trigger updated_at ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ─── Table: cosplay_photos ────────────────────────────────────────────────────
-- Photos d'un projet cosplay, enrichies avec type, infos événement et EXIF.

CREATE TABLE IF NOT EXISTS public.cosplay_photos (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  cosplay_id            UUID          NOT NULL REFERENCES public.cosplay_plans(id) ON DELETE CASCADE,
  user_id               UUID          NOT NULL REFERENCES auth.users(id)           ON DELETE CASCADE,
  photo_url             TEXT          NOT NULL,
  photo_type            TEXT          NOT NULL DEFAULT 'shooting'
                                        CHECK (photo_type IN ('toi', 'original', 'wip', 'shooting', 'detail')),
  event_id              UUID          REFERENCES public.events(id)                 ON DELETE SET NULL,
  event_name_manual     TEXT,
  event_date_manual     DATE,
  event_location_manual TEXT,
  caption               TEXT          CHECK (char_length(caption) <= 200),
  exif_date             TIMESTAMPTZ,
  exif_gps_lat          DOUBLE PRECISION,
  exif_gps_lng          DOUBLE PRECISION,
  sort_order            INTEGER       NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ─── Table: cosplay_photo_tags ────────────────────────────────────────────────
-- Tags de personnes sur une photo cosplay (cosplayers taggés avec pin x/y).

CREATE TABLE IF NOT EXISTS public.cosplay_photo_tags (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id          UUID          NOT NULL REFERENCES public.cosplay_photos(id) ON DELETE CASCADE,
  tagger_user_id    UUID          NOT NULL REFERENCES auth.users(id)            ON DELETE CASCADE,
  tagged_user_id    UUID          REFERENCES public.profiles(id)                ON DELETE SET NULL,
  tagged_name       TEXT,
  tagged_character  TEXT,
  tagged_social_link TEXT,
  pin_x             DOUBLE PRECISION NOT NULL CHECK (pin_x >= 0 AND pin_x <= 1),
  pin_y             DOUBLE PRECISION NOT NULL CHECK (pin_y >= 0 AND pin_y <= 1),
  status            TEXT          NOT NULL DEFAULT 'pending'
                                    CHECK (status IN ('pending', 'accepted', 'declined')),
  notified_at       TIMESTAMPTZ,
  accepted_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ─── Trigger: updated_at sur cosplay_photos ──────────────────────────────────

CREATE TRIGGER trg_cosplay_photos_updated_at
  BEFORE UPDATE ON public.cosplay_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_cosplay_photos_cosplay_id
  ON public.cosplay_photos(cosplay_id);

CREATE INDEX IF NOT EXISTS idx_cosplay_photos_event_id
  ON public.cosplay_photos(event_id)
  WHERE event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cosplay_photos_user_id
  ON public.cosplay_photos(user_id);

CREATE INDEX IF NOT EXISTS idx_cosplay_photo_tags_photo_id
  ON public.cosplay_photo_tags(photo_id);

CREATE INDEX IF NOT EXISTS idx_cosplay_photo_tags_tagged_user_status
  ON public.cosplay_photo_tags(tagged_user_id, status)
  WHERE tagged_user_id IS NOT NULL;

-- ─── Row Level Security: cosplay_photos ──────────────────────────────────────

ALTER TABLE public.cosplay_photos ENABLE ROW LEVEL SECURITY;

-- Tous les utilisateurs authentifiés peuvent voir les photos
CREATE POLICY "cosplay_photos_select"
  ON public.cosplay_photos
  FOR SELECT
  TO authenticated
  USING (true);

-- Seul le propriétaire peut insérer
CREATE POLICY "cosplay_photos_insert"
  ON public.cosplay_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Seul le propriétaire peut modifier
CREATE POLICY "cosplay_photos_update"
  ON public.cosplay_photos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Seul le propriétaire peut supprimer
CREATE POLICY "cosplay_photos_delete"
  ON public.cosplay_photos
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ─── Row Level Security: cosplay_photo_tags ──────────────────────────────────

ALTER TABLE public.cosplay_photo_tags ENABLE ROW LEVEL SECURITY;

-- Tags acceptés visibles par tous les utilisateurs authentifiés
CREATE POLICY "cosplay_photo_tags_select_accepted"
  ON public.cosplay_photo_tags
  FOR SELECT
  TO authenticated
  USING (status = 'accepted');

-- Le tagger et le taggé voient tous les statuts (pending / declined inclus)
CREATE POLICY "cosplay_photo_tags_select_involved"
  ON public.cosplay_photo_tags
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = tagger_user_id
    OR auth.uid() = tagged_user_id
  );

-- Tout utilisateur authentifié peut créer un tag
CREATE POLICY "cosplay_photo_tags_insert"
  ON public.cosplay_photo_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = tagger_user_id);

-- Seul le taggé peut modifier le statut (accepter / refuser)
CREATE POLICY "cosplay_photo_tags_update_status"
  ON public.cosplay_photo_tags
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = tagged_user_id)
  WITH CHECK (auth.uid() = tagged_user_id);

-- ─── Fonctions RPC ────────────────────────────────────────────────────────────

-- Nombre d'événements distincts liés aux photos d'un cosplay
CREATE OR REPLACE FUNCTION public.get_cosplay_events_count(p_cosplay_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(DISTINCT event_id)::INTEGER
  FROM public.cosplay_photos
  WHERE cosplay_id = p_cosplay_id
    AND event_id IS NOT NULL;
$$;

-- Nombre de personnes distinctes taggées et ayant accepté sur un cosplay
CREATE OR REPLACE FUNCTION public.get_cosplay_people_met(p_cosplay_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(DISTINCT tagged_user_id)::INTEGER
  FROM public.cosplay_photo_tags
  WHERE status = 'accepted'
    AND photo_id IN (
      SELECT id FROM public.cosplay_photos WHERE cosplay_id = p_cosplay_id
    );
$$;

-- ─── Storage Bucket: cosplay-photos ──────────────────────────────────────────
-- Stocke les photos enrichies uploadées pour les projets cosplay.
-- Chemin : {user_id}/{cosplay_id}/{timestamp}_{random}.{ext}

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cosplay-photos',
  'cosplay-photos',
  true,
  10485760, -- 10 Mo max par fichier
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Lecture publique (photos visibles dans la galerie)
CREATE POLICY "cosplay_photos_storage_select"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'cosplay-photos');

-- Upload uniquement dans son propre dossier ({user_id}/...)
CREATE POLICY "cosplay_photos_storage_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'cosplay-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Suppression uniquement de ses propres fichiers
CREATE POLICY "cosplay_photos_storage_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'cosplay-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─── Notify PostgREST ─────────────────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';
