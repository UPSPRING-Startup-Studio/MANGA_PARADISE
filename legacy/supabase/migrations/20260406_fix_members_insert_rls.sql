-- ============================================================
-- FIX : RLS INSERT/UPDATE sur association_memberships
--
-- PROBLÈME :
--   La policy am_insert (V4) n'autorise que :
--     - is_global_association_admin()
--     - has_association_role(asso_id, ARRAY['admin','owner'])
--   → 'admin' = seulement president/vice_president
--   → 'owner' = seulement president
--   Les rôles tresorier, secretaire, responsable sont EXCLUS même
--   s'ils ont le bouton "Ajouter un membre" côté front.
--   → Résultat : erreur 403 RLS lors de l'INSERT.
--
-- CORRECTION :
--   1. Étendre is_association_leader() pour inclure 'responsable'.
--   2. Réécrire am_insert et am_update pour utiliser
--      is_association_leader() qui couvre tout le bureau + responsable.
--
-- IDEMPOTENT : DROP IF EXISTS + CREATE
-- ============================================================


-- ============================================================
-- 1. is_association_leader — étendre à 'responsable'
-- ============================================================

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
      AND role IN ('president', 'vice_president', 'secretaire', 'tresorier', 'responsable')
      AND is_active = true
  );
END;
$$;

COMMENT ON FUNCTION public.is_association_leader(uuid) IS
  'Vérifie si le user courant est leader actif de l''association '
  '(president, vice_president, secretaire, tresorier, responsable).';


-- ============================================================
-- 2. is_association_admin — mettre à jour pour utiliser le nouveau leader
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_association_admin(p_association_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN
    public.is_global_association_admin()
    OR public.is_association_leader(p_association_id);
END;
$$;


-- ============================================================
-- 3. am_insert — corriger pour inclure tous les leaders
-- ============================================================

DROP POLICY IF EXISTS "am_insert" ON public.association_memberships;

CREATE POLICY "am_insert"
  ON public.association_memberships
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_global_association_admin()
    OR public.is_association_leader(association_id)
  );


-- ============================================================
-- 4. am_update — corriger pour inclure tous les leaders
-- ============================================================

DROP POLICY IF EXISTS "am_update" ON public.association_memberships;

CREATE POLICY "am_update"
  ON public.association_memberships
  FOR UPDATE
  TO authenticated
  USING (
    public.is_global_association_admin()
    OR public.is_association_leader(association_id)
    OR user_id = auth.uid()   -- self-leave / auto-mise à jour
  )
  WITH CHECK (
    public.is_global_association_admin()
    OR public.is_association_leader(association_id)
    OR (
      -- Self-leave : le membre ne peut que se désactiver, pas se promouvoir
      user_id = auth.uid()
      AND is_active = false
    )
  );


-- ============================================================
-- RÉCAPITULATIF
-- ============================================================
-- FONCTIONS MISES À JOUR :
--   is_association_leader(uuid)  — +responsable dans les rôles autorisés
--   is_association_admin(uuid)   — délègue à is_association_leader
--
-- POLICIES RÉÉCRITES :
--   am_insert  : admins globaux OU is_association_leader (president/VP/secretaire/tresorier/responsable)
--   am_update  : admins globaux OU is_association_leader OU self (désactivation uniquement)
