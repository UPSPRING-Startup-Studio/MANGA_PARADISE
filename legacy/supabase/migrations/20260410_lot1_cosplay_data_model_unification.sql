-- ==============================================================
-- LOT 1 — Unification du modele cosplay
-- Date : 2026-04-10
--
-- Converger vers cosplay_plans comme source de verite unique.
-- Creer event_cosplay_lineups + cosplay_incarnations.
-- Migrer les donnees legacy. Aucune table legacy supprimee.
-- ==============================================================


-- ============================================================
-- A. NORMALISATION DE cosplay_plans
-- ============================================================

-- A1. Convertir status : enum cosplan_status -> TEXT
-- L'enum reste en base (pas droppee) ; la colonne ne l'utilise plus.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'cosplay_plans'
      AND column_name  = 'status'
      AND udt_name     = 'cosplan_status'
  ) THEN
    ALTER TABLE public.cosplay_plans
      ALTER COLUMN status TYPE TEXT USING status::TEXT;
  END IF;
END $$;

ALTER TABLE public.cosplay_plans
  ALTER COLUMN status SET DEFAULT 'wishlist';

-- A2. Supprimer tout CHECK existant sur la colonne status
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM   pg_constraint con
    JOIN   pg_attribute  att
      ON   att.attnum    = ANY(con.conkey)
      AND  att.attrelid  = con.conrelid
    WHERE  con.conrelid  = 'public.cosplay_plans'::regclass
      AND  con.contype   = 'c'
      AND  att.attname   = 'status'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.cosplay_plans DROP CONSTRAINT %I',
      r.conname
    );
  END LOOP;
END $$;

-- A3. Nouveau CHECK : anciens + nouveaux statuts (coexistence)
ALTER TABLE public.cosplay_plans
  ADD CONSTRAINT cosplay_plans_status_check
  CHECK (status IN (
    'wishlist','started','in_progress',
    'paused','finished','completed'
  ));

-- A4. Ajouter completed_at
ALTER TABLE public.cosplay_plans
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- A5. Normaliser les donnees : started -> in_progress
UPDATE public.cosplay_plans
SET    status = 'in_progress'
WHERE  status = 'started';

-- A6. Normaliser les donnees : finished -> completed
UPDATE public.cosplay_plans
SET    status = 'completed'
WHERE  status = 'finished';

-- A7. Backfill completed_at pour les completed sans date
UPDATE public.cosplay_plans
SET    completed_at = COALESCE(updated_at, created_at)
WHERE  status = 'completed'
  AND  completed_at IS NULL;

-- A8. Coherence : is_in_wardrobe=true doit etre completed
UPDATE public.cosplay_plans
SET    status       = 'completed',
       completed_at = COALESCE(completed_at, updated_at, created_at)
WHERE  is_in_wardrobe = true
  AND  status NOT IN ('completed');

-- A9. Trigger de compatibilite frontend
-- Convertit silencieusement started->in_progress, finished->completed.
-- Renseigne completed_at auto. Vide completed_at si on quitte completed.
CREATE OR REPLACE FUNCTION public.normalize_cosplan_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Compat : anciens noms de statut
  IF NEW.status = 'started' THEN
    NEW.status := 'in_progress';
  END IF;
  IF NEW.status = 'finished' THEN
    NEW.status := 'completed';
  END IF;

  -- Auto-renseigner completed_at
  IF NEW.status = 'completed' AND NEW.completed_at IS NULL THEN
    NEW.completed_at := NOW();
  END IF;

  -- Vider completed_at si on quitte completed (UPDATE uniquement)
  IF TG_OP = 'UPDATE'
     AND NEW.status <> 'completed'
     AND OLD.status  = 'completed'
  THEN
    NEW.completed_at := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalize_cosplan_status ON public.cosplay_plans;
CREATE TRIGGER trg_normalize_cosplan_status
  BEFORE INSERT OR UPDATE ON public.cosplay_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_cosplan_status();

-- A10. Index partiel pour les requetes vestiaire
CREATE INDEX IF NOT EXISTS idx_cosplay_plans_completed
  ON public.cosplay_plans (user_id, completed_at DESC NULLS LAST)
  WHERE status = 'completed';


-- ============================================================
-- B. MIGRATION cosplay_vestiaire -> cosplay_plans
-- ============================================================

-- B1. Backfill source_vestiaire_id sur les plans completed
--     qui matchent un vestiaire par (user, character, universe)
--     mais dont source_vestiaire_id est encore NULL.
--     Necessaire pour que D1 puisse resoudre les FK lineups.
WITH candidates AS (
  SELECT DISTINCT ON (cv.id)
    cv.id  AS vestiaire_id,
    cp.id  AS plan_id
  FROM   public.cosplay_vestiaire cv
  JOIN   public.cosplay_plans cp
    ON   cp.user_id        = cv.user_id
    AND  cp.character_name = cv.character_name
    AND  cp.universe       = cv.universe
    AND  cp.status         = 'completed'
    AND  cp.source_vestiaire_id IS NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM public.cosplay_plans cp2
    WHERE  cp2.source_vestiaire_id = cv.id
  )
  ORDER BY cv.id, cp.created_at ASC
)
UPDATE public.cosplay_plans p
SET    source_vestiaire_id = c.vestiaire_id
FROM   candidates c
WHERE  p.id = c.plan_id;

-- B2. Inserer les orphelins de cosplay_vestiaire
-- (ni par source_vestiaire_id, ni par dedup naturelle)
INSERT INTO public.cosplay_plans (
  user_id, character_name, universe,
  character_id, universe_id,
  user_image_url, official_image_url, image_url,
  status, progress_level, priority, target_year,
  auto_progress, is_in_wardrobe, source_vestiaire_id,
  completed_at, created_at, updated_at
)
SELECT
  cv.user_id,
  cv.character_name,
  cv.universe,
  cv.character_id,
  cv.universe_id,
  cv.user_image_url,
  cv.official_image_url,
  COALESCE(cv.user_image_url, cv.official_image_url),
  'completed',
  100,
  0,
  EXTRACT(YEAR FROM cv.created_at)::INTEGER,
  false,
  true,
  cv.id,
  cv.created_at,
  cv.created_at,
  cv.created_at
FROM public.cosplay_vestiaire cv
WHERE NOT EXISTS (
  -- Deja lie par source_vestiaire_id
  SELECT 1 FROM public.cosplay_plans cp
  WHERE  cp.source_vestiaire_id = cv.id
)
AND NOT EXISTS (
  -- Dedup naturelle : meme user+character+universe deja completed
  SELECT 1 FROM public.cosplay_plans cp
  WHERE  cp.user_id        = cv.user_id
    AND  cp.character_name = cv.character_name
    AND  cp.universe       = cv.universe
    AND  cp.status         = 'completed'
);


-- ============================================================
-- C. TABLE event_cosplay_lineups (unifiee)
-- ============================================================

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

COMMENT ON TABLE  public.event_cosplay_lineups IS
  'Lineups cosplay unifies. Remplace cosplay_lineups + event_lineups.';
COMMENT ON COLUMN public.event_cosplay_lineups.cosplay_project_id IS
  'FK -> cosplay_plans. NULL = jour civil.';

CREATE INDEX IF NOT EXISTS idx_ecl_user_id
  ON public.event_cosplay_lineups (user_id);
CREATE INDEX IF NOT EXISTS idx_ecl_event_id
  ON public.event_cosplay_lineups (event_id);
CREATE INDEX IF NOT EXISTS idx_ecl_cosplay_project_id
  ON public.event_cosplay_lineups (cosplay_project_id)
  WHERE cosplay_project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ecl_event_date
  ON public.event_cosplay_lineups (event_date);

-- Trigger updated_at (fonction existante depuis 20250212)
DROP TRIGGER IF EXISTS trg_ecl_updated_at ON public.event_cosplay_lineups;
CREATE TRIGGER trg_ecl_updated_at
  BEFORE UPDATE ON public.event_cosplay_lineups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- D. MIGRATION DES LINEUPS LEGACY
-- ============================================================

-- D1. Depuis cosplay_lineups (ref cosplay_vestiaire)
-- Resolution : cosplay_lineups.cosplay_id -> cosplay_plans.source_vestiaire_id
-- LEFT JOIN : si non resolu, cosplay_project_id = NULL (civil)
INSERT INTO public.event_cosplay_lineups (
  user_id, event_id, cosplay_project_id,
  event_date, slot_type, created_at, updated_at
)
SELECT
  cl.user_id,
  cl.event_id,
  cp.id,                                          -- resolu ou NULL
  cl.event_date::DATE,
  CASE
    WHEN cl.slot_type IN ('morning','afternoon') THEN cl.slot_type
    ELSE 'full_day'                               -- 'day' et autres -> full_day
  END,
  cl.created_at,
  COALESCE(cl.updated_at, cl.created_at)
FROM public.cosplay_lineups cl
LEFT JOIN public.cosplay_plans cp
  ON cp.source_vestiaire_id = cl.cosplay_id
WHERE cl.event_id   IS NOT NULL
  AND cl.event_date IS NOT NULL
ON CONFLICT (user_id, event_id, event_date, slot_type) DO NOTHING;

-- D2. Depuis event_lineups (ref cosplay_plans)
-- event_lineups n'a pas de event_date -> on prend events."date"
INSERT INTO public.event_cosplay_lineups (
  user_id, event_id, cosplay_project_id,
  event_date, slot_type, created_at
)
SELECT
  el.user_id,
  el.event_id,
  el.cosplay_plan_id,
  COALESCE(ev."date", ev.date_debut)::DATE,
  'full_day',
  el.created_at
FROM public.event_lineups el
JOIN public.events ev ON ev.id = el.event_id
WHERE COALESCE(ev."date", ev.date_debut) IS NOT NULL
ON CONFLICT (user_id, event_id, event_date, slot_type) DO NOTHING;


-- ============================================================
-- E. TABLE cosplay_incarnations
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cosplay_incarnations (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cosplay_project_id  UUID        NOT NULL
                        REFERENCES public.cosplay_plans(id) ON DELETE CASCADE,
  user_id             UUID        NOT NULL
                        REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id            UUID
                        REFERENCES public.events(id) ON DELETE SET NULL,
  title               TEXT        NOT NULL,
  description         TEXT,
  incarnation_date    DATE,
  cover_photo_id      UUID,       -- FK ajoutee en F (apres creation de la FK inverse)
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.cosplay_incarnations IS
  'Occurrence portee d un cosplay termine (event, shooting...).';

CREATE INDEX IF NOT EXISTS idx_ci_cosplay_project_id
  ON public.cosplay_incarnations (cosplay_project_id);
CREATE INDEX IF NOT EXISTS idx_ci_user_id
  ON public.cosplay_incarnations (user_id);
CREATE INDEX IF NOT EXISTS idx_ci_event_id
  ON public.cosplay_incarnations (event_id)
  WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ci_date
  ON public.cosplay_incarnations (incarnation_date);

DROP TRIGGER IF EXISTS trg_ci_updated_at ON public.cosplay_incarnations;
CREATE TRIGGER trg_ci_updated_at
  BEFORE UPDATE ON public.cosplay_incarnations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- F. cosplay_photos.incarnation_id + FK CROISEES
-- ============================================================

-- F1. Ajouter la colonne
ALTER TABLE public.cosplay_photos
  ADD COLUMN IF NOT EXISTS incarnation_id UUID;

-- F2. FK photos -> incarnations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'cosplay_photos_incarnation_id_fkey'
      AND table_schema    = 'public'
  ) THEN
    ALTER TABLE public.cosplay_photos
      ADD CONSTRAINT cosplay_photos_incarnation_id_fkey
      FOREIGN KEY (incarnation_id)
      REFERENCES public.cosplay_incarnations(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cosplay_photos_incarnation_id
  ON public.cosplay_photos (incarnation_id)
  WHERE incarnation_id IS NOT NULL;

-- F3. FK incarnations.cover_photo_id -> photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'cosplay_incarnations_cover_photo_id_fkey'
      AND table_schema    = 'public'
  ) THEN
    ALTER TABLE public.cosplay_incarnations
      ADD CONSTRAINT cosplay_incarnations_cover_photo_id_fkey
      FOREIGN KEY (cover_photo_id)
      REFERENCES public.cosplay_photos(id)
      ON DELETE SET NULL;
  END IF;
END $$;


-- ============================================================
-- G. CONVERGENCE event_participants
-- ============================================================

-- Backfill cosplay_id la ou planned_cosplay_id (legacy vestiaire)
-- peut etre resolu vers un cosplay_plans via source_vestiaire_id.
UPDATE public.event_participants ep
SET    cosplay_id = cp.id
FROM   public.cosplay_plans cp
WHERE  ep.planned_cosplay_id IS NOT NULL
  AND  ep.cosplay_id IS NULL
  AND  cp.source_vestiaire_id = ep.planned_cosplay_id;

COMMENT ON COLUMN public.event_participants.planned_cosplay_id IS
  'LEGACY — FK vers cosplay_vestiaire. Remplacee par cosplay_id (-> cosplay_plans). A supprimer Lot 6.';


-- ============================================================
-- H. RLS
-- ============================================================

-- H1. event_cosplay_lineups
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

-- H2. cosplay_incarnations
ALTER TABLE public.cosplay_incarnations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ci_select_authenticated" ON public.cosplay_incarnations;
CREATE POLICY "ci_select_authenticated"
  ON public.cosplay_incarnations FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "ci_insert_owner" ON public.cosplay_incarnations;
CREATE POLICY "ci_insert_owner"
  ON public.cosplay_incarnations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ci_update_owner" ON public.cosplay_incarnations;
CREATE POLICY "ci_update_owner"
  ON public.cosplay_incarnations FOR UPDATE
  TO authenticated
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ci_delete_owner" ON public.cosplay_incarnations;
CREATE POLICY "ci_delete_owner"
  ON public.cosplay_incarnations FOR DELETE
  TO authenticated USING (auth.uid() = user_id);


-- ============================================================
-- I. PostgREST reload
-- ============================================================
NOTIFY pgrst, 'reload schema';


-- ============================================================
-- J. REQUETES DE VERIFICATION POST-MIGRATION
-- ============================================================
-- Executer manuellement apres la migration pour valider.

-- J1. Statuts : ne doit plus contenir 'started' ni 'finished'
-- SELECT status, count(*) FROM public.cosplay_plans GROUP BY status ORDER BY status;

-- J2. completed_at : tous les completed doivent l'avoir
-- SELECT count(*) AS completed_sans_date
-- FROM   public.cosplay_plans
-- WHERE  status = 'completed' AND completed_at IS NULL;
-- -- attendu : 0

-- J3. Vestiaire migre : combien de cosplay_vestiaire lies
-- SELECT
--   (SELECT count(*) FROM public.cosplay_vestiaire)                      AS total_vestiaire,
--   (SELECT count(*) FROM public.cosplay_plans
--    WHERE source_vestiaire_id IS NOT NULL)                               AS lies_par_source_id,
--   (SELECT count(*) FROM public.cosplay_vestiaire cv
--    WHERE NOT EXISTS (
--      SELECT 1 FROM public.cosplay_plans cp
--      WHERE  cp.source_vestiaire_id = cv.id
--    ) AND NOT EXISTS (
--      SELECT 1 FROM public.cosplay_plans cp
--      WHERE  cp.user_id = cv.user_id
--        AND  cp.character_name = cv.character_name
--        AND  cp.universe = cv.universe
--        AND  cp.status = 'completed'
--    ))                                                                   AS orphelins_restants;
-- -- orphelins_restants attendu : 0

-- J4. Lineups migres
-- SELECT
--   (SELECT count(*) FROM public.event_cosplay_lineups)                  AS total_ecl,
--   (SELECT count(*) FROM public.cosplay_lineups)                        AS total_legacy_cl,
--   (SELECT count(*) FROM public.event_lineups)                          AS total_legacy_el;

-- J5. cosplay_lineups dont la resolution cosplay_project_id a echoue
--     (cosplay_id non null mais aucun cosplay_plans avec ce source_vestiaire_id)
-- SELECT cl.id, cl.user_id, cl.event_id, cl.cosplay_id, cl.event_date
-- FROM   public.cosplay_lineups cl
-- WHERE  cl.cosplay_id IS NOT NULL
--   AND  NOT EXISTS (
--     SELECT 1 FROM public.cosplay_plans cp
--     WHERE  cp.source_vestiaire_id = cl.cosplay_id
--   );

-- J6. event_lineups non migres faute de date sur l'evenement
-- SELECT el.id, el.cosplay_plan_id, el.event_id
-- FROM   public.event_lineups el
-- JOIN   public.events ev ON ev.id = el.event_id
-- WHERE  COALESCE(ev."date", ev.date_debut) IS NULL;

-- J7. event_participants backfilles
-- SELECT count(*) AS backfilles
-- FROM   public.event_participants
-- WHERE  cosplay_id IS NOT NULL
--   AND  planned_cosplay_id IS NOT NULL;

-- J8. event_participants non resolus (planned_cosplay_id sans correspondance)
-- SELECT ep.id, ep.event_id, ep.user_id, ep.planned_cosplay_id
-- FROM   public.event_participants ep
-- WHERE  ep.planned_cosplay_id IS NOT NULL
--   AND  ep.cosplay_id IS NULL;

-- J9. RLS policies
-- SELECT tablename, policyname, cmd, roles
-- FROM   pg_policies
-- WHERE  tablename IN ('event_cosplay_lineups','cosplay_incarnations')
-- ORDER  BY tablename, cmd;


-- ============================================================
-- K. ROLLBACK NOTES
-- ============================================================
--
-- FACILEMENT REVERSIBLE :
--   - DROP TABLE IF EXISTS public.event_cosplay_lineups CASCADE;
--   - DROP TABLE IF EXISTS public.cosplay_incarnations CASCADE;
--   - ALTER TABLE public.cosplay_photos DROP COLUMN IF EXISTS incarnation_id;
--   - DROP FUNCTION IF EXISTS public.normalize_cosplan_status() CASCADE;
--     (supprime aussi le trigger trg_normalize_cosplan_status)
--   - ALTER TABLE public.cosplay_plans DROP COLUMN IF EXISTS completed_at;
--   - DROP INDEX IF EXISTS idx_cosplay_plans_completed;
--
-- REVERSIBLE AVEC PRECAUTION :
--   - Reconvertir status TEXT -> enum cosplan_status :
--       ALTER TABLE public.cosplay_plans
--         ALTER COLUMN status TYPE cosplan_status
--         USING status::cosplan_status;
--     ATTENTION : echouera si des rows ont 'in_progress' ou 'completed'
--     qui ne sont pas dans l'enum. Il faut d'abord :
--       UPDATE cosplay_plans SET status='started'  WHERE status='in_progress';
--       UPDATE cosplay_plans SET status='finished' WHERE status='completed';
--     puis supprimer le CHECK :
--       ALTER TABLE cosplay_plans DROP CONSTRAINT cosplay_plans_status_check;
--     puis reconvertir vers l'enum.
--
-- NON REVERSIBLE (perte de precision) :
--   - B1 (backfill source_vestiaire_id) : les associations creees sont
--     difficiles a distinguer des associations originales.
--     Impact faible : source_vestiaire_id est un champ de tracking, pas
--     une donnee metier critique.
--   - G (backfill event_participants.cosplay_id) : on peut remettre
--     cosplay_id a NULL la ou planned_cosplay_id est non null, mais
--     on ne peut pas distinguer les backfills de ce lot des valeurs
--     qui existaient deja.
--
-- TABLES LEGACY CONSERVEES (non touchees, non supprimees) :
--   - cosplay_vestiaire
--   - cosplay_lineups
--   - event_lineups
--   - event_parties + event_party_members
--   Suppression prevue dans le Lot 6 apres adaptation du frontend.
--
-- ENUM cosplan_status :
--   Conservee en base (pas droppee). La colonne status ne l'utilise
--   plus mais d'autres references pourraient exister.
--   Nettoyage prevu Lot 6.
