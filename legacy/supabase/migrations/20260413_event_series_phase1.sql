-- ============================================================
-- PHASE 1 – Séries d'événements (modèle de données uniquement)
--
-- Crée la table event_series et ajoute les colonnes
-- series_id, edition_label, slug sur events.
-- Aucune donnée existante n'est modifiée.
-- ============================================================


-- ────────────────────────────────────────────────
-- 1. TABLE event_series
-- ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.event_series (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                     TEXT NOT NULL UNIQUE,
  canonical_name           TEXT NOT NULL,
  description              TEXT,
  type_evenement           TEXT,
  default_city             TEXT,
  default_venue            TEXT,
  organizer_association_id UUID REFERENCES public.associations(id) ON DELETE SET NULL,
  cover_image              TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.event_series IS 'Série d''événements récurrents (ex: Japan Expo, Comic-Con Paris)';
COMMENT ON COLUMN public.event_series.slug IS 'Slug canonique unique (ex: japan-expo)';
COMMENT ON COLUMN public.event_series.canonical_name IS 'Nom générique (ex: Japan Expo)';
COMMENT ON COLUMN public.event_series.type_evenement IS 'Type par défaut héritable par les éditions';
COMMENT ON COLUMN public.event_series.default_city IS 'Ville par défaut héritable';
COMMENT ON COLUMN public.event_series.default_venue IS 'Lieu par défaut héritable';


-- ────────────────────────────────────────────────
-- 2. INDEX sur event_series
-- ────────────────────────────────────────────────

-- slug est déjà UNIQUE → index automatique.
-- Index supplémentaire pour rechercher par nom canonique (autocomplete admin).
CREATE INDEX IF NOT EXISTS idx_event_series_canonical_name
  ON public.event_series USING btree (canonical_name);

CREATE INDEX IF NOT EXISTS idx_event_series_association
  ON public.event_series USING btree (organizer_association_id)
  WHERE organizer_association_id IS NOT NULL;


-- ────────────────────────────────────────────────
-- 3. RLS sur event_series
-- ────────────────────────────────────────────────

ALTER TABLE public.event_series ENABLE ROW LEVEL SECURITY;

-- SELECT : tout utilisateur authentifié peut voir les séries
CREATE POLICY "event_series_select_authenticated"
  ON public.event_series
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT : admins plateforme uniquement
CREATE POLICY "event_series_insert_admin_only"
  ON public.event_series
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_platform_admin()
  );

-- UPDATE : admins plateforme uniquement
CREATE POLICY "event_series_update_admin_only"
  ON public.event_series
  FOR UPDATE
  TO authenticated
  USING (
    public.is_platform_admin()
  )
  WITH CHECK (
    public.is_platform_admin()
  );

-- DELETE : admins plateforme uniquement
CREATE POLICY "event_series_delete_admin_only"
  ON public.event_series
  FOR DELETE
  TO authenticated
  USING (
    public.is_platform_admin()
  );


-- ────────────────────────────────────────────────
-- 4. Trigger updated_at sur event_series
-- ────────────────────────────────────────────────

-- Réutilise la fonction handle_updated_at si elle existe,
-- sinon la crée (idempotent).
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_event_series_updated_at ON public.event_series;
CREATE TRIGGER set_event_series_updated_at
  BEFORE UPDATE ON public.event_series
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();


-- ────────────────────────────────────────────────
-- 5. MIGRATION events — nouvelles colonnes
-- ────────────────────────────────────────────────

-- series_id : FK vers event_series (nullable, aucun event existant n'est obligé)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS series_id UUID
    REFERENCES public.event_series(id) ON DELETE SET NULL;

-- edition_label : libellé libre de l'édition (ex: "2026", "Sud 2026")
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS edition_label TEXT;

-- slug : slug d'édition unique (ex: "japan-expo-2026"), nullable pour l'instant
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

COMMENT ON COLUMN public.events.series_id IS 'FK vers la série d''événements récurrents (nullable)';
COMMENT ON COLUMN public.events.edition_label IS 'Libellé de l''édition (ex: 2026, Sud 2026, 19ème édition)';
COMMENT ON COLUMN public.events.slug IS 'Slug unique d''édition (ex: japan-expo-2026), nullable tant que les URLs ne migrent pas';


-- ────────────────────────────────────────────────
-- 6. INDEX sur les nouvelles colonnes events
-- ────────────────────────────────────────────────

-- Recherche rapide des éditions d'une série
CREATE INDEX IF NOT EXISTS idx_events_series_id
  ON public.events USING btree (series_id)
  WHERE series_id IS NOT NULL;

-- slug est déjà UNIQUE → index automatique.


-- ────────────────────────────────────────────────
-- 7. FK relationship dans events (déjà fait par ALTER TABLE ci-dessus)
--    RLS events : aucune modification nécessaire.
--    Les policies existantes sur events couvrent déjà
--    les nouvelles colonnes (SELECT/INSERT/UPDATE/DELETE inchangés).
-- ────────────────────────────────────────────────
