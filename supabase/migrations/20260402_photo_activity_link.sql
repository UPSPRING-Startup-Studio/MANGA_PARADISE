-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration : Lier les photos cosplay aux activités du programme d'un événement
-- Table cible : cosplay_photos
-- Référence : event_schedule (table existante)
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Ajouter la colonne activity_id à cosplay_photos
ALTER TABLE public.cosplay_photos
ADD COLUMN IF NOT EXISTS activity_id UUID REFERENCES public.event_schedule(id) ON DELETE SET NULL;

-- 2. Index pour les requêtes par activité
CREATE INDEX IF NOT EXISTS idx_cosplay_photos_activity
ON public.cosplay_photos(activity_id) WHERE activity_id IS NOT NULL;

-- 3. Index composite event_id + activity_id pour les galeries par événement
CREATE INDEX IF NOT EXISTS idx_cosplay_photos_event_activity
ON public.cosplay_photos(event_id, activity_id) WHERE event_id IS NOT NULL;

-- 4. Fonction RPC pour récupérer les compteurs de photos par activité pour un événement
CREATE OR REPLACE FUNCTION public.get_event_photos_by_activity(p_event_id UUID)
RETURNS TABLE (
  activity_id UUID,
  activity_title TEXT,
  activity_start_time TEXT,
  activity_category TEXT,
  photo_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.activity_id,
    COALESCE(es.title, 'Non catégorisé')::TEXT AS activity_title,
    es.start_time::TEXT AS activity_start_time,
    es.category::TEXT AS activity_category,
    COUNT(cp.id) AS photo_count
  FROM public.cosplay_photos cp
  LEFT JOIN public.event_schedule es ON es.id = cp.activity_id
  WHERE cp.event_id = p_event_id
  GROUP BY cp.activity_id, es.title, es.start_time, es.category
  ORDER BY es.start_time NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
