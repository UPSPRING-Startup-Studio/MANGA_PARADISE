-- Migration: Enriched Photo Tags
-- Adds linked_cosplay_id + RLS + indexes to cosplay_photo_tags
-- Date: 2026-04-02

-- ─── 1. Nouveau champ : cosplay choisi par le taggé lors de l'acceptation ─────

ALTER TABLE public.cosplay_photo_tags
  ADD COLUMN IF NOT EXISTS linked_cosplay_id UUID
    REFERENCES public.cosplay_plans(id) ON DELETE SET NULL;

-- ─── 2. RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE public.cosplay_photo_tags ENABLE ROW LEVEL SECURITY;

-- SELECT : tout utilisateur authentifié peut lire (pour voir les pins)
DROP POLICY IF EXISTS "cpt_select" ON public.cosplay_photo_tags;
CREATE POLICY "cpt_select" ON public.cosplay_photo_tags
  FOR SELECT TO authenticated USING (true);

-- INSERT : tout authentifié peut créer un tag (tagger)
DROP POLICY IF EXISTS "cpt_insert" ON public.cosplay_photo_tags;
CREATE POLICY "cpt_insert" ON public.cosplay_photo_tags
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = tagger_user_id);

-- UPDATE : uniquement le taggé peut modifier (status, linked_cosplay_id, etc.)
DROP POLICY IF EXISTS "cpt_update" ON public.cosplay_photo_tags;
CREATE POLICY "cpt_update" ON public.cosplay_photo_tags
  FOR UPDATE TO authenticated USING (auth.uid() = tagged_user_id);

-- DELETE : le tagger OU le taggé peuvent supprimer
DROP POLICY IF EXISTS "cpt_delete" ON public.cosplay_photo_tags;
CREATE POLICY "cpt_delete" ON public.cosplay_photo_tags
  FOR DELETE TO authenticated USING (
    auth.uid() = tagger_user_id OR auth.uid() = tagged_user_id
  );

-- ─── 3. Index ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_cpt_photo_id
  ON public.cosplay_photo_tags(photo_id);

CREATE INDEX IF NOT EXISTS idx_cpt_tagged_user_status
  ON public.cosplay_photo_tags(tagged_user_id, status)
  WHERE tagged_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cpt_linked_cosplay
  ON public.cosplay_photo_tags(linked_cosplay_id)
  WHERE linked_cosplay_id IS NOT NULL;

-- ─── 4. Notification trigger (replaces 20260402_photo_tag_notification) ──────

CREATE OR REPLACE FUNCTION notify_photo_tag()
RETURNS TRIGGER AS $$
DECLARE
  v_tagger_username TEXT;
BEGIN
  IF NEW.tagged_user_id IS NOT NULL AND NEW.status = 'pending' THEN

    SELECT username INTO v_tagger_username
    FROM profiles WHERE id = NEW.tagger_user_id;

    INSERT INTO notifications (user_id, sender_id, type, content, related_link, is_read)
    VALUES (
      NEW.tagged_user_id,
      NEW.tagger_user_id,
      'PHOTO_TAG',
      COALESCE(v_tagger_username, 'Un membre') || ' t''a tagué(e) sur une photo',
      NEW.id::TEXT,
      false
    );

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_photo_tag ON public.cosplay_photo_tags;
CREATE TRIGGER trg_notify_photo_tag
  AFTER INSERT ON public.cosplay_photo_tags
  FOR EACH ROW EXECUTE FUNCTION notify_photo_tag();

-- ─── Notify PostgREST ─────────────────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';
