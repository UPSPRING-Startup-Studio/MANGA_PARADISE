-- ============================================================
-- Migration : Gouvernance administrative des associations
-- Date      : 2026-04-15
-- Objet     : Ajout admin_status, soft-delete, helper functions,
--             mise à jour RLS pour blocage/restriction
-- ============================================================

-- ────────────────────────────────────────────────
-- 1. NOUVELLES COLONNES sur associations
-- ────────────────────────────────────────────────

-- admin_status : gouvernance plateforme (indépendant du status métier)
ALTER TABLE public.associations
  ADD COLUMN IF NOT EXISTS admin_status text NOT NULL DEFAULT 'active';

ALTER TABLE public.associations
  ADD COLUMN IF NOT EXISTS admin_status_reason text;

ALTER TABLE public.associations
  ADD COLUMN IF NOT EXISTS admin_status_changed_at timestamptz;

ALTER TABLE public.associations
  ADD COLUMN IF NOT EXISTS admin_status_changed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.associations
  ADD COLUMN IF NOT EXISTS admin_notes text;

-- Soft-delete
ALTER TABLE public.associations
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.associations
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.associations
  ADD COLUMN IF NOT EXISTS deletion_reason text;

-- CHECK constraint sur admin_status
DO $$ BEGIN
  ALTER TABLE public.associations
    ADD CONSTRAINT chk_associations_admin_status
    CHECK (admin_status IN ('active', 'restricted', 'blocked'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Index pour les requêtes filtrées
CREATE INDEX IF NOT EXISTS idx_associations_admin_status ON public.associations(admin_status);
CREATE INDEX IF NOT EXISTS idx_associations_deleted_at ON public.associations(deleted_at);

-- ────────────────────────────────────────────────
-- 2. FONCTIONS HELPER — SECURITY DEFINER
-- ────────────────────────────────────────────────

-- 2a. is_association_writable(uuid)
-- Retourne true si l'association n'est pas bloquée et pas soft-deleted.
-- Les super-admins bypassent ce check via les policies elles-mêmes.
CREATE OR REPLACE FUNCTION public.is_association_writable(p_association_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.associations
    WHERE id = p_association_id
      AND admin_status != 'blocked'
      AND deleted_at IS NULL
  );
$$;

COMMENT ON FUNCTION public.is_association_writable(uuid) IS
  'Retourne true si l''association n''est ni bloquée ni supprimée. Utilisé par les RLS policies.';

-- 2b. is_association_restricted(uuid)
-- Retourne true si l'association est en mode restricted.
CREATE OR REPLACE FUNCTION public.is_association_restricted(p_association_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.associations
    WHERE id = p_association_id
      AND admin_status = 'restricted'
  );
$$;

COMMENT ON FUNCTION public.is_association_restricted(uuid) IS
  'Retourne true si l''association est sous restriction administrative.';

-- ────────────────────────────────────────────────
-- 3. MISE À JOUR RLS — associations
-- ────────────────────────────────────────────────

-- Le SELECT existant (asso_select) doit exclure les soft-deleted
-- pour les non-admins.
DROP POLICY IF EXISTS "asso_select" ON public.associations;
CREATE POLICY "asso_select"
  ON public.associations
  FOR SELECT
  TO authenticated
  USING (
    -- Admins globaux voient tout (y compris soft-deleted)
    public.is_global_association_admin()
    OR (
      -- Non soft-deleted
      deleted_at IS NULL
      AND (
        is_public = true
        OR public.is_association_member(id)
        OR (status = 'draft' AND (created_by = auth.uid() OR owner_user_id = auth.uid()))
      )
    )
  );

-- UPDATE : admin global OU (admin/owner de l'asso ET asso non bloquée)
DROP POLICY IF EXISTS "asso_update" ON public.associations;
CREATE POLICY "asso_update"
  ON public.associations
  FOR UPDATE
  TO authenticated
  USING (
    public.is_global_association_admin()
    OR (
      public.has_association_role(id, ARRAY['admin', 'owner'])
      AND public.is_association_writable(id)
    )
  )
  WITH CHECK (
    public.is_global_association_admin()
    OR (
      public.has_association_role(id, ARRAY['admin', 'owner'])
      AND public.is_association_writable(id)
    )
  );

-- INSERT et DELETE restent inchangés (déjà superadmin-only pour delete,
-- superadmin/bureau pour insert).

-- ────────────────────────────────────────────────
-- 4. MISE À JOUR RLS — association_memberships
-- ────────────────────────────────────────────────

-- INSERT : admin global OU (admin/owner de l'asso ET asso writable ET pas restricted)
DROP POLICY IF EXISTS "am_insert" ON public.association_memberships;
CREATE POLICY "am_insert"
  ON public.association_memberships
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_global_association_admin()
    OR (
      public.has_association_role(association_id, ARRAY['admin', 'owner'])
      AND public.is_association_writable(association_id)
      AND NOT public.is_association_restricted(association_id)
    )
  );

-- UPDATE : admin global OU (admin/owner ET asso writable)
DROP POLICY IF EXISTS "am_update" ON public.association_memberships;
CREATE POLICY "am_update"
  ON public.association_memberships
  FOR UPDATE
  TO authenticated
  USING (
    public.is_global_association_admin()
    OR (
      public.has_association_role(association_id, ARRAY['admin', 'owner'])
      AND public.is_association_writable(association_id)
    )
  )
  WITH CHECK (
    public.is_global_association_admin()
    OR (
      public.has_association_role(association_id, ARRAY['admin', 'owner'])
      AND public.is_association_writable(association_id)
    )
  );

-- DELETE : admin global OU (admin/owner ET asso writable)
DROP POLICY IF EXISTS "am_delete" ON public.association_memberships;
CREATE POLICY "am_delete"
  ON public.association_memberships
  FOR DELETE
  TO authenticated
  USING (
    public.is_global_association_admin()
    OR (
      public.has_association_role(association_id, ARRAY['admin', 'owner'])
      AND public.is_association_writable(association_id)
    )
  );

-- ────────────────────────────────────────────────
-- 5. MISE À JOUR RLS — association_invitations
-- ────────────────────────────────────────────────

-- INSERT : bloqué si asso blocked OU restricted (sauf admin global)
DROP POLICY IF EXISTS "ai_insert" ON public.association_invitations;
CREATE POLICY "ai_insert"
  ON public.association_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_global_association_admin()
    OR (
      public.has_association_role(association_id, ARRAY['admin', 'owner', 'bureau'])
      AND public.is_association_writable(association_id)
      AND NOT public.is_association_restricted(association_id)
    )
  );

-- UPDATE : writable check
DROP POLICY IF EXISTS "ai_update" ON public.association_invitations;
CREATE POLICY "ai_update"
  ON public.association_invitations
  FOR UPDATE
  TO authenticated
  USING (
    public.is_global_association_admin()
    OR (
      (
        public.has_association_role(association_id, ARRAY['admin', 'owner', 'bureau'])
        OR invited_user_id = auth.uid()
      )
      AND public.is_association_writable(association_id)
    )
  )
  WITH CHECK (
    public.is_global_association_admin()
    OR (
      (
        public.has_association_role(association_id, ARRAY['admin', 'owner', 'bureau'])
        OR invited_user_id = auth.uid()
      )
      AND public.is_association_writable(association_id)
    )
  );

-- ────────────────────────────────────────────────
-- 6. MISE À JOUR RLS — association_documents
-- ────────────────────────────────────────────────

DROP POLICY IF EXISTS "ad_insert" ON public.association_documents;
CREATE POLICY "ad_insert"
  ON public.association_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_global_association_admin()
    OR (
      public.is_association_member(association_id)
      AND public.is_association_writable(association_id)
    )
  );

DROP POLICY IF EXISTS "ad_update" ON public.association_documents;
CREATE POLICY "ad_update"
  ON public.association_documents
  FOR UPDATE
  TO authenticated
  USING (
    public.is_global_association_admin()
    OR (
      public.is_association_member(association_id)
      AND public.is_association_writable(association_id)
    )
  )
  WITH CHECK (
    public.is_global_association_admin()
    OR (
      public.is_association_member(association_id)
      AND public.is_association_writable(association_id)
    )
  );

DROP POLICY IF EXISTS "ad_delete" ON public.association_documents;
CREATE POLICY "ad_delete"
  ON public.association_documents
  FOR DELETE
  TO authenticated
  USING (
    public.is_global_association_admin()
    OR (
      public.has_association_role(association_id, ARRAY['admin', 'owner', 'bureau'])
      AND public.is_association_writable(association_id)
    )
  );

-- ────────────────────────────────────────────────
-- 7. MISE À JOUR RLS — association_contacts
-- ────────────────────────────────────────────────

DROP POLICY IF EXISTS "ac_insert" ON public.association_contacts;
CREATE POLICY "ac_insert"
  ON public.association_contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_global_association_admin()
    OR (
      public.has_association_role(association_id, ARRAY['admin', 'owner', 'bureau', 'staff'])
      AND public.is_association_writable(association_id)
    )
  );

DROP POLICY IF EXISTS "ac_update" ON public.association_contacts;
CREATE POLICY "ac_update"
  ON public.association_contacts
  FOR UPDATE
  TO authenticated
  USING (
    public.is_global_association_admin()
    OR (
      public.has_association_role(association_id, ARRAY['admin', 'owner', 'bureau', 'staff'])
      AND public.is_association_writable(association_id)
    )
  )
  WITH CHECK (
    public.is_global_association_admin()
    OR (
      public.has_association_role(association_id, ARRAY['admin', 'owner', 'bureau', 'staff'])
      AND public.is_association_writable(association_id)
    )
  );

DROP POLICY IF EXISTS "ac_delete" ON public.association_contacts;
CREATE POLICY "ac_delete"
  ON public.association_contacts
  FOR DELETE
  TO authenticated
  USING (
    public.is_global_association_admin()
    OR (
      public.has_association_role(association_id, ARRAY['admin', 'owner', 'bureau'])
      AND public.is_association_writable(association_id)
    )
  );

-- ────────────────────────────────────────────────
-- FIN DE LA MIGRATION
-- ────────────────────────────────────────────────
