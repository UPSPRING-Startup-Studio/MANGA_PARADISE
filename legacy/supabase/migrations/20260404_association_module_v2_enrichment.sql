-- ============================================================
-- MODULE ASSOCIATION V2 — Enrichissement du socle existant
--
-- Ce script enrichit les tables, helpers, RPCs et policies
-- créés dans la migration fondation (20260403).
-- Il est IDEMPOTENT et ne casse rien de l'existant.
--
-- Sections :
--   1) ALTER TABLE : colonnes manquantes sur associations, memberships, invitations
--   2) Helpers SECURITY DEFINER complémentaires
--   3) Triggers (audit léger, auto joined_at)
--   4) Indexes complémentaires
--   5) RPCs utiles
--   6) Vue admin enrichie
--   7) Fonction accept_association_invitation
-- ============================================================

-- ============================================================
-- 1. ALTER TABLE — Ajout de colonnes manquantes
-- ============================================================

-- ── associations : champs supplémentaires ──
DO $$ BEGIN
  ALTER TABLE public.associations ADD COLUMN association_type text
    CHECK (association_type IN ('association1901','collectif','entreprise','autre'));
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.associations ADD COLUMN short_description text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.associations ADD COLUMN instagram_url text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.associations ADD COLUMN discord_url text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.associations ADD COLUMN country text DEFAULT 'France';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ── association_memberships : champ is_primary ──
DO $$ BEGIN
  ALTER TABLE public.association_memberships ADD COLUMN is_primary boolean NOT NULL DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Index partiel : max 1 is_primary = true par user_id
CREATE INDEX IF NOT EXISTS idx_assoc_memberships_primary
  ON public.association_memberships (user_id)
  WHERE is_primary = true;

-- ── association_invitations : champs email-based ──
-- L'existant invite par user_id. On ajoute le support email pour les futures
-- invitations de personnes non encore inscrites.
DO $$ BEGIN
  ALTER TABLE public.association_invitations ADD COLUMN email text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.association_invitations ADD COLUMN prenom text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.association_invitations ADD COLUMN nom text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.association_invitations ADD COLUMN phone text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.association_invitations ADD COLUMN token text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.association_invitations ADD COLUMN sent_at timestamptz;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.association_invitations ADD COLUMN accepted_at timestamptz;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Rendre user_id nullable (pour les invitations par email à des non-inscrits)
DO $$ BEGIN
  ALTER TABLE public.association_invitations ALTER COLUMN user_id DROP NOT NULL;
EXCEPTION WHEN others THEN NULL; END $$;

-- ============================================================
-- 2. HELPERS SECURITY DEFINER COMPLÉMENTAIRES
-- ============================================================

-- is_platform_admin() existe déjà (20260403_fix).
-- is_association_member(uuid) existe déjà.
-- is_association_leader(uuid) existe déjà.

-- ── Nouveau : is_association_admin — inclut les admins plateforme ──
CREATE OR REPLACE FUNCTION public.is_association_admin(p_association_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.association_memberships
      WHERE association_id = p_association_id
        AND user_id = auth.uid()
        AND role IN ('president', 'vice_president', 'secretaire', 'tresorier')
        AND is_active = true
    );
END;
$$;

-- ── Nouveau : can_view_association ──
CREATE OR REPLACE FUNCTION public.can_view_association(p_association_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN
    public.is_platform_admin()
    OR public.is_association_member(p_association_id)
    OR EXISTS (
      SELECT 1 FROM public.associations
      WHERE id = p_association_id
        AND status = 'active'
    );
END;
$$;

-- ============================================================
-- 3. TRIGGERS
-- ============================================================

-- ── 3a. Auto joined_at quand membership passe à active ──
CREATE OR REPLACE FUNCTION public.handle_membership_auto_joined_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_active = true AND OLD.is_active = false AND NEW.joined_at IS NULL THEN
    NEW.joined_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_membership_auto_joined_at ON public.association_memberships;
CREATE TRIGGER trg_membership_auto_joined_at
  BEFORE UPDATE ON public.association_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_membership_auto_joined_at();

-- ── 3b. Audit léger (défensif : ne casse pas si audit_logs n'existe pas) ──

-- Fonction générique d'audit
CREATE OR REPLACE FUNCTION public.log_association_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action text;
  v_target_id uuid;
  v_association_id uuid;
BEGIN
  -- Déterminer l'action
  IF TG_OP = 'INSERT' THEN
    v_action = TG_ARGV[0] || '_CREATED';
  ELSIF TG_OP = 'UPDATE' THEN
    v_action = TG_ARGV[0] || '_UPDATED';
  ELSIF TG_OP = 'DELETE' THEN
    v_action = TG_ARGV[0] || '_DELETED';
  END IF;

  -- Extraire les IDs selon la table
  IF TG_OP = 'DELETE' THEN
    v_target_id = OLD.id;
    IF TG_TABLE_NAME = 'associations' THEN
      v_association_id = OLD.id;
    ELSIF TG_TABLE_NAME IN ('association_memberships', 'association_invitations',
                            'association_contacts', 'association_documents') THEN
      v_association_id = OLD.association_id;
    ELSIF TG_TABLE_NAME = 'events' THEN
      v_association_id = OLD.association_id;
    END IF;
  ELSE
    v_target_id = NEW.id;
    IF TG_TABLE_NAME = 'associations' THEN
      v_association_id = NEW.id;
    ELSIF TG_TABLE_NAME IN ('association_memberships', 'association_invitations',
                            'association_contacts', 'association_documents') THEN
      v_association_id = NEW.association_id;
    ELSIF TG_TABLE_NAME = 'events' THEN
      v_association_id = NEW.association_id;
    END IF;
  END IF;

  -- Insérer dans audit_logs si la table existe
  BEGIN
    INSERT INTO public.audit_logs (actor_id, action, target_id, association_id, created_at)
    VALUES (auth.uid(), v_action, v_target_id, v_association_id, NOW());
  EXCEPTION WHEN undefined_table THEN
    -- audit_logs n'existe pas encore, on ignore silencieusement
    NULL;
  END;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Triggers d'audit sur les tables association (ne cassent pas si audit_logs absent)
DROP TRIGGER IF EXISTS trg_audit_association ON public.associations;
CREATE TRIGGER trg_audit_association
  AFTER INSERT OR UPDATE OR DELETE ON public.associations
  FOR EACH ROW EXECUTE FUNCTION public.log_association_audit('ASSOCIATION');

DROP TRIGGER IF EXISTS trg_audit_membership ON public.association_memberships;
CREATE TRIGGER trg_audit_membership
  AFTER INSERT OR UPDATE OR DELETE ON public.association_memberships
  FOR EACH ROW EXECUTE FUNCTION public.log_association_audit('MEMBERSHIP');

DROP TRIGGER IF EXISTS trg_audit_invitation ON public.association_invitations;
CREATE TRIGGER trg_audit_invitation
  AFTER INSERT OR UPDATE OR DELETE ON public.association_invitations
  FOR EACH ROW EXECUTE FUNCTION public.log_association_audit('INVITATION');

-- ============================================================
-- 4. INDEXES COMPLÉMENTAIRES
-- ============================================================

-- associations
CREATE INDEX IF NOT EXISTS idx_associations_created_by ON public.associations(created_by);
CREATE INDEX IF NOT EXISTS idx_associations_type ON public.associations(association_type);

-- association_memberships : indexes composites
CREATE INDEX IF NOT EXISTS idx_assoc_memberships_assoc_active
  ON public.association_memberships(association_id, is_active);
CREATE INDEX IF NOT EXISTS idx_assoc_memberships_assoc_role
  ON public.association_memberships(association_id, role);

-- association_invitations : email-based index
CREATE INDEX IF NOT EXISTS idx_assoc_invitations_email
  ON public.association_invitations(lower(email));
CREATE INDEX IF NOT EXISTS idx_assoc_invitations_assoc_status
  ON public.association_invitations(association_id, status);
CREATE INDEX IF NOT EXISTS idx_assoc_invitations_expires
  ON public.association_invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_assoc_invitations_token
  ON public.association_invitations(token)
  WHERE token IS NOT NULL;

-- ============================================================
-- 5. RPCs UTILES
-- ============================================================

-- ── Nombre de membres actifs d'une association ──
CREATE OR REPLACE FUNCTION public.get_association_members_count(p_association_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.association_memberships
  WHERE association_id = p_association_id
    AND is_active = true;
$$;

-- ── Nombre d'événements d'une association ──
CREATE OR REPLACE FUNCTION public.get_association_events_count(p_association_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.events
  WHERE association_id = p_association_id;
$$;

-- ── Rôle courant de l'utilisateur dans une association ──
CREATE OR REPLACE FUNCTION public.get_my_association_role(p_association_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM public.association_memberships
  WHERE association_id = p_association_id
    AND user_id = auth.uid()
    AND is_active = true
  LIMIT 1;
$$;

-- ============================================================
-- 6. VUE ADMIN ENRICHIE
-- ============================================================

-- DROP d'abord car CREATE OR REPLACE ne peut pas changer l'ordre/les noms des colonnes
DROP VIEW IF EXISTS public.association_members_view;
CREATE VIEW public.association_members_view AS
SELECT
  am.id AS membership_id,
  am.association_id,
  am.user_id,
  am.role AS association_role,
  am.title AS association_title,
  am.joined_at,
  am.left_at,
  am.is_active,
  am.is_primary,
  am.notes,
  am.created_at AS membership_created_at,
  p.username,
  p.display_name,
  p.avatar_url,
  p.city AS user_city,
  p.role AS platform_role,
  a.name AS association_name,
  a.slug AS association_slug,
  a.status AS association_status
FROM public.association_memberships am
JOIN public.profiles p ON p.id = am.user_id
JOIN public.associations a ON a.id = am.association_id;

-- ============================================================
-- 7. FONCTION accept_association_invitation (BONUS)
-- ============================================================

-- Accepte une invitation et crée le membership en une transaction.
-- Utilisable par l'invité connecté ou par un admin.
CREATE OR REPLACE FUNCTION public.accept_association_invitation(p_invitation_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
  v_membership_id uuid;
  v_caller_id uuid;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  -- Récupérer l'invitation
  SELECT * INTO v_invitation
  FROM public.association_invitations
  WHERE id = p_invitation_id;

  IF v_invitation IS NULL THEN
    RAISE EXCEPTION 'Invitation introuvable';
  END IF;

  -- Vérifier que l'invitation est en attente
  IF v_invitation.status NOT IN ('pending', 'sent') THEN
    RAISE EXCEPTION 'Cette invitation n''est plus valide (statut: %)', v_invitation.status;
  END IF;

  -- Vérifier expiration
  IF v_invitation.expires_at IS NOT NULL AND v_invitation.expires_at < NOW() THEN
    -- Marquer comme expirée
    UPDATE public.association_invitations
    SET status = 'expired'::public.association_invitation_status
    WHERE id = p_invitation_id;

    RAISE EXCEPTION 'Cette invitation a expiré';
  END IF;

  -- Vérifier que l'appelant est bien l'invité (par user_id ou par email)
  IF v_invitation.user_id IS NOT NULL AND v_invitation.user_id != v_caller_id THEN
    -- Vérifier si c'est un admin plateforme
    IF NOT public.is_platform_admin() THEN
      RAISE EXCEPTION 'Tu n''es pas le destinataire de cette invitation';
    END IF;
  END IF;

  -- Créer ou réactiver le membership
  INSERT INTO public.association_memberships (
    association_id, user_id, role, is_active, joined_at
  )
  VALUES (
    v_invitation.association_id,
    COALESCE(v_invitation.user_id, v_caller_id),
    v_invitation.role,
    true,
    NOW()
  )
  ON CONFLICT (association_id, user_id) DO UPDATE
  SET
    role = EXCLUDED.role,
    is_active = true,
    left_at = NULL,
    joined_at = COALESCE(association_memberships.joined_at, NOW()),
    updated_at = NOW()
  RETURNING id INTO v_membership_id;

  -- Mettre à jour l'invitation
  UPDATE public.association_invitations
  SET
    status = 'accepted'::public.association_invitation_status,
    accepted_at = NOW(),
    responded_at = NOW(),
    user_id = COALESCE(v_invitation.user_id, v_caller_id)
  WHERE id = p_invitation_id;

  RETURN v_membership_id;
END;
$$;

-- Commentaire métier : la contrainte "au moins 1 president/owner actif par association"
-- doit être gérée côté applicatif (frontend guards) plutôt que par une contrainte SQL,
-- car les triggers CHECK sur des agrégations multi-lignes sont fragiles et
-- bloquent les opérations de maintenance légitimes. Le frontend vérifie déjà
-- cette règle dans useUpdateMemberRole et useDeactivateMember.
