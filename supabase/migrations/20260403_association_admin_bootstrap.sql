-- ============================================================
-- MODULE ASSOCIATION – Correctif admin bootstrap
--
-- Problème : la policy INSERT sur association_memberships exige
-- qu'un leader existe déjà dans l'association pour pouvoir ajouter
-- un membre. Or pour le PREMIER membre (le président), il n'y a
-- personne. Seul le fallback "admin plateforme" fonctionne, mais
-- la policy actuelle fait un OR avec le check leader qui échoue
-- d'abord. Ce patch s'assure que la policy admin fonctionne
-- proprement pour le bootstrap.
--
-- Solution : on DROP + RECREATE la policy INSERT pour simplifier
-- l'évaluation en mettant le check admin en premier.
-- ============================================================

-- Drop l'ancienne policy INSERT
DROP POLICY IF EXISTS "Memberships insertable by association leaders"
  ON public.association_memberships;

-- Recréer avec le check admin en priorité
CREATE POLICY "Memberships insertable by admin or leaders"
  ON public.association_memberships FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Admin plateforme peut toujours ajouter un membre (bootstrap)
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (role = 'admin' OR role_function = 'admin')
    )
    OR
    -- Leaders existants de l'association
    EXISTS (
      SELECT 1 FROM public.association_memberships am
      WHERE am.association_id = association_memberships.association_id
      AND am.user_id = auth.uid()
      AND am.role IN ('president', 'vice_president', 'secretaire')
      AND am.is_active = true
    )
  );
