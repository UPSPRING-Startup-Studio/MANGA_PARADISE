-- =====================================================
-- SCRIPT SQL : Ajouter contest_config à event_schedule
-- DATE: 2026-02-16
-- DESCRIPTION: Ajoute la colonne JSONB contest_config pour
--              stocker la configuration des concours cosplay
-- =====================================================
-- INSTRUCTIONS D'APPLICATION :
-- 1. Ouvrir Supabase Dashboard > SQL Editor
-- 2. Copier-coller ce script
-- 3. Exécuter (Run)
-- =====================================================

-- Add contest_config column with default configuration
ALTER TABLE public.event_schedule 
ADD COLUMN IF NOT EXISTS contest_config JSONB DEFAULT '{
  "prejudging_time": "10:00",
  "stage_dimensions": "",
  "dressing_info": "",
  "allow_lights": false,
  "allow_props": false,
  "allowed_formats": {
    "solo": { "enabled": true, "max_duration_sec": 90 },
    "duo": { "enabled": true, "max_duration_sec": 120 },
    "trio": { "enabled": true, "max_duration_sec": 180 },
    "quatuor": { "enabled": true, "max_duration_sec": 210 },
    "group": { "enabled": true, "max_duration_sec": 240, "max_participants": 12 }
  }
}'::jsonb;

-- Add comment to column
COMMENT ON COLUMN public.event_schedule.contest_config IS 'Configuration JSON pour les concours cosplay : formats autorisés, durées max, heure pré-judging, logistique scène';

-- Create index for JSONB queries (optional but recommended for performance)
CREATE INDEX IF NOT EXISTS idx_event_schedule_contest_config ON public.event_schedule USING GIN (contest_config);

-- =====================================================
-- VÉRIFICATION
-- =====================================================
-- Après exécution, vérifier que la colonne existe :
-- SELECT id, title, contest_config FROM public.event_schedule WHERE type = 'contest' LIMIT 5;
