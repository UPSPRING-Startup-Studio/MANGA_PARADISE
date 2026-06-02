-- ============================================================
-- MODULE ASSOCIATION – RLS events pour bureau d'association
--
-- La table events a RLS activé mais aucune policy explicite.
-- Ce script ajoute des policies propres en utilisant les fonctions
-- SECURITY DEFINER existantes (is_platform_admin, is_association_leader).
-- ============================================================

-- ────────────────────────────────────────────────
-- Nettoyage des éventuelles policies existantes
-- ────────────────────────────────────────────────

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'events'
      AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.events', pol.policyname);
  END LOOP;
END $$;

-- ────────────────────────────────────────────────
-- S'assurer que RLS est activé
-- ────────────────────────────────────────────────

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────
-- Policies
-- ────────────────────────────────────────────────

-- SELECT : tout utilisateur authentifié peut voir les events
CREATE POLICY "events_select_authenticated"
  ON public.events
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT : admins plateforme OU leaders d'une association (ils ne peuvent
-- insérer que des events pour LEUR association via le WITH CHECK)
CREATE POLICY "events_insert_admin_or_leader"
  ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR (
      association_id IS NOT NULL
      AND public.is_association_leader(association_id)
    )
  );

-- UPDATE : admins plateforme OU leaders de l'association propriétaire
CREATE POLICY "events_update_admin_or_leader"
  ON public.events
  FOR UPDATE
  TO authenticated
  USING (
    public.is_platform_admin()
    OR (
      association_id IS NOT NULL
      AND public.is_association_leader(association_id)
    )
  )
  WITH CHECK (
    public.is_platform_admin()
    OR (
      association_id IS NOT NULL
      AND public.is_association_leader(association_id)
    )
  );

-- DELETE : admins plateforme uniquement (sécurité)
CREATE POLICY "events_delete_admin_only"
  ON public.events
  FOR DELETE
  TO authenticated
  USING (
    public.is_platform_admin()
  );
