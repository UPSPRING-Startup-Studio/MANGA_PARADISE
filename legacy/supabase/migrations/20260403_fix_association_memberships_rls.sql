-- ============================================================
-- FIX : association_memberships RLS — suppression récursion 42P17
--
-- Problème : les policies SELECT/INSERT/UPDATE/DELETE contenaient
-- des sous-requêtes sur association_memberships elle-même, ce qui
-- provoquait "infinite recursion detected in policy".
--
-- Solution : fonctions SECURITY DEFINER qui bypassent les RLS.
-- ============================================================

-- ────────────────────────────────────────────────
-- PHASE 1 : DROP toutes les policies existantes
-- ────────────────────────────────────────────────

DROP POLICY IF EXISTS "Memberships viewable by association members"
  ON public.association_memberships;

DROP POLICY IF EXISTS "Memberships editable by association leaders"
  ON public.association_memberships;

DROP POLICY IF EXISTS "Memberships insertable by association leaders"
  ON public.association_memberships;

DROP POLICY IF EXISTS "Memberships insertable by admin or leaders"
  ON public.association_memberships;

DROP POLICY IF EXISTS "Memberships deletable by leaders or admin"
  ON public.association_memberships;

-- Catch-all pour tout nom résiduel
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'association_memberships'
      AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.association_memberships', pol.policyname);
  END LOOP;
END $$;

-- ────────────────────────────────────────────────
-- PHASE 2 : Fonctions helpers SECURITY DEFINER
-- (elles bypassent les RLS → pas de récursion)
-- ────────────────────────────────────────────────

-- Vérifie si l'utilisateur courant est admin plateforme
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND (role = 'admin' OR role_function = 'admin')
  );
END;
$$;

-- Vérifie si l'utilisateur courant est membre actif d'une association
CREATE OR REPLACE FUNCTION public.is_association_member(p_association_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.association_memberships
    WHERE association_id = p_association_id
      AND user_id = auth.uid()
      AND is_active = true
  );
END;
$$;

-- Vérifie si l'utilisateur courant est leader/bureau d'une association
CREATE OR REPLACE FUNCTION public.is_association_leader(p_association_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.association_memberships
    WHERE association_id = p_association_id
      AND user_id = auth.uid()
      AND role IN ('president', 'vice_president', 'secretaire', 'tresorier')
      AND is_active = true
  );
END;
$$;

-- ────────────────────────────────────────────────
-- PHASE 3 : S'assurer que RLS est activé
-- ────────────────────────────────────────────────

ALTER TABLE public.association_memberships ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────
-- PHASE 4 : Nouvelles policies (sans récursion)
-- ────────────────────────────────────────────────

-- SELECT : le membre voit ses propres lignes + les leaders voient leur asso + admins voient tout
CREATE POLICY "am_select"
  ON public.association_memberships
  FOR SELECT
  TO authenticated
  USING (
    public.is_platform_admin()
    OR user_id = auth.uid()
    OR public.is_association_member(association_id)
  );

-- INSERT : admins plateforme OU leaders existants de l'association
CREATE POLICY "am_insert"
  ON public.association_memberships
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR public.is_association_leader(association_id)
  );

-- UPDATE : admins plateforme OU leaders existants de l'association
CREATE POLICY "am_update"
  ON public.association_memberships
  FOR UPDATE
  TO authenticated
  USING (
    public.is_platform_admin()
    OR public.is_association_leader(association_id)
  )
  WITH CHECK (
    public.is_platform_admin()
    OR public.is_association_leader(association_id)
  );

-- DELETE : admins plateforme OU président/VP de l'association
CREATE POLICY "am_delete"
  ON public.association_memberships
  FOR DELETE
  TO authenticated
  USING (
    public.is_platform_admin()
    OR public.is_association_leader(association_id)
  );
