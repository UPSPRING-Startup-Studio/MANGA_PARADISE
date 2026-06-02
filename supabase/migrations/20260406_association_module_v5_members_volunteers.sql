-- ============================================================
-- MODULE ASSOCIATION V5 — Membres, Bénévoles & Pop Culture
--
-- CONTEXTE :
--   V4 a ajouté is_public, membership_status et les helpers.
--   V5 enrichit le modèle membership pour supporter :
--     - Statut d'appartenance (parcours d'entrée)
--     - Niveau d'engagement (membre → bureau)
--     - Champs métier pop culture japonaise
--     - Données bénévoles (compétences, dispos, expérience)
--     - Données bureau (mandat, visibilité, ordre affichage)
--
-- IDEMPOTENT : tout en IF NOT EXISTS / DO $$ EXCEPTION $$
-- SAFE : aucune suppression de colonne, aucune donnée cassée
-- ============================================================


-- ============================================================
-- 1. ASSOCIATION_MEMBERSHIPS : Nouvelles colonnes métier
-- ============================================================

-- ── Niveau d'engagement (parcours fan → bureau) ──
DO $$ BEGIN
  ALTER TABLE public.association_memberships
    ADD COLUMN engagement_level text NOT NULL DEFAULT 'membre';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.association_memberships
    ADD CONSTRAINT chk_engagement_level
    CHECK (engagement_level IN (
      'membre', 'adherent', 'benevole_occasionnel',
      'benevole_actif', 'staff', 'bureau'
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Statut d'appartenance (parcours d'entrée dans l'asso) ──
DO $$ BEGIN
  ALTER TABLE public.association_memberships
    ADD COLUMN belonging_status text NOT NULL DEFAULT 'valide';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.association_memberships
    ADD CONSTRAINT chk_belonging_status
    CHECK (belonging_status IN (
      'invite', 'dossier_commence', 'a_valider',
      'valide', 'refuse', 'archive'
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Centres d'intérêt pop culture ──
DO $$ BEGIN
  ALTER TABLE public.association_memberships
    ADD COLUMN interests text[] NOT NULL DEFAULT '{}';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ── Préférences de participation (missions bénévoles) ──
DO $$ BEGIN
  ALTER TABLE public.association_memberships
    ADD COLUMN participation_preferences text[] NOT NULL DEFAULT '{}';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ── Disponibilités ──
DO $$ BEGIN
  ALTER TABLE public.association_memberships
    ADD COLUMN availability jsonb NOT NULL DEFAULT '{}';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ── Niveau d'expérience bénévole ──
DO $$ BEGIN
  ALTER TABLE public.association_memberships
    ADD COLUMN volunteer_experience text NOT NULL DEFAULT 'debutant';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.association_memberships
    ADD CONSTRAINT chk_volunteer_experience
    CHECK (volunteer_experience IN ('debutant', 'intermediaire', 'confirme', 'expert'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Langues parlées ──
DO $$ BEGIN
  ALTER TABLE public.association_memberships
    ADD COLUMN languages text[] NOT NULL DEFAULT '{"francais"}';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ── Consentement image / photo ──
DO $$ BEGIN
  ALTER TABLE public.association_memberships
    ADD COLUMN consent_photo boolean NOT NULL DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ── Compétences spécifiques ──
DO $$ BEGIN
  ALTER TABLE public.association_memberships
    ADD COLUMN skills text[] NOT NULL DEFAULT '{}';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ── Données bureau / mandat ──
DO $$ BEGIN
  ALTER TABLE public.association_memberships
    ADD COLUMN mandate_start date;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.association_memberships
    ADD COLUMN mandate_end date;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ── Visibilité publique sur la fiche ──
DO $$ BEGIN
  ALTER TABLE public.association_memberships
    ADD COLUMN public_visibility boolean NOT NULL DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ── Ordre d'affichage (pour le bureau sur la fiche publique) ──
DO $$ BEGIN
  ALTER TABLE public.association_memberships
    ADD COLUMN display_order integer NOT NULL DEFAULT 999;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;


-- ============================================================
-- 2. INDEXES pour les nouvelles colonnes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_assoc_memberships_engagement
  ON public.association_memberships(engagement_level);

CREATE INDEX IF NOT EXISTS idx_assoc_memberships_belonging
  ON public.association_memberships(belonging_status);

CREATE INDEX IF NOT EXISTS idx_assoc_memberships_interests
  ON public.association_memberships USING gin(interests);

CREATE INDEX IF NOT EXISTS idx_assoc_memberships_skills
  ON public.association_memberships USING gin(skills);

CREATE INDEX IF NOT EXISTS idx_assoc_memberships_participation
  ON public.association_memberships USING gin(participation_preferences);

CREATE INDEX IF NOT EXISTS idx_assoc_memberships_display_order
  ON public.association_memberships(association_id, display_order)
  WHERE public_visibility = true;


-- ============================================================
-- 3. BACKFILL : déduire engagement_level depuis role existant
-- ============================================================

-- Les memberships existants ont des rôles mais pas d'engagement_level.
-- On mappe : bureau roles → 'bureau', benevole → 'benevole_actif', membre → 'membre'
UPDATE public.association_memberships
SET engagement_level = 'bureau'
WHERE role IN ('president', 'vice_president', 'tresorier', 'secretaire')
  AND engagement_level = 'membre';

UPDATE public.association_memberships
SET engagement_level = 'staff'
WHERE role = 'responsable'
  AND engagement_level = 'membre';

UPDATE public.association_memberships
SET engagement_level = 'benevole_actif'
WHERE role = 'benevole'
  AND engagement_level = 'membre';

-- Backfill public_visibility pour les bureau existants
UPDATE public.association_memberships
SET public_visibility = true
WHERE role IN ('president', 'vice_president', 'tresorier', 'secretaire')
  AND public_visibility = false;

-- Backfill display_order pour les bureau existants
UPDATE public.association_memberships
SET display_order = CASE role
  WHEN 'president' THEN 1
  WHEN 'vice_president' THEN 2
  WHEN 'secretaire' THEN 3
  WHEN 'tresorier' THEN 4
  WHEN 'responsable' THEN 5
  ELSE 999
END
WHERE display_order = 999
  AND role IN ('president', 'vice_president', 'secretaire', 'tresorier', 'responsable');


-- ============================================================
-- 4. VUE ENRICHIE — Mise à jour avec les nouveaux champs
-- ============================================================

DROP VIEW IF EXISTS public.association_members_view;
CREATE VIEW public.association_members_view AS
SELECT
  am.id                     AS membership_id,
  am.association_id,
  am.user_id,
  am.user_id                AS profile_id,
  am.role                   AS association_role,
  am.title                  AS association_title,
  am.joined_at,
  am.left_at,
  am.is_active,
  am.membership_status,
  am.engagement_level,
  am.belonging_status,
  am.interests,
  am.participation_preferences,
  am.availability,
  am.volunteer_experience,
  am.languages,
  am.consent_photo,
  am.skills,
  am.mandate_start,
  am.mandate_end,
  am.public_visibility,
  am.display_order,
  am.is_primary,
  am.notes,
  am.created_at             AS membership_created_at,
  p.username,
  p.display_name,
  p.avatar_url,
  p.city                    AS user_city,
  p.role                    AS platform_role,
  a.name                    AS association_name,
  a.slug                    AS association_slug,
  a.status                  AS association_status,
  a.is_public               AS association_is_public,
  a.owner_user_id           AS association_owner_id
FROM public.association_memberships am
JOIN public.profiles p ON p.id = am.user_id
JOIN public.associations a ON a.id = am.association_id;


-- ============================================================
-- 5. TRIGGER : auto-set engagement_level quand role change
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_engagement_from_role()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role) THEN
    NEW.engagement_level = CASE NEW.role
      WHEN 'president' THEN 'bureau'
      WHEN 'vice_president' THEN 'bureau'
      WHEN 'tresorier' THEN 'bureau'
      WHEN 'secretaire' THEN 'bureau'
      WHEN 'responsable' THEN 'staff'
      WHEN 'benevole' THEN 'benevole_actif'
      ELSE COALESCE(NEW.engagement_level, 'membre')
    END;

    -- Auto-set public_visibility pour bureau
    IF NEW.role IN ('president', 'vice_president', 'tresorier', 'secretaire') THEN
      NEW.public_visibility = true;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_engagement_from_role ON public.association_memberships;
CREATE TRIGGER trg_sync_engagement_from_role
  BEFORE INSERT OR UPDATE ON public.association_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_engagement_from_role();


-- ============================================================
-- RÉCAPITULATIF V5
-- ============================================================
--
-- COLONNES AJOUTÉES à association_memberships :
--   engagement_level          TEXT    — membre/adherent/benevole_*/staff/bureau
--   belonging_status          TEXT    — invite/dossier_commence/a_valider/valide/refuse/archive
--   interests                 TEXT[]  — centres d'intérêt pop culture
--   participation_preferences TEXT[]  — préférences missions bénévoles
--   availability              JSONB   — disponibilités structurées
--   volunteer_experience      TEXT    — debutant/intermediaire/confirme/expert
--   languages                 TEXT[]  — langues parlées
--   consent_photo             BOOLEAN — consentement photo/image
--   skills                    TEXT[]  — compétences spécifiques
--   mandate_start             DATE    — début de mandat (bureau)
--   mandate_end               DATE    — fin de mandat (bureau)
--   public_visibility         BOOLEAN — visible sur fiche publique
--   display_order             INTEGER — ordre d'affichage fiche
--
-- INDEXES :
--   idx_assoc_memberships_engagement
--   idx_assoc_memberships_belonging
--   idx_assoc_memberships_interests      (GIN)
--   idx_assoc_memberships_skills         (GIN)
--   idx_assoc_memberships_participation  (GIN)
--   idx_assoc_memberships_display_order  (partial)
--
-- TRIGGER :
--   trg_sync_engagement_from_role — auto-set engagement_level quand role change
--
-- VUE :
--   association_members_view — enrichie avec tous les nouveaux champs
