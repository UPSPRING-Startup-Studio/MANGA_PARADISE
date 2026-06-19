-- ============================================================
-- MODULE PRO PARTNERS — Création complète + Gouvernance
--
-- Date   : 2026-04-09
-- Objet  : Fichier autoportant fusionnant V1 (création tables)
--          et V2 (gouvernance, catégorisation, soft-delete).
--
-- CONTENU :
--   1. Table pro_partners (création + tous les champs V2)
--   2. Table pro_partner_members
--   3. Table pro_partner_applications
--   4. Colonnes events : organizer_type, organizer_id
--   5. Triggers updated_at + sync membership_status
--   6. Helpers SQL : is_pro_partner_member, has_pro_partner_role,
--      is_pro_partner_admin, is_pro_partner_writable,
--      is_pro_partner_restricted
--   7. RLS policies (toutes avec writable/restricted)
--   8. Vue admin enrichie
--
-- IDEMPOTENT : IF NOT EXISTS / DO $$ EXCEPTION $$ / DROP IF EXISTS
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

-- ── V2 : colonnes enrichissement ──
ALTER TABLE public.pro_partners ADD COLUMN IF NOT EXISTS deleted_at               timestamptz;
ALTER TABLE public.pro_partners ADD COLUMN IF NOT EXISTS deleted_by               uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.pro_partners ADD COLUMN IF NOT EXISTS deletion_reason          text;
ALTER TABLE public.pro_partners ADD COLUMN IF NOT EXISTS admin_status             text NOT NULL DEFAULT 'active';
ALTER TABLE public.pro_partners ADD COLUMN IF NOT EXISTS admin_status_reason      text;
ALTER TABLE public.pro_partners ADD COLUMN IF NOT EXISTS admin_status_changed_at  timestamptz;
ALTER TABLE public.pro_partners ADD COLUMN IF NOT EXISTS admin_status_changed_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.pro_partners ADD COLUMN IF NOT EXISTS admin_notes              text;
ALTER TABLE public.pro_partners ADD COLUMN IF NOT EXISTS directory_category       text;
ALTER TABLE public.pro_partners ADD COLUMN IF NOT EXISTS subcategories            text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.pro_partners ADD COLUMN IF NOT EXISTS member_benefit           text;
ALTER TABLE public.pro_partners ADD COLUMN IF NOT EXISTS is_featured              boolean NOT NULL DEFAULT false;
ALTER TABLE public.pro_partners ADD COLUMN IF NOT EXISTS source_import            text;

-- Contraintes
DO $$ BEGIN
  ALTER TABLE public.pro_partners
    ADD CONSTRAINT chk_pro_partners_status
    CHECK (status IN ('draft', 'active', 'suspended', 'archived'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.pro_partners
    ADD CONSTRAINT chk_pro_partners_type
    CHECK (type IN (
      'societe', 'association', 'auto_entrepreneur',
      'institution', 'collectivite', 'boutique',
      'lieu_culturel', 'media', 'autre'
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.pro_partners
    ADD CONSTRAINT chk_pro_partners_admin_status
    CHECK (admin_status IN ('active', 'restricted', 'blocked'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.pro_partners
    ADD CONSTRAINT chk_pro_partners_directory_category
    CHECK (directory_category IS NULL OR directory_category IN (
      'acteurs_publics', 'boutiques_librairies', 'cinemas',
      'restauration', 'partenaires_associatifs', 'artistes_createurs',
      'evenements_lieux_culturels', 'entreprises_marques'
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Index
CREATE INDEX IF NOT EXISTS idx_pro_partners_slug ON public.pro_partners(slug);
CREATE INDEX IF NOT EXISTS idx_pro_partners_status ON public.pro_partners(status);
CREATE INDEX IF NOT EXISTS idx_pro_partners_type ON public.pro_partners(type);
CREATE INDEX IF NOT EXISTS idx_pro_partners_city ON public.pro_partners(city);
CREATE INDEX IF NOT EXISTS idx_pro_partners_is_public ON public.pro_partners(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_pro_partners_created_by ON public.pro_partners(created_by);
CREATE INDEX IF NOT EXISTS idx_pro_partners_deleted ON public.pro_partners(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pro_partners_admin_status ON public.pro_partners(admin_status);
CREATE INDEX IF NOT EXISTS idx_pro_partners_directory_category ON public.pro_partners(directory_category) WHERE directory_category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pro_partners_subcategories ON public.pro_partners USING GIN(subcategories);
CREATE INDEX IF NOT EXISTS idx_pro_partners_featured ON public.pro_partners(is_featured) WHERE is_featured = true;

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
  company_name      text NOT NULL,
  company_type      text NOT NULL DEFAULT 'societe',
  siret             text,
  description       text,
  contact_first_name text NOT NULL,
  contact_last_name  text NOT NULL,
  contact_email      text NOT NULL,
  contact_phone      text,
  website_url        text,
  social_links       jsonb DEFAULT '{}'::jsonb,
  message           text,
  status            text NOT NULL DEFAULT 'pending',
  reviewed_by       uuid REFERENCES public.profiles(id),
  reviewed_at       timestamptz,
  rejection_reason  text,
  partner_id        uuid REFERENCES public.pro_partners(id),
  submitted_by      uuid REFERENCES public.profiles(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

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

CREATE INDEX IF NOT EXISTS idx_pro_partner_apps_status ON public.pro_partner_applications(status);
CREATE INDEX IF NOT EXISTS idx_pro_partner_apps_email ON public.pro_partner_applications(contact_email);
CREATE INDEX IF NOT EXISTS idx_pro_partner_apps_created ON public.pro_partner_applications(created_at DESC);

COMMENT ON TABLE public.pro_partner_applications IS
  'Demandes d''inscription "Devenir partenaire" en attente de validation admin.';


-- ============================================================
-- 4. EVENTS : ajout organizer_type / organizer_id
-- ============================================================

DO $$ BEGIN
  ALTER TABLE public.events
    ADD COLUMN organizer_type text NOT NULL DEFAULT 'manga_paradise';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.events
    ADD CONSTRAINT chk_events_organizer_type
    CHECK (organizer_type IN ('manga_paradise', 'association', 'pro_partner'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.events
    ADD COLUMN organizer_id uuid;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- organizer_id est polymorphe (peut pointer vers profiles, associations
-- ou pro_partners). Si une FK vers profiles existe (vestige d'un ancien
-- système), on la supprime car elle bloque le backfill.
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_organizer_id_fkey;

CREATE INDEX IF NOT EXISTS idx_events_organizer ON public.events(organizer_type, organizer_id);

-- Backfill : si association_id est renseigné, on met organizer_type = 'association'
UPDATE public.events
SET organizer_type = 'association',
    organizer_id = association_id
WHERE association_id IS NOT NULL
  AND organizer_type = 'manga_paradise';


-- ============================================================
-- 5. TRIGGERS
-- ============================================================

-- updated_at (réutilisation du même handler que les associations)
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

-- Sync membership_status ↔ is_active
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
-- 6. HELPERS SQL — SECURITY DEFINER
-- ============================================================

-- 6a. is_pro_partner_member(uuid)
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

-- 6b. has_pro_partner_role(uuid, text[])
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

-- 6c. is_pro_partner_admin(uuid)
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

-- 6d. is_pro_partner_writable(uuid)
CREATE OR REPLACE FUNCTION public.is_pro_partner_writable(p_partner_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pro_partners
    WHERE id = p_partner_id
      AND admin_status != 'blocked'
      AND deleted_at IS NULL
  );
$$;

COMMENT ON FUNCTION public.is_pro_partner_writable(uuid) IS
  'Retourne true si le partenaire n''est ni bloqué ni supprimé.';

-- 6e. is_pro_partner_restricted(uuid)
CREATE OR REPLACE FUNCTION public.is_pro_partner_restricted(p_partner_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pro_partners
    WHERE id = p_partner_id
      AND admin_status = 'restricted'
  );
$$;

COMMENT ON FUNCTION public.is_pro_partner_restricted(uuid) IS
  'Retourne true si le partenaire est sous restriction administrative.';


-- ============================================================
-- 7. RLS POLICIES — pro_partners
-- ============================================================

ALTER TABLE public.pro_partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pp_select" ON public.pro_partners;
CREATE POLICY "pp_select"
  ON public.pro_partners
  FOR SELECT
  TO authenticated
  USING (
    public.is_global_association_admin()
    OR (
      deleted_at IS NULL
      AND (
        is_public = true
        OR public.is_pro_partner_member(id)
        OR (status = 'draft' AND created_by = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "pp_insert" ON public.pro_partners;
CREATE POLICY "pp_insert"
  ON public.pro_partners
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_global_association_admin()
  );

DROP POLICY IF EXISTS "pp_update" ON public.pro_partners;
CREATE POLICY "pp_update"
  ON public.pro_partners
  FOR UPDATE
  TO authenticated
  USING (
    public.is_global_association_admin()
    OR (
      public.has_pro_partner_role(id, ARRAY['owner', 'admin'])
      AND public.is_pro_partner_writable(id)
    )
  )
  WITH CHECK (
    public.is_global_association_admin()
    OR (
      public.has_pro_partner_role(id, ARRAY['owner', 'admin'])
      AND public.is_pro_partner_writable(id)
    )
  );

DROP POLICY IF EXISTS "pp_delete" ON public.pro_partners;
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
-- 8. RLS POLICIES — pro_partner_members
-- ============================================================

ALTER TABLE public.pro_partner_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ppm_select" ON public.pro_partner_members;
CREATE POLICY "ppm_select"
  ON public.pro_partner_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_global_association_admin()
    OR public.is_pro_partner_member(partner_id)
  );

DROP POLICY IF EXISTS "ppm_insert" ON public.pro_partner_members;
CREATE POLICY "ppm_insert"
  ON public.pro_partner_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_global_association_admin()
    OR (
      public.has_pro_partner_role(partner_id, ARRAY['owner', 'admin'])
      AND public.is_pro_partner_writable(partner_id)
      AND NOT public.is_pro_partner_restricted(partner_id)
    )
  );

DROP POLICY IF EXISTS "ppm_update" ON public.pro_partner_members;
CREATE POLICY "ppm_update"
  ON public.pro_partner_members
  FOR UPDATE
  TO authenticated
  USING (
    public.is_global_association_admin()
    OR (
      public.has_pro_partner_role(partner_id, ARRAY['owner', 'admin'])
      AND public.is_pro_partner_writable(partner_id)
    )
    OR (
      user_id = auth.uid()
      AND public.is_pro_partner_writable(partner_id)
    )
  )
  WITH CHECK (
    public.is_global_association_admin()
    OR (
      public.has_pro_partner_role(partner_id, ARRAY['owner', 'admin'])
      AND public.is_pro_partner_writable(partner_id)
    )
    OR (
      user_id = auth.uid()
      AND is_active = false
      AND public.is_pro_partner_writable(partner_id)
    )
  );

DROP POLICY IF EXISTS "ppm_delete" ON public.pro_partner_members;
CREATE POLICY "ppm_delete"
  ON public.pro_partner_members
  FOR DELETE
  TO authenticated
  USING (
    public.is_global_association_admin()
    OR (
      public.has_pro_partner_role(partner_id, ARRAY['owner'])
      AND public.is_pro_partner_writable(partner_id)
    )
  );


-- ============================================================
-- 9. RLS POLICIES — pro_partner_applications
-- ============================================================

ALTER TABLE public.pro_partner_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ppa_select" ON public.pro_partner_applications;
CREATE POLICY "ppa_select"
  ON public.pro_partner_applications
  FOR SELECT
  TO authenticated
  USING (
    public.is_global_association_admin()
    OR submitted_by = auth.uid()
  );

DROP POLICY IF EXISTS "ppa_insert" ON public.pro_partner_applications;
CREATE POLICY "ppa_insert"
  ON public.pro_partner_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "ppa_update" ON public.pro_partner_applications;
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

DROP POLICY IF EXISTS "ppa_delete" ON public.pro_partner_applications;
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
-- 10. RLS POLICIES — events (complément pro_partner)
-- ============================================================

DROP POLICY IF EXISTS "events_insert_pro_partner" ON public.events;
CREATE POLICY "events_insert_pro_partner"
  ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organizer_type = 'pro_partner'
    AND organizer_id IS NOT NULL
    AND (
      public.is_global_association_admin()
      OR (
        public.has_pro_partner_role(organizer_id, ARRAY['owner', 'admin', 'manager'])
        AND public.is_pro_partner_writable(organizer_id)
        AND NOT public.is_pro_partner_restricted(organizer_id)
      )
    )
  );

DROP POLICY IF EXISTS "events_update_pro_partner" ON public.events;
CREATE POLICY "events_update_pro_partner"
  ON public.events
  FOR UPDATE
  TO authenticated
  USING (
    organizer_type = 'pro_partner'
    AND organizer_id IS NOT NULL
    AND (
      public.is_global_association_admin()
      OR (
        public.has_pro_partner_role(organizer_id, ARRAY['owner', 'admin', 'manager'])
        AND public.is_pro_partner_writable(organizer_id)
        AND NOT public.is_pro_partner_restricted(organizer_id)
      )
    )
  )
  WITH CHECK (
    organizer_type = 'pro_partner'
    AND organizer_id IS NOT NULL
    AND (
      public.is_global_association_admin()
      OR (
        public.has_pro_partner_role(organizer_id, ARRAY['owner', 'admin', 'manager'])
        AND public.is_pro_partner_writable(organizer_id)
        AND NOT public.is_pro_partner_restricted(organizer_id)
      )
    )
  );

DROP POLICY IF EXISTS "events_delete_pro_partner" ON public.events;
CREATE POLICY "events_delete_pro_partner"
  ON public.events
  FOR DELETE
  TO authenticated
  USING (
    organizer_type = 'pro_partner'
    AND organizer_id IS NOT NULL
    AND (
      public.is_global_association_admin()
      OR (
        public.has_pro_partner_role(organizer_id, ARRAY['owner', 'admin'])
        AND public.is_pro_partner_writable(organizer_id)
      )
    )
  );


-- ============================================================
-- 11. VUE ADMIN enrichie
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
  pp.directory_category AS partner_directory_category,
  pp.status           AS partner_status,
  pp.admin_status     AS partner_admin_status,
  pp.is_public        AS partner_is_public,
  pp.deleted_at       AS partner_deleted_at
FROM public.pro_partner_members ppm
JOIN public.profiles p ON p.id = ppm.user_id
JOIN public.pro_partners pp ON pp.id = ppm.partner_id;


-- ============================================================
-- RÉCAPITULATIF
-- ============================================================
--
-- TABLES CRÉÉES :
--   pro_partners              : fiches structures (V1 + V2 enrichi)
--   pro_partner_members       : liaison users ↔ partenaires
--   pro_partner_applications  : demandes d'inscription
--
-- COLONNES AJOUTÉES (events) :
--   organizer_type, organizer_id
--
-- FONCTIONS CRÉÉES :
--   is_pro_partner_member(uuid)
--   has_pro_partner_role(uuid, text[])
--   is_pro_partner_admin(uuid)
--   is_pro_partner_writable(uuid)    → !blocked AND !deleted
--   is_pro_partner_restricted(uuid)  → restricted
--   sync_pro_partner_membership_status()
--
-- POLICIES RLS : 15 policies (toutes avec writable/restricted)
-- VUE : pro_partner_members_view (enrichie V2)
-- INDEX : 16 index
