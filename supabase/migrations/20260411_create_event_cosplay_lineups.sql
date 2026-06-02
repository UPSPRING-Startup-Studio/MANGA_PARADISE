-- ==============================================================
-- Création de event_cosplay_lineups + RLS
-- Extrait du Lot 1 (20260410) — sections C + H1 uniquement.
-- À exécuter dans le SQL Editor de Supabase.
-- ==============================================================

-- ── Table ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.event_cosplay_lineups (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL
                        REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id            UUID        NOT NULL
                        REFERENCES public.events(id) ON DELETE CASCADE,
  cosplay_project_id  UUID
                        REFERENCES public.cosplay_plans(id) ON DELETE SET NULL,
  event_date          DATE        NOT NULL,
  slot_type           TEXT        NOT NULL DEFAULT 'full_day'
                        CHECK (slot_type IN ('full_day','morning','afternoon')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_ecl_user_event_date_slot
    UNIQUE (user_id, event_id, event_date, slot_type)
);

-- ── Index ─────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_ecl_user_id
  ON public.event_cosplay_lineups (user_id);
CREATE INDEX IF NOT EXISTS idx_ecl_event_id
  ON public.event_cosplay_lineups (event_id);
CREATE INDEX IF NOT EXISTS idx_ecl_cosplay_project_id
  ON public.event_cosplay_lineups (cosplay_project_id)
  WHERE cosplay_project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ecl_event_date
  ON public.event_cosplay_lineups (event_date);

-- ── Trigger updated_at ───────────────────────────────────────

-- Réutilise la fonction existante update_updated_at_column()
-- Si elle n'existe pas, la créer :
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ecl_updated_at ON public.event_cosplay_lineups;
CREATE TRIGGER trg_ecl_updated_at
  BEFORE UPDATE ON public.event_cosplay_lineups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ── RLS ───────────────────────────────────────────────────────

ALTER TABLE public.event_cosplay_lineups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ecl_select_authenticated" ON public.event_cosplay_lineups;
CREATE POLICY "ecl_select_authenticated"
  ON public.event_cosplay_lineups FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "ecl_select_anon" ON public.event_cosplay_lineups;
CREATE POLICY "ecl_select_anon"
  ON public.event_cosplay_lineups FOR SELECT
  TO anon USING (true);

DROP POLICY IF EXISTS "ecl_insert_owner" ON public.event_cosplay_lineups;
CREATE POLICY "ecl_insert_owner"
  ON public.event_cosplay_lineups FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ecl_update_owner" ON public.event_cosplay_lineups;
CREATE POLICY "ecl_update_owner"
  ON public.event_cosplay_lineups FOR UPDATE
  TO authenticated
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ecl_delete_owner" ON public.event_cosplay_lineups;
CREATE POLICY "ecl_delete_owner"
  ON public.event_cosplay_lineups FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ── Reload schema cache ──────────────────────────────────────

NOTIFY pgrst, 'reload schema';
