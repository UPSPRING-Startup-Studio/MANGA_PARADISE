-- ============================================================================
-- Migration : Photos de groupe (>10 personnes) + auto-tagging
-- Date : 2026-04-02
-- ============================================================================

-- 1. Ajouter la colonne is_group_photo à cosplay_photos
ALTER TABLE public.cosplay_photos
  ADD COLUMN IF NOT EXISTS is_group_photo BOOLEAN NOT NULL DEFAULT false;

-- 2. RLS : permettre l'auto-tagging sur les photos de groupe associées à un event
--    Tout utilisateur authentifié peut INSERT un tag sur une photo de groupe
--    si la photo est liée à un événement ET que is_group_photo = true.
--    La policy existante gère déjà l'INSERT pour le propriétaire.
--    On ajoute une policy supplémentaire pour les participants.

DROP POLICY IF EXISTS "group_photo_self_tag" ON public.cosplay_photo_tags;
CREATE POLICY "group_photo_self_tag"
  ON public.cosplay_photo_tags
  FOR INSERT
  WITH CHECK (
    -- L'utilisateur doit être authentifié
    auth.uid() IS NOT NULL
    -- Le tagger doit être l'utilisateur lui-même
    AND tagger_user_id = auth.uid()
    -- L'utilisateur se tague lui-même (auto-tag)
    AND tagged_user_id = auth.uid()
    -- La photo doit être une photo de groupe associée à un event
    AND EXISTS (
      SELECT 1 FROM public.cosplay_photos cp
      WHERE cp.id = photo_id
        AND cp.is_group_photo = true
        AND cp.event_id IS NOT NULL
    )
  );
