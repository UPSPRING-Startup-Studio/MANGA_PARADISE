-- ============================================================
-- MODULE PRO PARTNERS V1 — Espace Professionnels / Partenaires
--
-- CONTEXTE :
--   Ce module permet aux sociétés, boutiques, institutions et
--   lieux culturels de devenir partenaires de Manga Paradise.
--   Aligné sur les patterns du module Association (V4).
--
-- TABLES CRÉÉES :
--   - pro_partners              : fiches structures partenaires
--   - pro_partner_members       : utilisateurs rattachés
--   - pro_partner_applications  : demandes "Devenir partenaire"
--
-- MODIFICATIONS EXISTANTES :
--   - events : +organizer_type, +organizer_id (multi-organisateur)
--
-- FONCTIONS CRÉÉES :
--   - is_pro_partner_member(uuid)
--   - is_pro_partner_admin(uuid)
--   - has_pro_partner_role(uuid, text[])
--
-- IDEMPOTENT : IF NOT EXISTS / DO $$ EXCEPTION $$
-- ============================================================


-- ============================================================
-- 1. TABLE pro_partners — Fiches structures partenaires
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pro_partners (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text NOT NULL UNIQUE,
  type          text NOT NULL DEFAULT 'societe',
  description   text,
  description_long text,
  logo_url      text,
  banner_url    text,

  -- Identifiants légaux
  siret         text,

  -- Coordonnées
  address       text,
  city          text,
  postal_code   text,
  region        text,
  email         text,
  phone         text,
  website_url   text,
  social_links  jsonb DEFAULT '{}'::jsonb,

  -- Statut et visibilité
  status        text NOT NULL DEFAULT 'active',
  is_public     boolean NOT NULL DEFAULT false,

  -- Métadonnées
  created_by    uuid REFERENCES public.profiles(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Contraintes
DO $$ BEGIN
  ALTER TABLE public.pro_partners
    ADD CONSTRAINT chk_pro_partners_status
    CHECK (status IN ('draft', 'active', 'suspended', 'archived'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.pro_partners
    ADD CONSTRAINT chk_pro_partners_type
    CHECK (type IN ('societe', 'association', 'institution', 'boutique', 'lieu_culturel', 'media', 'autre'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Index
CREATE INDEX IF NOT EXISTS idx_pro_partners_slug ON public.pro_partners(slug);
CREATE INDEX IF NOT EXISTS idx_pro_partners_status ON public.pro_partners(status);
CREATE INDEX IF NOT EXISTS idx_pro_partners_type ON public.pro_partners(type);
CREATE INDEX IF NOT EXISTS idx_pro_partners_city ON public.pro_partners(city);
CREATE INDEX IF NOT EXISTS idx_pro_partners_is_public ON public.pro_partners(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_pro_partners_created_by ON public.pro_partners(created_by);

COMMENT ON TABLE public.pro_partners IS
  'Structures professionnelles partenaires de Manga Paradise (sociétés, boutiques, institutions, lieux culturels...).';


-- ============================================================
-- 2. TABLE pro_partner_members — Utilisateurs rattachés
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pro_partner_members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id      uuid NOT NULL REFERENCES public.pro_partners(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role            text NOT NULL DEFAULT 'member',
  title           text,
  notes           text,
  is_active       boolean NOT NULL DEFAULT true,
  membership_status text NOT NULL DEFAULT 'active',
  joined_at       timestamptz NOT NULL DEFAULT now(),
  left_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Contraintes
DO $$ BEGIN
  ALTER TABLE public.pro_partner_members
    ADD CONSTRAINT uq_pro_partner_members
    UNIQUE (partner_id, user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.pro_partner_members
    ADD CONSTRAINT chk_pro_partner_member_role
    CHECK (role IN ('owner', 'admin', 'manager', 'member'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.pro_partner_members
    ADD CONSTRAINT chk_pro_partner_membership_status
    CHECK (membership_status IN ('invited', 'active', 'inactive', 'left', 'revoked'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Index
CREATE INDEX IF NOT EXISTS idx_pro_partner_members_partner ON public.pro_partner_members(partner_id);
CREATE INDEX IF NOT EXISTS idx_pro_partner_members_user ON public.pro_partner_members(user_id);
CREATE INDEX IF NOT EXISTS idx_pro_partner_members_active ON public.pro_partner_members(partner_id, user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_pro_partner_members_status ON public.pro_partner_members(membership_status);

COMMENT ON TABLE public.pro_partner_members IS
  'Liaison utilisateurs ↔ structures partenaires, avec rôle et statut.';


-- ============================================================
-- 3. TABLE pro_partner_applications — Demandes "Devenir partenaire"
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pro_partner_applications (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Infos structure
  company_name      text NOT NULL,
  company_type      text NOT NULL DEFAULT 'societe',
  siret             text,
  description       text,

  -- Contact
  contact_first_name text NOT NULL,
  contact_last_name  text NOT NULL,
  contact_email      text NOT NULL,
  contact_phone      text,
  website_url        text,
  social_links       jsonb DEFAULT '{}'::jsonb,

  -- Message libre
  message           text,

  -- Workflow
  status            text NOT NULL DEFAULT 'pending',
  reviewed_by       uuid REFERENCES public.profiles(id),
  reviewed_at       timestamptz,
  rejection_reason  text,

  -- Lien vers le partenaire créé (après approbation)
  partner_id        uuid REFERENCES public.pro_partners(id),

  -- Lien vers l'utilisateur qui soumet (si connecté)
  submitted_by      uuid REFERENCES public.profiles(id),

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Contraintes
DO $$ BEGIN
  ALTER TABLE public.pro_partner_applications
    ADD CONSTRAINT chk_pro_partner_app_status
    CHECK (status IN ('pending', 'approved', 'rejected'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.pro_partner_applications
    ADD CONSTRAINT chk_pro_partner_app_type
    CHECK (company_type IN ('societe', 'association', 'institution', 'boutique', 'lieu_culturel', 'media', 'autre'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Index
CREATE INDEX IF NOT EXISTS idx_pro_partner_apps_status ON public.pro_partner_applications(status);
CREATE INDEX IF NOT EXISTS idx_pro_partner_apps_email ON public.pro_partner_applications(contact_email);
CREATE INDEX IF NOT EXISTS idx_pro_partner_apps_created ON public.pro_partner_applications(created_at DESC);

COMMENT ON TABLE public.pro_partner_applications IS
  'Demandes d''inscription "Devenir partenaire" en attente de validation admin.';


-- ============================================================
-- 4. EVENTS : ajout organizer_type / organizer_id
-- ============================================================

-- organizer_type : permet de distinguer l'organisateur
DO $$ BEGIN
  ALTER TABLE public.events
    ADD COLUMN organizer_type text NOT NULL DEFAULT 'manga_paradise';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.events
    ADD CONSTRAINT chk_events_organizer_type
    CHECK (organizer_type IN ('manga_paradise', 'association', 'pro_partner'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- organizer_id : UUID générique pointant vers le bon organisateur
DO $$ BEGIN
  ALTER TABLE public.events
    ADD COLUMN organizer_id uuid;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_events_organizer ON public.events(organizer_type, organizer_id);

-- Backfill : si association_id est renseigné, on met organizer_type = 'association'
UPDATE public.events
SET organizer_type = 'association',
    organizer_id = association_id
WHERE association_id IS NOT NULL
  AND organizer_type = 'manga_paradise';


-- ============================================================
-- 5. TRIGGERS updated_at
-- ============================================================

-- Réutilisation du même handler que les associations
DROP TRIGGER IF EXISTS on_pro_partner_updated ON public.pro_partners;
CREATE TRIGGER on_pro_partner_updated
  BEFORE UPDATE ON public.pro_partners
  FOR EACH ROW EXECUTE FUNCTION public.handle_association_updated_at();

DROP TRIGGER IF EXISTS on_pro_partner_member_updated ON public.pro_partner_members;
CREATE TRIGGER on_pro_partner_member_updated
  BEFORE UPDATE ON public.pro_partner_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_association_updated_at();

DROP TRIGGER IF EXISTS on_pro_partner_app_updated ON public.pro_partner_applications;
CREATE TRIGGER on_pro_partner_app_updated
  BEFORE UPDATE ON public.pro_partner_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_association_updated_at();


-- ============================================================
-- 6. TRIGGER sync membership_status ↔ is_active (pro_partner_members)
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_pro_partner_membership_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
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
        IF NEW.left_at IS NULL THEN NEW.left_at = NOW(); END IF;
      WHEN 'revoked' THEN
        NEW.is_active = false;
        IF NEW.left_at IS NULL THEN NEW.left_at = NOW(); END IF;
    END CASE;
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

DROP TRIGGER IF EXISTS trg_sync_pro_partner_membership_status ON public.pro_partner_members;
CREATE TRIGGER trg_sync_pro_partner_membership_status
  BEFORE UPDATE ON public.pro_partner_members
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_pro_partner_membership_status();


-- ============================================================
-- 7. HELPERS SQL — SECURITY DEFINER
-- ============================================================

-- 7a. is_pro_partner_member(uuid)
CREATE OR REPLACE FUNCTION public.is_pro_partner_member(p_partner_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.pro_partner_members
    WHERE partner_id = p_partner_id
      AND user_id = auth.uid()
      AND is_active = true
  );
END;
$$;

COMMENT ON FUNCTION public.is_pro_partner_member(uuid) IS
  'Vérifie si le user courant est membre actif du partenaire donné.';

-- 7b. has_pro_partner_role(uuid, text[])
CREATE OR REPLACE FUNCTION public.has_pro_partner_role(
  p_partner_id uuid,
  p_roles text[]
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.pro_partner_members
    WHERE partner_id = p_partner_id
      AND user_id = auth.uid()
      AND is_active = true
      AND role::text = ANY(p_roles)
  );
END;
$$;

COMMENT ON FUNCTION public.has_pro_partner_role(uuid, text[]) IS
  'Vérifie si le user courant possède un des rôles donnés dans le partenaire.';

-- 7c. is_pro_partner_admin(uuid)
-- Admin du partenaire = owner/admin OU admin global plateforme
CREATE OR REPLACE FUNCTION public.is_pro_partner_admin(p_partner_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN
    public.is_global_association_admin()
    OR public.has_pro_partner_role(p_partner_id, ARRAY['owner', 'admin']);
END;
$$;

COMMENT ON FUNCTION public.is_pro_partner_admin(uuid) IS
  'Vérifie si le user courant est admin du partenaire (owner/admin) ou admin global plateforme.';


-- ============================================================
-- 8. RLS POLICIES — pro_partners
-- ============================================================

ALTER TABLE public.pro_partners ENABLE ROW LEVEL SECURITY;

-- SELECT : public OU membre actif OU admin global
CREATE POLICY "pp_select"
  ON public.pro_partners
  FOR SELECT
  TO authenticated
  USING (
    is_public = true
    OR public.is_global_association_admin()
    OR public.is_pro_partner_member(id)
    OR (status = 'draft' AND created_by = auth.uid())
  );

-- INSERT : admin global uniquement (les partenaires sont créés après validation)
CREATE POLICY "pp_insert"
  ON public.pro_partners
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_global_association_admin()
  );

-- UPDATE : admin global OU owner/admin du partenaire
CREATE POLICY "pp_update"
  ON public.pro_partners
  FOR UPDATE
  TO authenticated
  USING (
    public.is_global_association_admin()
    OR public.has_pro_partner_role(id, ARRAY['owner', 'admin'])
  )
  WITH CHECK (
    public.is_global_association_admin()
    OR public.has_pro_partner_role(id, ARRAY['owner', 'admin'])
  );

-- DELETE : superadmin uniquement
CREATE POLICY "pp_delete"
  ON public.pro_partners
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
-- 9. RLS POLICIES — pro_partner_members
-- ============================================================

ALTER TABLE public.pro_partner_members ENABLE ROW LEVEL SECURITY;

-- SELECT : soi-même OU membre actif du même partenaire OU admin global
CREATE POLICY "ppm_select"
  ON public.pro_partner_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_global_association_admin()
    OR public.is_pro_partner_member(partner_id)
  );

-- INSERT : admin global OU owner/admin du partenaire
CREATE POLICY "ppm_insert"
  ON public.pro_partner_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_global_association_admin()
    OR public.has_pro_partner_role(partner_id, ARRAY['owner', 'admin'])
  );

-- UPDATE : admin global OU owner/admin du partenaire OU self-leave
CREATE POLICY "ppm_update"
  ON public.pro_partner_members
  FOR UPDATE
  TO authenticated
  USING (
    public.is_global_association_admin()
    OR public.has_pro_partner_role(partner_id, ARRAY['owner', 'admin'])
    OR user_id = auth.uid()
  )
  WITH CHECK (
    public.is_global_association_admin()
    OR public.has_pro_partner_role(partner_id, ARRAY['owner', 'admin'])
    OR (user_id = auth.uid() AND is_active = false)
  );

-- DELETE : admin global OU owner uniquement
CREATE POLICY "ppm_delete"
  ON public.pro_partner_members
  FOR DELETE
  TO authenticated
  USING (
    public.is_global_association_admin()
    OR public.has_pro_partner_role(partner_id, ARRAY['owner'])
  );


-- ============================================================
-- 10. RLS POLICIES — pro_partner_applications
-- ============================================================

ALTER TABLE public.pro_partner_applications ENABLE ROW LEVEL SECURITY;

-- SELECT : admin global voit tout, le soumetteur voit sa propre demande
CREATE POLICY "ppa_select"
  ON public.pro_partner_applications
  FOR SELECT
  TO authenticated
  USING (
    public.is_global_association_admin()
    OR submitted_by = auth.uid()
  );

-- INSERT : tout utilisateur authentifié peut soumettre une demande
CREATE POLICY "ppa_insert"
  ON public.pro_partner_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE : admin global uniquement (pour approuver/refuser)
CREATE POLICY "ppa_update"
  ON public.pro_partner_applications
  FOR UPDATE
  TO authenticated
  USING (
    public.is_global_association_admin()
  )
  WITH CHECK (
    public.is_global_association_admin()
  );

-- DELETE : superadmin uniquement
CREATE POLICY "ppa_delete"
  ON public.pro_partner_applications
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
-- 11. RLS POLICIES — events (complément pour pro_partner)
-- ============================================================

-- Les policies events existantes couvrent déjà :
--   - SELECT pour tous les authentifiés
--   - INSERT/UPDATE/DELETE pour admins globaux
-- On ajoute une policy permettant aux admin/owner d'un partenaire
-- de gérer les events liés à leur partenaire.

CREATE POLICY "events_insert_pro_partner"
  ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organizer_type = 'pro_partner'
    AND organizer_id IS NOT NULL
    AND public.has_pro_partner_role(organizer_id, ARRAY['owner', 'admin', 'manager'])
  );

CREATE POLICY "events_update_pro_partner"
  ON public.events
  FOR UPDATE
  TO authenticated
  USING (
    organizer_type = 'pro_partner'
    AND organizer_id IS NOT NULL
    AND public.has_pro_partner_role(organizer_id, ARRAY['owner', 'admin', 'manager'])
  )
  WITH CHECK (
    organizer_type = 'pro_partner'
    AND organizer_id IS NOT NULL
    AND public.has_pro_partner_role(organizer_id, ARRAY['owner', 'admin', 'manager'])
  );

CREATE POLICY "events_delete_pro_partner"
  ON public.events
  FOR DELETE
  TO authenticated
  USING (
    organizer_type = 'pro_partner'
    AND organizer_id IS NOT NULL
    AND public.has_pro_partner_role(organizer_id, ARRAY['owner', 'admin'])
  );


-- ============================================================
-- 12. VUE ADMIN enrichie
-- ============================================================

CREATE OR REPLACE VIEW public.pro_partner_members_view AS
SELECT
  ppm.id              AS membership_id,
  ppm.partner_id,
  ppm.user_id,
  ppm.role            AS partner_role,
  ppm.title           AS partner_title,
  ppm.joined_at,
  ppm.left_at,
  ppm.is_active,
  ppm.membership_status,
  ppm.notes,
  ppm.created_at      AS membership_created_at,
  p.username,
  p.display_name,
  p.avatar_url,
  p.city              AS user_city,
  p.role              AS platform_role,
  pp.name             AS partner_name,
  pp.slug             AS partner_slug,
  pp.type             AS partner_type,
  pp.status           AS partner_status,
  pp.is_public        AS partner_is_public
FROM public.pro_partner_members ppm
JOIN public.profiles p ON p.id = ppm.user_id
JOIN public.pro_partners pp ON pp.id = ppm.partner_id;


-- ============================================================
-- RÉCAPITULATIF
-- ============================================================

-- TABLES CRÉÉES :
--   pro_partners              : fiches structures (name, slug, type, status, coordonnées...)
--   pro_partner_members       : liaison users ↔ partenaires (role: owner/admin/manager/member)
--   pro_partner_applications  : demandes d'inscription (status: pending/approved/rejected)
--
-- COLONNES AJOUTÉES :
--   events.organizer_type     : 'manga_paradise' | 'association' | 'pro_partner'
--   events.organizer_id       : UUID de l'organisateur
--
-- FONCTIONS CRÉÉES :
--   is_pro_partner_member(uuid)        — membre actif du partenaire
--   has_pro_partner_role(uuid, text[])  — check rôle dans le partenaire
--   is_pro_partner_admin(uuid)          — admin partenaire OU admin global
--   sync_pro_partner_membership_status() — trigger sync status ↔ is_active
--
-- POLICIES RLS :
--   pro_partners :
--     pp_select   — is_public OR membre OR admin global OR draft owner
--     pp_insert   — admin global uniquement
--     pp_update   — admin global OR owner/admin partenaire
--     pp_delete   — superadmin uniquement
--
--   pro_partner_members :
--     ppm_select  — self OR membre même partenaire OR admin global
--     ppm_insert  — admin global OR owner/admin partenaire
--     ppm_update  — admin global OR owner/admin partenaire OR self-leave
--     ppm_delete  — admin global OR owner partenaire
--
--   pro_partner_applications :
--     ppa_select  — admin global OR soumetteur
--     ppa_insert  — tout authentifié
--     ppa_update  — admin global uniquement
--     ppa_delete  — superadmin uniquement
--
--   events (compléments) :
--     events_insert_pro_partner  — owner/admin/manager du partenaire
--     events_update_pro_partner  — owner/admin/manager du partenaire
--     events_delete_pro_partner  — owner/admin du partenaire
--
-- VUE :
--   pro_partner_members_view : jointure enrichie members + profiles + partners
--
-- INDEXES : 11 index créés pour performance
