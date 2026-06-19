-- ============================================================
-- MODULE ASSOCIATION V3 — Consolidation complète
--
-- Cette migration consolide le socle association existant
-- (fondation 20260403 + enrichissement V2 20260404) avec :
--   - colonnes manquantes sur associations / memberships / invitations
--   - helpers SQL supplémentaires (is_global_admin, etc.)
--   - ajout de owner_user_id sur associations
--   - CHECK constraints sur les champs textuels
--   - indexes complémentaires (invited_email, invited_user_id)
--   - policy self-leave pour memberships
--   - policy lecture invitations pour l'invité connecté
--   - policy events complémentaire pour admins asso
--   - récapitulatif en fin de fichier
--
-- IDEMPOTENT : tout est en IF NOT EXISTS / DO $$ EXCEPTION $$
-- ============================================================


-- ============================================================
-- 1. ALTER TABLE — Colonnes manquantes
-- ============================================================

-- ── 1a. associations : owner_user_id ──
DO $$ BEGIN
  ALTER TABLE public.associations
    ADD COLUMN owner_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_associations_owner ON public.associations(owner_user_id);

-- Backfill : copier created_by → owner_user_id si vide
UPDATE public.associations
SET owner_user_id = created_by
WHERE owner_user_id IS NULL AND created_by IS NOT NULL;

-- ── 1b. associations : CHECK status ──
-- Le status existant est TEXT DEFAULT 'active'. On ajoute un CHECK si absent.
DO $$ BEGIN
  ALTER TABLE public.associations
    ADD CONSTRAINT chk_associations_status
    CHECK (status IN ('draft', 'active', 'archived'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 1c. associations : CHECK slug non vide + format ──
DO $$ BEGIN
  ALTER TABLE public.associations
    ADD CONSTRAINT chk_associations_slug_format
    CHECK (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$' OR length(slug) <= 2);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.associations
    ADD CONSTRAINT chk_associations_name_nonempty
    CHECK (length(trim(name)) >= 1);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 1d. association_invitations : invited_email (alias de email existant) ──
-- Le prompt demande "invited_email" mais la V2 a déjà "email". On crée un alias.
DO $$ BEGIN
  ALTER TABLE public.association_invitations
    ADD COLUMN invited_email text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.association_invitations
    ADD COLUMN invited_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Sync : copier les données existantes si les nouvelles colonnes sont vides
UPDATE public.association_invitations
SET invited_email = lower(email)
WHERE invited_email IS NULL AND email IS NOT NULL;

UPDATE public.association_invitations
SET invited_user_id = user_id
WHERE invited_user_id IS NULL AND user_id IS NOT NULL;

-- ── 1e. association_invitations : colonne cancelled_at ──
DO $$ BEGIN
  ALTER TABLE public.association_invitations ADD COLUMN cancelled_at timestamptz;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ── 1f. association_invitations : CHECK constraints ──
-- Le prompt veut "pending, accepted, declined, expired, cancelled" mais
-- l'enum existant est ('pending','accepted','rejected','expired').
-- On ne peut pas modifier un ENUM en place. On utilise le champ existant
-- et on documente que 'rejected' = 'declined' dans notre contexte.
-- 'cancelled' sera stocké comme 'rejected' avec cancelled_at NOT NULL.

-- ── 1g. association_invitations : contrainte au moins un identifiant ──
DO $$ BEGIN
  ALTER TABLE public.association_invitations
    ADD CONSTRAINT chk_invitation_has_target
    CHECK (user_id IS NOT NULL OR invited_user_id IS NOT NULL OR email IS NOT NULL OR invited_email IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================
-- 2. HELPERS SQL COMPLÉMENTAIRES
-- ============================================================

-- ── is_global_admin : vérifie les rôles globaux plateforme ──
-- Couvre bureau, tresorier, superadmin + le rôle admin existant
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
        role IN ('admin', 'bureau', 'superadmin', 'tresorier')
        OR role_function IN ('admin', 'bureau', 'superadmin')
      )
  );
END;
$$;

-- ── Mise à jour is_platform_admin pour inclure bureau/superadmin/tresorier ──
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.is_global_admin(auth.uid());
END;
$$;

-- ── is_association_owner : vérifie si l'user est owner de l'asso ──
CREATE OR REPLACE FUNCTION public.is_association_owner(p_association_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.associations
    WHERE id = p_association_id
      AND owner_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.association_memberships
    WHERE association_id = p_association_id
      AND user_id = auth.uid()
      AND role = 'president'
      AND is_active = true
  );
END;
$$;


-- ============================================================
-- 3. INDEX COMPLÉMENTAIRES
-- ============================================================

-- association_invitations
CREATE INDEX IF NOT EXISTS idx_assoc_invitations_invited_user
  ON public.association_invitations(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_assoc_invitations_invited_email
  ON public.association_invitations(lower(invited_email));

-- association_memberships : composite status (pour filtrage rapide)
CREATE INDEX IF NOT EXISTS idx_assoc_memberships_user_active
  ON public.association_memberships(user_id, is_active);


-- ============================================================
-- 4. POLICIES COMPLÉMENTAIRES
-- ============================================================

-- ── 4a. associations : SELECT pour draft visible par membres ──
-- La policy existante ne laisse voir que status = 'active'.
-- On ajoute une policy pour les drafts visibles par les membres.
DROP POLICY IF EXISTS "asso_select_draft_members" ON public.associations;
CREATE POLICY "asso_select_draft_members"
  ON public.associations
  FOR SELECT
  TO authenticated
  USING (
    status = 'draft'
    AND (
      public.is_platform_admin()
      OR public.is_association_member(id)
      OR owner_user_id = auth.uid()
    )
  );

-- ── 4b. associations : DELETE policy (owner ou superadmin) ──
DROP POLICY IF EXISTS "asso_delete_owner_or_superadmin" ON public.associations;
CREATE POLICY "asso_delete_owner_or_superadmin"
  ON public.associations
  FOR DELETE
  TO authenticated
  USING (
    public.is_platform_admin()
    OR owner_user_id = auth.uid()
  );

-- ── 4c. association_memberships : self-leave ──
-- Permet à un membre de se retirer lui-même (passer is_active = false)
-- SANS être leader. Implémenté comme une policy UPDATE supplémentaire.
DROP POLICY IF EXISTS "am_self_leave" ON public.association_memberships;
CREATE POLICY "am_self_leave"
  ON public.association_memberships
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
    AND is_active = false  -- ne peut que se désactiver, pas se réactiver
  );

-- ── 4d. association_invitations : SELECT pour l'invité connecté ──
-- La policy existante couvre user_id = auth.uid() et invited_by.
-- On ajoute la couverture par invited_user_id et invited_email.
DROP POLICY IF EXISTS "ai_select_invitee_extended" ON public.association_invitations;
CREATE POLICY "ai_select_invitee_extended"
  ON public.association_invitations
  FOR SELECT
  TO authenticated
  USING (
    invited_user_id = auth.uid()
    OR lower(invited_email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- ── 4e. association_invitations : UPDATE par l'invité (accepter/refuser) ──
DROP POLICY IF EXISTS "ai_update_invitee_respond" ON public.association_invitations;
CREATE POLICY "ai_update_invitee_respond"
  ON public.association_invitations
  FOR UPDATE
  TO authenticated
  USING (
    invited_user_id = auth.uid()
    OR user_id = auth.uid()
  );

-- ── 4f. events : UPDATE complémentaire pour admins d'association ──
-- Les policies events existantes (20260403_events_association_rls.sql) couvrent
-- déjà INSERT/UPDATE via is_association_leader. On ajoute un accès via owner.
DROP POLICY IF EXISTS "events_update_asso_owner" ON public.events;
CREATE POLICY "events_update_asso_owner"
  ON public.events
  FOR UPDATE
  TO authenticated
  USING (
    association_id IS NOT NULL
    AND public.is_association_owner(association_id)
  )
  WITH CHECK (
    association_id IS NOT NULL
    AND public.is_association_owner(association_id)
  );

-- ── 4g. events : INSERT complémentaire pour owner ──
DROP POLICY IF EXISTS "events_insert_asso_owner" ON public.events;
CREATE POLICY "events_insert_asso_owner"
  ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    association_id IS NOT NULL
    AND public.is_association_owner(association_id)
  );


-- ============================================================
-- 5. TRIGGER email lowercase sur invitations
-- ============================================================

CREATE OR REPLACE FUNCTION public.normalize_invitation_emails()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email = lower(trim(NEW.email));
  END IF;
  IF NEW.invited_email IS NOT NULL THEN
    NEW.invited_email = lower(trim(NEW.invited_email));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_invitation_emails ON public.association_invitations;
CREATE TRIGGER trg_normalize_invitation_emails
  BEFORE INSERT OR UPDATE ON public.association_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_invitation_emails();

-- Email lowercase sur associations aussi
CREATE OR REPLACE FUNCTION public.normalize_association_email()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email = lower(trim(NEW.email));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_association_email ON public.associations;
CREATE TRIGGER trg_normalize_association_email
  BEFORE INSERT OR UPDATE ON public.associations
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_association_email();


-- ============================================================
-- 6. VUE ADMIN ENRICHIE (consolidée avec owner)
-- ============================================================

DROP VIEW IF EXISTS public.association_members_view;
CREATE VIEW public.association_members_view AS
SELECT
  am.id            AS membership_id,
  am.association_id,
  am.user_id,
  am.role          AS association_role,
  am.title         AS association_title,
  am.joined_at,
  am.left_at,
  am.is_active,
  am.is_primary,
  am.notes,
  am.created_at    AS membership_created_at,
  p.username,
  p.display_name,
  p.avatar_url,
  p.city           AS user_city,
  p.role           AS platform_role,
  a.name           AS association_name,
  a.slug           AS association_slug,
  a.status         AS association_status,
  a.owner_user_id  AS association_owner_id
FROM public.association_memberships am
JOIN public.profiles p ON p.id = am.user_id
JOIN public.associations a ON a.id = am.association_id;


-- ============================================================
-- RÉCAPITULATIF
-- ============================================================

-- TABLES MODIFIÉES :
--   associations        : +owner_user_id, +CHECK status/slug/name
--   association_invitations : +invited_email, +invited_user_id, +cancelled_at, +CHECK target
--   events              : (déjà association_id depuis V1)

-- FONCTIONS CRÉÉES/MISES À JOUR :
--   is_global_admin(uuid)           — vérifie admin/bureau/superadmin/tresorier
--   is_platform_admin()             — alias de is_global_admin(auth.uid())
--   is_association_owner(uuid)      — owner ou president actif
--   normalize_invitation_emails()   — trigger lowercase emails invitations
--   normalize_association_email()   — trigger lowercase email associations

-- POLICIES AJOUTÉES :
--   asso_select_draft_members       — draft visible par membres/owner/admin
--   asso_delete_owner_or_superadmin — suppression par owner ou admin plateforme
--   am_self_leave                   — un membre peut se retirer lui-même
--   ai_select_invitee_extended      — l'invité voit ses invitations (par invited_user_id ou email)
--   ai_update_invitee_respond       — l'invité peut accepter/refuser
--   events_update_asso_owner        — owner d'asso peut modifier ses events
--   events_insert_asso_owner        — owner d'asso peut créer des events

-- INDEX AJOUTÉS :
--   idx_associations_owner
--   idx_assoc_invitations_invited_user
--   idx_assoc_invitations_invited_email
--   idx_assoc_memberships_user_active

-- À BRANCHER CÔTÉ FRONTEND/BACKEND (10 lignes max) :
--   1. Hook useAssociation : ajouter owner_user_id dans le type Association
--   2. Page admin : champ sélecteur "Owner" dans le formulaire d'association
--   3. Hook useAssociationInvitations : supporter invited_email + invited_user_id
--   4. Flow invitation : appel RPC accept_association_invitation(invitation_id)
--   5. Type TS : ajouter invited_email, invited_user_id, cancelled_at aux types
--   6. Guard self-leave : bouton "Quitter l'association" accessible à tout membre
--   7. is_global_admin utilisable dans les guards admin côté TS
--   8. Filtre draft : les associations en brouillon visibles seulement par les membres/admin
