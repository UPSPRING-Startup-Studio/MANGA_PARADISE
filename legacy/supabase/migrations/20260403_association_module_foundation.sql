-- ============================================================
-- MODULE ASSOCIATION – Migration fondation
-- ORDRE : 1) Enums  2) Tables + Index + Triggers  3) RLS Policies  4) Vue
-- ============================================================

-- ============================================================
-- PHASE 1 : ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE public.association_role AS ENUM (
    'president',
    'vice_president',
    'tresorier',
    'secretaire',
    'responsable',
    'benevole',
    'membre'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.association_invitation_status AS ENUM (
    'pending',
    'accepted',
    'rejected',
    'expired'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.association_document_status AS ENUM (
    'draft',
    'pending_review',
    'approved',
    'rejected',
    'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.association_contact_type AS ENUM (
    'partenaire',
    'fournisseur',
    'institution',
    'media',
    'sponsor',
    'intervenant',
    'autre'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- PHASE 2 : TABLES + INDEX + TRIGGERS (aucune policy ici)
-- ============================================================

-- Fonction shared pour updated_at
CREATE OR REPLACE FUNCTION public.handle_association_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------- associations ----------
CREATE TABLE IF NOT EXISTS public.associations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text UNIQUE NOT NULL,
  description   text,
  logo_url      text,
  banner_url    text,
  siret         text,
  rna_number    text,
  address       text,
  city          text,
  postal_code   text,
  region        text,
  email         text,
  phone         text,
  website_url   text,
  social_links  jsonb DEFAULT '{}',
  status        text NOT NULL DEFAULT 'active',
  founded_at    date,
  created_by    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_associations_slug ON public.associations(slug);
CREATE INDEX IF NOT EXISTS idx_associations_city ON public.associations(city);
CREATE INDEX IF NOT EXISTS idx_associations_status ON public.associations(status);

DROP TRIGGER IF EXISTS on_association_updated ON public.associations;
CREATE TRIGGER on_association_updated
  BEFORE UPDATE ON public.associations
  FOR EACH ROW EXECUTE FUNCTION public.handle_association_updated_at();

-- ---------- association_memberships ----------
CREATE TABLE IF NOT EXISTS public.association_memberships (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id  uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role            public.association_role NOT NULL DEFAULT 'membre',
  title           text,
  joined_at       timestamptz NOT NULL DEFAULT now(),
  left_at         timestamptz,
  is_active       boolean NOT NULL DEFAULT true,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(association_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_assoc_memberships_association ON public.association_memberships(association_id);
CREATE INDEX IF NOT EXISTS idx_assoc_memberships_user ON public.association_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_assoc_memberships_role ON public.association_memberships(role);
CREATE INDEX IF NOT EXISTS idx_assoc_memberships_active ON public.association_memberships(is_active);

DROP TRIGGER IF EXISTS on_assoc_membership_updated ON public.association_memberships;
CREATE TRIGGER on_assoc_membership_updated
  BEFORE UPDATE ON public.association_memberships
  FOR EACH ROW EXECUTE FUNCTION public.handle_association_updated_at();

-- ---------- association_invitations ----------
CREATE TABLE IF NOT EXISTS public.association_invitations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id  uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_by      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role            public.association_role NOT NULL DEFAULT 'membre',
  status          public.association_invitation_status NOT NULL DEFAULT 'pending',
  message         text,
  responded_at    timestamptz,
  expires_at      timestamptz DEFAULT (now() + interval '30 days'),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(association_id, user_id, status)
);

CREATE INDEX IF NOT EXISTS idx_assoc_invitations_association ON public.association_invitations(association_id);
CREATE INDEX IF NOT EXISTS idx_assoc_invitations_user ON public.association_invitations(user_id);
CREATE INDEX IF NOT EXISTS idx_assoc_invitations_status ON public.association_invitations(status);

-- ---------- association_contacts ----------
CREATE TABLE IF NOT EXISTS public.association_contacts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id  uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  organization    text,
  contact_type    public.association_contact_type NOT NULL DEFAULT 'autre',
  email           text,
  phone           text,
  address         text,
  city            text,
  website_url     text,
  social_links    jsonb DEFAULT '{}',
  notes           text,
  tags            text[] DEFAULT '{}',
  last_contacted  timestamptz,
  created_by      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assoc_contacts_association ON public.association_contacts(association_id);
CREATE INDEX IF NOT EXISTS idx_assoc_contacts_type ON public.association_contacts(contact_type);

DROP TRIGGER IF EXISTS on_assoc_contact_updated ON public.association_contacts;
CREATE TRIGGER on_assoc_contact_updated
  BEFORE UPDATE ON public.association_contacts
  FOR EACH ROW EXECUTE FUNCTION public.handle_association_updated_at();

-- ---------- association_documents ----------
CREATE TABLE IF NOT EXISTS public.association_documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id  uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text,
  category        text NOT NULL DEFAULT 'general',
  file_url        text,
  file_name       text,
  file_size       bigint,
  mime_type       text,
  status          public.association_document_status NOT NULL DEFAULT 'draft',
  submitted_by    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_by     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  submitted_at    timestamptz,
  reviewed_at     timestamptz,
  review_comment  text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assoc_documents_association ON public.association_documents(association_id);
CREATE INDEX IF NOT EXISTS idx_assoc_documents_status ON public.association_documents(status);
CREATE INDEX IF NOT EXISTS idx_assoc_documents_category ON public.association_documents(category);

DROP TRIGGER IF EXISTS on_assoc_document_updated ON public.association_documents;
CREATE TRIGGER on_assoc_document_updated
  BEFORE UPDATE ON public.association_documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_association_updated_at();

-- ---------- ALTER events : ajouter association_id ----------
DO $$ BEGIN
  ALTER TABLE public.events
    ADD COLUMN association_id uuid REFERENCES public.associations(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_events_association ON public.events(association_id);

-- ============================================================
-- PHASE 3 : RLS POLICIES (toutes les tables existent maintenant)
-- ============================================================

-- ---- associations ----
ALTER TABLE public.associations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Associations are viewable by authenticated users"
  ON public.associations FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "Associations are editable by creator or admin"
  ON public.associations FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (role = 'admin' OR role_function = 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM public.association_memberships
      WHERE association_id = associations.id
      AND user_id = auth.uid()
      AND role IN ('president', 'vice_president')
    )
  );

CREATE POLICY "Associations are insertable by admins"
  ON public.associations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (role = 'admin' OR role_function = 'admin')
    )
  );

-- ---- association_memberships ----
ALTER TABLE public.association_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Memberships viewable by association members"
  ON public.association_memberships FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.association_memberships am
      WHERE am.association_id = association_memberships.association_id
      AND am.user_id = auth.uid()
      AND am.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (role = 'admin' OR role_function = 'admin')
    )
  );

CREATE POLICY "Memberships editable by association leaders"
  ON public.association_memberships FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.association_memberships am
      WHERE am.association_id = association_memberships.association_id
      AND am.user_id = auth.uid()
      AND am.role IN ('president', 'vice_president', 'secretaire')
      AND am.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (role = 'admin' OR role_function = 'admin')
    )
  );

CREATE POLICY "Memberships insertable by association leaders"
  ON public.association_memberships FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.association_memberships am
      WHERE am.association_id = association_memberships.association_id
      AND am.user_id = auth.uid()
      AND am.role IN ('president', 'vice_president', 'secretaire')
      AND am.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (role = 'admin' OR role_function = 'admin')
    )
  );

CREATE POLICY "Memberships deletable by leaders or admin"
  ON public.association_memberships FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.association_memberships am
      WHERE am.association_id = association_memberships.association_id
      AND am.user_id = auth.uid()
      AND am.role IN ('president', 'vice_president')
      AND am.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (role = 'admin' OR role_function = 'admin')
    )
  );

-- ---- association_invitations ----
ALTER TABLE public.association_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invitations viewable by invitee or leaders"
  ON public.association_invitations FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR invited_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.association_memberships am
      WHERE am.association_id = association_invitations.association_id
      AND am.user_id = auth.uid()
      AND am.role IN ('president', 'vice_president', 'secretaire')
      AND am.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (role = 'admin' OR role_function = 'admin')
    )
  );

CREATE POLICY "Invitations insertable by leaders"
  ON public.association_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.association_memberships am
      WHERE am.association_id = association_invitations.association_id
      AND am.user_id = auth.uid()
      AND am.role IN ('president', 'vice_president', 'secretaire', 'responsable')
      AND am.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (role = 'admin' OR role_function = 'admin')
    )
  );

CREATE POLICY "Invitations updatable by invitee or leaders"
  ON public.association_invitations FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.association_memberships am
      WHERE am.association_id = association_invitations.association_id
      AND am.user_id = auth.uid()
      AND am.role IN ('president', 'vice_president', 'secretaire')
      AND am.is_active = true
    )
  );

-- ---- association_contacts ----
ALTER TABLE public.association_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contacts viewable by active members"
  ON public.association_contacts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.association_memberships am
      WHERE am.association_id = association_contacts.association_id
      AND am.user_id = auth.uid()
      AND am.is_active = true
    )
  );

CREATE POLICY "Contacts manageable by leaders"
  ON public.association_contacts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.association_memberships am
      WHERE am.association_id = association_contacts.association_id
      AND am.user_id = auth.uid()
      AND am.role IN ('president', 'vice_president', 'secretaire', 'tresorier', 'responsable')
      AND am.is_active = true
    )
  );

-- ---- association_documents ----
ALTER TABLE public.association_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Documents viewable by members (approved) or leaders (all)"
  ON public.association_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.association_memberships am
      WHERE am.association_id = association_documents.association_id
      AND am.user_id = auth.uid()
      AND am.role IN ('president', 'vice_president', 'secretaire', 'tresorier', 'responsable')
      AND am.is_active = true
    )
    OR (
      status = 'approved'
      AND EXISTS (
        SELECT 1 FROM public.association_memberships am
        WHERE am.association_id = association_documents.association_id
        AND am.user_id = auth.uid()
        AND am.is_active = true
      )
    )
  );

CREATE POLICY "Documents manageable by leaders"
  ON public.association_documents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.association_memberships am
      WHERE am.association_id = association_documents.association_id
      AND am.user_id = auth.uid()
      AND am.role IN ('president', 'vice_president', 'secretaire', 'tresorier', 'responsable')
      AND am.is_active = true
    )
  );

-- ============================================================
-- PHASE 4 : VUE
-- ============================================================
CREATE OR REPLACE VIEW public.association_members_view AS
SELECT
  am.id AS membership_id,
  am.association_id,
  am.user_id,
  am.role AS association_role,
  am.title AS association_title,
  am.joined_at,
  am.is_active,
  p.username,
  p.display_name,
  p.avatar_url,
  p.city AS user_city,
  a.name AS association_name,
  a.slug AS association_slug
FROM public.association_memberships am
JOIN public.profiles p ON p.id = am.user_id
JOIN public.associations a ON a.id = am.association_id;
