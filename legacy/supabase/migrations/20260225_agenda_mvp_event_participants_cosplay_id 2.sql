-- ============================================================
-- MIGRATION: Agenda MVP - Enrichissement de event_participants
-- Date: 2026-02-25
-- Description: Ajoute le champ cosplay_id (FK vers cosplay_plans) pour
--   la fonctionnalité Visual Line-Up. Distinct de planned_cosplay_id
--   (qui référence cosplay_vestiaire - legacy).
--   Ajoute aussi attendance_dates et cosplay_data si absents (idempotent).
-- ============================================================

-- 1. Ajouter cosplay_id: référence vers cosplay_plans (nouveau système)
--    Permet de lier une participation à un cosplan précis pour le Visual Line-Up
ALTER TABLE public.event_participants
  ADD COLUMN IF NOT EXISTS cosplay_id UUID REFERENCES public.cosplay_plans(id) ON DELETE SET NULL;

-- 2. Ajouter attendance_dates si absent (JSONB array de dates de présence)
ALTER TABLE public.event_participants
  ADD COLUMN IF NOT EXISTS attendance_dates JSONB;

-- 3. Ajouter cosplay_data si absent (JSONB array de données cosplay par jour)
ALTER TABLE public.event_participants
  ADD COLUMN IF NOT EXISTS cosplay_data JSONB;

-- 4. Ajouter universe si absent (univers du cosplay pour affichage rapide)
ALTER TABLE public.event_participants
  ADD COLUMN IF NOT EXISTS universe TEXT;

-- 5. Index sur cosplay_id pour les jointures Visual Line-Up
CREATE INDEX IF NOT EXISTS idx_event_participants_cosplay_id
  ON public.event_participants (cosplay_id)
  WHERE cosplay_id IS NOT NULL;

-- 6. Index sur event_id + user_id pour les lookups rapides
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_participants_event_user_unique
  ON public.event_participants (event_id, user_id);

-- 7. Commentaires de documentation
COMMENT ON COLUMN public.event_participants.cosplay_id IS 'Référence vers cosplay_plans (nouveau système). Utilisé pour le Visual Line-Up.';
COMMENT ON COLUMN public.event_participants.attendance_dates IS 'Array JSON des dates de présence: ["2025-04-12", "2025-04-13"]';
COMMENT ON COLUMN public.event_participants.cosplay_data IS 'Array JSON des données cosplay par jour: [{ character, universe, date, imageUrl }]';
COMMENT ON COLUMN public.event_participants.universe IS 'Univers du cosplay principal pour affichage rapide dans le Line-Up';

-- 8. RLS: Politique pour cosplay_id (hérite des policies existantes)
-- Les participants peuvent voir les participations de tous (pour le Line-Up public)
-- Seul le propriétaire peut modifier sa propre participation
