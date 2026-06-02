-- ============================================================
-- MODULE ASSOCIATION V4 — Réalignement sur la spec cible
--
-- CONTEXTE :
--   Les migrations V1 (20260403) + V2 (20260404) + V3 (20260404)
--   ont déjà créé un module association fonctionnel. Cette migration
--   V4 réaligne le schéma sur la spec cible du prompt sans casser
--   l'existant : mêmes tables, colonnes ajoutées, helpers mis à jour,
--   policies renforcées, contraintes ajoutées.
--
-- CHANGEMENTS PAR RAPPORT À L'EXISTANT :
--   - associations : +is_public, CHECK status élargi (+ 'suspended')
--   - association_memberships : +profile_id alias, +membership_status,
--     helpers mis à jour pour supporter les deux vocabulaires de rôles
--   - helpers SQL : +is_global_association_admin(), +has_association_role()
--     refonte pour couvrir superadmin/bureau/tresorier comme admins globaux
--   - policies : réécrites proprement (DROP + CREATE) pour correspondre
--     exactement à la matrice d'accès demandée
--
-- IDEMPOTENT : tout est en IF NOT EXISTS / DO $$ EXCEPTION $$
-- SAFE : aucune suppression de colonne, aucune donnée touchée
-- ============================================================


-- ============================================================
-- 1. ASSOCIATIONS : colonnes manquantes + contraintes
-- ============================================================

-- ── is_public : visibilité publique de la fiche ──
DO $$ BEGIN
  ALTER TABLE public.associations
    ADD COLUMN is_public boolean NOT NULL DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_associations_is_public
  ON public.associations(is_public) WHERE is_public = true;

-- ── Elargir le CHECK status pour inclure 'suspended' ──
-- L'existant (V3) a un CHECK (status IN ('draft','active','archived')).
-- On le drop et on recrée avec 'suspended' en plus.
DO $$ BEGIN
  ALTER TABLE public.associations DROP CONSTRAINT IF EXISTS chk_associations_status;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.associations
    ADD CONSTRAINT chk_associations_status
    CHECK (status IN ('draft', 'active', 'suspended', 'archived'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Index sur created_by (peut déjà exister via V2) ──
CREATE INDEX IF NOT EXISTS idx_associations_created_by
  ON public.associations(created_by);


-- ============================================================
-- 2. ASSOCIATION_MEMBERSHIPS : colonnes + contraintes
-- ============================================================

-- ── membership_status : état explicite du membership ──
-- L'existant utilise is_active + left_at. On ajoute un champ
-- membership_status TEXT pour une sémantique plus riche.
-- Valeurs : 'invited', 'active', 'inactive', 'left', 'revoked'
DO $$ BEGIN
  ALTER TABLE public.association_memberships
    ADD COLUMN membership_status text NOT NULL DEFAULT 'active';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.association_memberships
    ADD CONSTRAINT chk_membership_status
    CHECK (membership_status IN ('invited', 'active', 'inactive', 'left', 'revoked'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_assoc_memberships_status
  ON public.association_memberships(membership_status);

-- ── Backfill membership_status depuis is_active / left_at ──
-- Ne touche que les lignes en 'active' (le default) qui ne sont pas cohérentes
UPDATE public.association_memberships
SET membership_status = 'inactive'
WHERE is_active = false AND left_at IS NULL AND membership_status = 'active';

UPDATE public.association_memberships
SET membership_status = 'left'
WHERE is_active = false AND left_at IS NOT NULL AND membership_status = 'active';

-- ── Trigger : synchroniser membership_status et is_active ──
CREATE OR REPLACE FUNCTION public.sync_membership_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si membership_status change, mettre à jour is_active / left_at en conséquence
  IF TG_OP = 'UPDATE' AND NEW.membership_status IS DISTINCT FROM OLD.membership_status THEN
    CASE NEW.membership_status
      WHEN 'active' THEN
        NEW.is_active = true;
        NEW.left_at = NULL;
      WHEN 'invited' THEN
        NEW.is_active = false;
      WHEN 'inactive' THEN
        NEW.is_active = false;
      WHEN 'left' THEN
        NEW.is_active = false;
        IF NEW.left_at IS NULL THEN
          NEW.left_at = NOW();
        END IF;
      WHEN 'revoked' THEN
        NEW.is_active = false;
        IF NEW.left_at IS NULL THEN
          NEW.left_at = NOW();
        END IF;
    END CASE;
  -- Si is_active change (vieux code), synchroniser membership_status
  ELSIF TG_OP = 'UPDATE' AND NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    IF NEW.is_active = false AND NEW.membership_status = 'active' THEN
      NEW.membership_status = 'inactive';
    ELSIF NEW.is_active = true AND NEW.membership_status != 'active' THEN
      NEW.membership_status = 'active';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_membership_status ON public.association_memberships;
CREATE TRIGGER trg_sync_membership_status
  BEFORE UPDATE ON public.association_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_membership_status();


-- ============================================================
-- 3. HELPERS SQL — SECURITY DEFINER
-- ============================================================

-- ── 3a. is_global_association_admin() ──
-- Vérifie si l'utilisateur courant est admin global plateforme.
-- Admins globaux : profiles.role IN ('superadmin','bureau','tresorier')
-- OU profiles.role_function IN ('admin','bureau','superadmin')
-- Compatible avec l'existant (is_global_admin, is_platform_admin).
CREATE OR REPLACE FUNCTION public.is_global_association_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND (
        role IN ('admin', 'superadmin', 'bureau', 'tresorier')
        OR role_function IN ('admin', 'bureau', 'superadmin')
      )
  );
END;
$$;

COMMENT ON FUNCTION public.is_global_association_admin() IS
  'Vérifie si le user courant est admin global plateforme (superadmin, bureau, tresorier).';

-- ── 3b. is_association_member(uuid) — déjà existant, on le stabilise ──
-- Retourne true si le user courant est membre actif de l'association.
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

COMMENT ON FUNCTION public.is_association_member(uuid) IS
  'Vérifie si le user courant est membre actif de l''association donnée.';

-- ── 3c. has_association_role(uuid, text[]) ──
-- Vérifie si le user courant a un des rôles donnés dans l'association.
-- Fonctionne avec les rôles ENUM existants ET le vocabulaire du prompt.
CREATE OR REPLACE FUNCTION public.has_association_role(
  p_association_id uuid,
  p_roles text[]
)
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
      AND (
        -- Correspondance directe avec l'enum existant
        role::text = ANY(p_roles)
        -- Mapping du vocabulaire prompt → enum existant
        OR (
          'admin' = ANY(p_roles)
          AND role IN ('president', 'vice_president')
        )
        OR (
          'owner' = ANY(p_roles)
          AND role = 'president'
        )
        OR (
          'bureau' = ANY(p_roles)
          AND role IN ('president', 'vice_president', 'tresorier', 'secretaire')
        )
        OR (
          'staff' = ANY(p_roles)
          AND role IN ('responsable', 'benevole')
        )
        OR (
          'member' = ANY(p_roles)
          AND role = 'membre'
        )
        OR (
          'manager' = ANY(p_roles)
          AND role IN ('president', 'vice_president', 'tresorier', 'secretaire')
        )
      )
  );
END;
$$;

COMMENT ON FUNCTION public.has_association_role(uuid, text[]) IS
  'Vérifie si le user courant possède un des rôles donnés dans l''association. '
  'Supporte le vocabulaire ENUM existant (president, vice_president...) '
  'ET le vocabulaire sémantique (admin, owner, bureau, staff, member, manager).';

-- ── 3d. Mise à jour is_association_leader ──
-- Leader = bureau (president, VP, secretaire, tresorier) — déjà existant,
-- on le stabilise pour être sûr.
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

-- ── 3e. Mise à jour is_association_admin ──
-- Admin d'asso = bureau asso OU admin global plateforme
CREATE OR REPLACE FUNCTION public.is_association_admin(p_association_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN
    public.is_global_association_admin()
    OR EXISTS (
      SELECT 1 FROM public.association_memberships
      WHERE association_id = p_association_id
        AND user_id = auth.uid()
        AND role IN ('president', 'vice_president', 'secretaire', 'tresorier')
        AND is_active = true
    );
END;
$$;

-- ── 3f. Mise à jour is_platform_admin / is_global_admin ──
-- Unification : is_platform_admin() et is_global_admin() pointent
-- tous les deux vers la même logique que is_global_association_admin().
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.is_global_association_admin();
END;
$$;

CREATE OR REPLACE FUNCTION public.is_global_admin(p_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := COALESCE(p_user_id, auth.uid());
  IF v_uid IS NULL THEN RETURN false; END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = v_uid
      AND (
        role IN ('admin', 'superadmin', 'bureau', 'tresorier')
        OR role_function IN ('admin', 'bureau', 'superadmin')
      )
  );
END;
$$;


-- ============================================================
-- 4. RLS POLICIES — associations
-- ============================================================

-- ── Drop toutes les policies existantes sur associations ──
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'associations'
      AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.associations', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.associations ENABLE ROW LEVEL SECURITY;

-- SELECT : is_public = true OU membre actif OU admin global
CREATE POLICY "asso_select"
  ON public.associations
  FOR SELECT
  TO authenticated
  USING (
    is_public = true
    OR public.is_global_association_admin()
    OR public.is_association_member(id)
    -- Drafts visibles par l'owner
    OR (status = 'draft' AND (created_by = auth.uid() OR owner_user_id = auth.uid()))
  );

-- INSERT : uniquement superadmin ou bureau global
CREATE POLICY "asso_insert"
  ON public.associations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('superadmin', 'bureau')
    )
    OR public.is_global_association_admin()
  );

-- UPDATE : admin global OU admin/owner de l'association
CREATE POLICY "asso_update"
  ON public.associations
  FOR UPDATE
  TO authenticated
  USING (
    public.is_global_association_admin()
    OR public.has_association_role(id, ARRAY['admin', 'owner'])
  )
  WITH CHECK (
    public.is_global_association_admin()
    OR public.has_association_role(id, ARRAY['admin', 'owner'])
  );

-- DELETE : uniquement superadmin
CREATE POLICY "asso_delete"
  ON public.associations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'superadmin'
    )
  );


-- ============================================================
-- 5. RLS POLICIES — association_memberships
-- ============================================================

-- ── Drop toutes les policies existantes ──
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

ALTER TABLE public.association_memberships ENABLE ROW LEVEL SECURITY;

-- SELECT : sa propre adhésion OU membre actif de la même asso OU admin global
CREATE POLICY "am_select"
  ON public.association_memberships
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_global_association_admin()
    OR public.is_association_member(association_id)
  );

-- INSERT : admin global OU admin/owner de l'association
CREATE POLICY "am_insert"
  ON public.association_memberships
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_global_association_admin()
    OR public.has_association_role(association_id, ARRAY['admin', 'owner'])
  );

-- UPDATE : admin global OU admin/owner de l'association
-- (inclut la possibilité pour un membre de se retirer via sync trigger)
CREATE POLICY "am_update"
  ON public.association_memberships
  FOR UPDATE
  TO authenticated
  USING (
    public.is_global_association_admin()
    OR public.has_association_role(association_id, ARRAY['admin', 'owner'])
    OR user_id = auth.uid()  -- self-leave / self-update limité
  )
  WITH CHECK (
    public.is_global_association_admin()
    OR public.has_association_role(association_id, ARRAY['admin', 'owner'])
    OR (
      -- Self-leave : le membre ne peut que se désactiver, pas se promouvoir
      user_id = auth.uid()
      AND is_active = false
    )
  );

-- DELETE : admin global OU owner de l'association uniquement
CREATE POLICY "am_delete"
  ON public.association_memberships
  FOR DELETE
  TO authenticated
  USING (
    public.is_global_association_admin()
    OR public.has_association_role(association_id, ARRAY['owner'])
  );


-- ============================================================
-- 6. RLS POLICIES — events (compléments additifs)
-- ============================================================

-- On NE touche PAS aux policies events existantes.
-- On ajoute des policies complémentaires si elles n'existent pas.
-- Les policies existantes (20260403_events_association_rls.sql + V3) couvrent :
--   - events_select_authenticated (SELECT pour tous les authentifiés)
--   - events_insert_admin_or_leader (INSERT admin global OU leader asso)
--   - events_update_admin_or_leader (UPDATE admin global OU leader asso)
--   - events_delete_admin_only (DELETE admin global uniquement)
--   - events_update_asso_owner (UPDATE owner asso)
--   - events_insert_asso_owner (INSERT owner asso)
--
-- La couverture est déjà complète pour le cas d'usage demandé :
--   - admins globaux peuvent tout gérer ✓
--   - admins/managers d'association peuvent gérer leurs events ✓
--
-- Aucune policy supplémentaire n'est nécessaire.


-- ============================================================
-- 7. UPDATED_AT TRIGGERS
-- ============================================================

-- Les triggers updated_at existent déjà depuis V1 via
-- handle_association_updated_at(). On s'assure qu'ils sont en place.

DROP TRIGGER IF EXISTS on_association_updated ON public.associations;
CREATE TRIGGER on_association_updated
  BEFORE UPDATE ON public.associations
  FOR EACH ROW EXECUTE FUNCTION public.handle_association_updated_at();

DROP TRIGGER IF EXISTS on_assoc_membership_updated ON public.association_memberships;
CREATE TRIGGER on_assoc_membership_updated
  BEFORE UPDATE ON public.association_memberships
  FOR EACH ROW EXECUTE FUNCTION public.handle_association_updated_at();


-- ============================================================
-- 8. VUE ADMIN ENRICHIE (ajout membership_status)
-- ============================================================

DROP VIEW IF EXISTS public.association_members_view;
CREATE VIEW public.association_members_view AS
SELECT
  am.id             AS membership_id,
  am.association_id,
  am.user_id,
  am.user_id        AS profile_id,  -- alias pour compat avec le vocabulaire prompt
  am.role           AS association_role,
  am.title          AS association_title,
  am.joined_at,
  am.left_at,
  am.is_active,
  am.membership_status,
  am.is_primary,
  am.notes,
  am.created_at     AS membership_created_at,
  p.username,
  p.display_name,
  p.avatar_url,
  p.city            AS user_city,
  p.role            AS platform_role,
  a.name            AS association_name,
  a.slug            AS association_slug,
  a.status          AS association_status,
  a.is_public       AS association_is_public,
  a.owner_user_id   AS association_owner_id
FROM public.association_memberships am
JOIN public.profiles p ON p.id = am.user_id
JOIN public.associations a ON a.id = am.association_id;


-- ============================================================
-- RÉCAPITULATIF
-- ============================================================

-- TABLES MODIFIÉES :
--   associations              : +is_public, CHECK status élargi (+suspended)
--   association_memberships   : +membership_status (+ CHECK + backfill + sync trigger)
--
-- FONCTIONS CRÉÉES / MISES À JOUR :
--   is_global_association_admin()           — NOUVEAU : admin global plateforme
--   is_association_member(uuid)             — STABILISÉ
--   has_association_role(uuid, text[])       — NOUVEAU : check multi-rôle avec mapping sémantique
--   is_association_leader(uuid)             — STABILISÉ
--   is_association_admin(uuid)              — MIS À JOUR : utilise is_global_association_admin()
--   is_platform_admin()                     — MIS À JOUR : alias vers is_global_association_admin()
--   is_global_admin(uuid)                   — MIS À JOUR : même logique
--   sync_membership_status()               — NOUVEAU : trigger sync membership_status ↔ is_active
--
-- POLICIES RÉÉCRITES (DROP + CREATE propre) :
--   associations :
--     asso_select  — is_public OR membre OR admin global OR draft owner
--     asso_insert  — superadmin/bureau global
--     asso_update  — admin global OR admin/owner asso
--     asso_delete  — superadmin uniquement
--
--   association_memberships :
--     am_select    — self OR membre même asso OR admin global
--     am_insert    — admin global OR admin/owner asso
--     am_update    — admin global OR admin/owner asso OR self-leave
--     am_delete    — admin global OR owner asso
--
-- EVENTS :
--   Aucune modification. Les policies existantes couvrent déjà les cas demandés.
--
-- VUE ENRICHIE :
--   association_members_view : +membership_status, +profile_id alias, +is_public
--
-- INDEXES AJOUTÉS :
--   idx_associations_is_public
--   idx_assoc_memberships_status
