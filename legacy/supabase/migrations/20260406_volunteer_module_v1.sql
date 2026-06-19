-- ============================================================
-- MODULE BÉNÉVOLAT V1 — Volontariat & Missions
--
-- CONTEXTE :
--   Le module association V5 a enrichi association_memberships
--   avec engagement_level, interests, skills, availability, etc.
--   Ce module V1 Bénévolat ajoute les tables dédiées pour :
--     - Candidatures bénévoles
--     - Missions & créneaux
--     - Affectations & check-in
--     - Documents bénévoles
--     - Communications
--     - Historique d'activité
--
-- PHILOSOPHIE :
--   association_memberships = appartenance à l'association
--   volunteer_* = activité bénévole spécialisée
--   Liaison via membership_id ou user_id + association_id
--
-- IDEMPOTENT / SAFE
-- ============================================================


-- ============================================================
-- 0. ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE public.volunteer_application_status AS ENUM (
    'invited', 'started', 'incomplete', 'pending_review',
    'approved', 'rejected', 'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.volunteer_application_source AS ENUM (
    'self', 'invitation', 'external', 'promotion'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.volunteer_involvement_status AS ENUM (
    'occasional', 'active', 'staff_event', 'zone_leader',
    'coordinator', 'alumni'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.volunteer_availability_status AS ENUM (
    'available', 'conditional', 'unavailable', 'to_confirm'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.mission_status AS ENUM (
    'draft', 'open', 'in_progress', 'complete', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.mission_priority AS ENUM (
    'low', 'medium', 'high', 'critical'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.shift_status AS ENUM (
    'open', 'full', 'in_progress', 'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.assignment_status AS ENUM (
    'proposed', 'confirmed', 'checked_in', 'absent',
    'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.volunteer_document_type AS ENUM (
    'charter', 'image_rights', 'authorization', 'id_copy',
    'medical', 'insurance', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.volunteer_document_status AS ENUM (
    'pending', 'approved', 'rejected', 'expired'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.volunteer_message_type AS ENUM (
    'welcome', 'reminder', 'assignment', 'document_request',
    'shift_reminder', 'thanks', 'custom', 'broadcast'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================
-- 1. VOLUNTEER_APPLICATIONS — Candidatures bénévoles
-- ============================================================

CREATE TABLE IF NOT EXISTS public.volunteer_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Source & status
  source public.volunteer_application_source NOT NULL DEFAULT 'self',
  status public.volunteer_application_status NOT NULL DEFAULT 'started',

  -- Applicant info (for external applicants without user_id)
  first_name text,
  last_name text,
  email text,
  phone text,
  city text,

  -- Profile data (stored at application time)
  interests text[] NOT NULL DEFAULT '{}',
  skills text[] NOT NULL DEFAULT '{}',
  participation_preferences text[] NOT NULL DEFAULT '{}',
  availability jsonb NOT NULL DEFAULT '{}',
  experience_level text NOT NULL DEFAULT 'debutant',
  languages text[] NOT NULL DEFAULT '{"francais"}',
  consent_photo boolean NOT NULL DEFAULT false,
  motivation text,

  -- Onboarding tracking
  onboarding_step integer NOT NULL DEFAULT 1,
  onboarding_data jsonb NOT NULL DEFAULT '{}',

  -- Review
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_notes text,
  rejection_reason text,

  -- Invitation link
  invited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  invitation_message text,
  token text UNIQUE,
  token_expires_at timestamptz,

  -- Timestamps
  submitted_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vol_apps_association ON public.volunteer_applications(association_id);
CREATE INDEX IF NOT EXISTS idx_vol_apps_user ON public.volunteer_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_vol_apps_event ON public.volunteer_applications(event_id);
CREATE INDEX IF NOT EXISTS idx_vol_apps_status ON public.volunteer_applications(status);
CREATE INDEX IF NOT EXISTS idx_vol_apps_source ON public.volunteer_applications(source);
CREATE INDEX IF NOT EXISTS idx_vol_apps_assoc_status ON public.volunteer_applications(association_id, status);
CREATE INDEX IF NOT EXISTS idx_vol_apps_token ON public.volunteer_applications(token) WHERE token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vol_apps_created ON public.volunteer_applications(created_at DESC);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_vol_apps_updated ON public.volunteer_applications;
CREATE TRIGGER trg_vol_apps_updated
  BEFORE UPDATE ON public.volunteer_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_association_updated_at();


-- ============================================================
-- 2. VOLUNTEER_MISSIONS — Missions bénévoles
-- ============================================================

CREATE TABLE IF NOT EXISTS public.volunteer_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,

  -- Description
  title text NOT NULL,
  description text,
  zone text,
  pole text,

  -- Requirements
  required_skills text[] NOT NULL DEFAULT '{}',
  required_experience text NOT NULL DEFAULT 'debutant',
  required_interests text[] NOT NULL DEFAULT '{}',

  -- Capacity
  slots_needed integer NOT NULL DEFAULT 1,
  slots_filled integer NOT NULL DEFAULT 0,

  -- Schedule
  start_at timestamptz,
  end_at timestamptz,

  -- Meta
  priority public.mission_priority NOT NULL DEFAULT 'medium',
  status public.mission_status NOT NULL DEFAULT 'draft',
  responsible_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes text,
  tags text[] NOT NULL DEFAULT '{}',

  -- Creator
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vol_missions_association ON public.volunteer_missions(association_id);
CREATE INDEX IF NOT EXISTS idx_vol_missions_event ON public.volunteer_missions(event_id);
CREATE INDEX IF NOT EXISTS idx_vol_missions_status ON public.volunteer_missions(status);
CREATE INDEX IF NOT EXISTS idx_vol_missions_priority ON public.volunteer_missions(priority);
CREATE INDEX IF NOT EXISTS idx_vol_missions_responsible ON public.volunteer_missions(responsible_id);
CREATE INDEX IF NOT EXISTS idx_vol_missions_assoc_status ON public.volunteer_missions(association_id, status);
CREATE INDEX IF NOT EXISTS idx_vol_missions_event_status ON public.volunteer_missions(event_id, status);
CREATE INDEX IF NOT EXISTS idx_vol_missions_start ON public.volunteer_missions(start_at);
CREATE INDEX IF NOT EXISTS idx_vol_missions_skills ON public.volunteer_missions USING gin(required_skills);

DROP TRIGGER IF EXISTS trg_vol_missions_updated ON public.volunteer_missions;
CREATE TRIGGER trg_vol_missions_updated
  BEFORE UPDATE ON public.volunteer_missions
  FOR EACH ROW EXECUTE FUNCTION public.handle_association_updated_at();


-- ============================================================
-- 3. VOLUNTEER_SHIFTS — Créneaux / shifts
-- ============================================================

CREATE TABLE IF NOT EXISTS public.volunteer_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.volunteer_missions(id) ON DELETE CASCADE,

  title text,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  slots_needed integer NOT NULL DEFAULT 1,
  slots_filled integer NOT NULL DEFAULT 0,
  location text,
  notes text,
  status public.shift_status NOT NULL DEFAULT 'open',

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vol_shifts_mission ON public.volunteer_shifts(mission_id);
CREATE INDEX IF NOT EXISTS idx_vol_shifts_status ON public.volunteer_shifts(status);
CREATE INDEX IF NOT EXISTS idx_vol_shifts_start ON public.volunteer_shifts(start_at);
CREATE INDEX IF NOT EXISTS idx_vol_shifts_mission_start ON public.volunteer_shifts(mission_id, start_at);


-- ============================================================
-- 4. VOLUNTEER_ASSIGNMENTS — Affectations
-- ============================================================

CREATE TABLE IF NOT EXISTS public.volunteer_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mission_id uuid NOT NULL REFERENCES public.volunteer_missions(id) ON DELETE CASCADE,
  shift_id uuid REFERENCES public.volunteer_shifts(id) ON DELETE SET NULL,

  status public.assignment_status NOT NULL DEFAULT 'proposed',

  proposed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  proposed_at timestamptz DEFAULT now(),
  confirmed_at timestamptz,
  checked_in_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,

  notes text,
  rating integer CHECK (rating BETWEEN 1 AND 5),
  feedback text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique index fonctionnel : un bénévole ne peut être affecté qu'une fois par mission+shift
CREATE UNIQUE INDEX IF NOT EXISTS uq_assignment_user_mission_shift
  ON public.volunteer_assignments (user_id, mission_id, COALESCE(shift_id, '00000000-0000-0000-0000-000000000000'::uuid));

CREATE INDEX IF NOT EXISTS idx_vol_assign_association ON public.volunteer_assignments(association_id);
CREATE INDEX IF NOT EXISTS idx_vol_assign_user ON public.volunteer_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_vol_assign_mission ON public.volunteer_assignments(mission_id);
CREATE INDEX IF NOT EXISTS idx_vol_assign_shift ON public.volunteer_assignments(shift_id);
CREATE INDEX IF NOT EXISTS idx_vol_assign_status ON public.volunteer_assignments(status);
CREATE INDEX IF NOT EXISTS idx_vol_assign_user_status ON public.volunteer_assignments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_vol_assign_mission_status ON public.volunteer_assignments(mission_id, status);

DROP TRIGGER IF EXISTS trg_vol_assign_updated ON public.volunteer_assignments;
CREATE TRIGGER trg_vol_assign_updated
  BEFORE UPDATE ON public.volunteer_assignments
  FOR EACH ROW EXECUTE FUNCTION public.handle_association_updated_at();


-- ============================================================
-- 5. VOLUNTEER_DOCUMENTS — Documents bénévoles
-- ============================================================

CREATE TABLE IF NOT EXISTS public.volunteer_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  doc_type public.volunteer_document_type NOT NULL DEFAULT 'other',
  title text NOT NULL,
  description text,
  file_url text,
  file_name text,
  file_size bigint,
  mime_type text,

  status public.volunteer_document_status NOT NULL DEFAULT 'pending',
  expires_at timestamptz,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_notes text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vol_docs_association ON public.volunteer_documents(association_id);
CREATE INDEX IF NOT EXISTS idx_vol_docs_user ON public.volunteer_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_vol_docs_status ON public.volunteer_documents(status);
CREATE INDEX IF NOT EXISTS idx_vol_docs_type ON public.volunteer_documents(doc_type);

DROP TRIGGER IF EXISTS trg_vol_docs_updated ON public.volunteer_documents;
CREATE TRIGGER trg_vol_docs_updated
  BEFORE UPDATE ON public.volunteer_documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_association_updated_at();


-- ============================================================
-- 6. VOLUNTEER_MESSAGES — Communications
-- ============================================================

CREATE TABLE IF NOT EXISTS public.volunteer_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,

  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  mission_id uuid REFERENCES public.volunteer_missions(id) ON DELETE SET NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,

  msg_type public.volunteer_message_type NOT NULL DEFAULT 'custom',
  subject text,
  body text NOT NULL,
  is_broadcast boolean NOT NULL DEFAULT false,

  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vol_msgs_association ON public.volunteer_messages(association_id);
CREATE INDEX IF NOT EXISTS idx_vol_msgs_sender ON public.volunteer_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_vol_msgs_recipient ON public.volunteer_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_vol_msgs_mission ON public.volunteer_messages(mission_id);
CREATE INDEX IF NOT EXISTS idx_vol_msgs_type ON public.volunteer_messages(msg_type);
CREATE INDEX IF NOT EXISTS idx_vol_msgs_unread ON public.volunteer_messages(recipient_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_vol_msgs_created ON public.volunteer_messages(created_at DESC);


-- ============================================================
-- 7. VOLUNTEER_ACTIVITY_LOG — Historique d'activité
-- ============================================================

CREATE TABLE IF NOT EXISTS public.volunteer_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  event_type text NOT NULL,
  -- event_type values: application_submitted, application_approved, application_rejected,
  -- assignment_proposed, assignment_confirmed, checked_in, mission_completed,
  -- badge_earned, document_uploaded, profile_updated, shift_completed

  entity_type text,    -- 'application', 'mission', 'assignment', 'shift', 'document'
  entity_id uuid,      -- FK to the relevant entity
  metadata jsonb NOT NULL DEFAULT '{}',
  points integer NOT NULL DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vol_log_association ON public.volunteer_activity_log(association_id);
CREATE INDEX IF NOT EXISTS idx_vol_log_user ON public.volunteer_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_vol_log_event_type ON public.volunteer_activity_log(event_type);
CREATE INDEX IF NOT EXISTS idx_vol_log_user_created ON public.volunteer_activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vol_log_entity ON public.volunteer_activity_log(entity_type, entity_id);


-- ============================================================
-- 8. ASSOCIATION_MEMBERSHIPS — Colonnes supplémentaires volontariat
-- ============================================================

-- Statut d'implication bénévole (plus granulaire que engagement_level)
DO $$ BEGIN
  ALTER TABLE public.association_memberships
    ADD COLUMN involvement_status text NOT NULL DEFAULT 'occasional';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.association_memberships
    ADD CONSTRAINT chk_involvement_status
    CHECK (involvement_status IN (
      'occasional', 'active', 'staff_event', 'zone_leader', 'coordinator', 'alumni'
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Statut de disponibilité courant
DO $$ BEGIN
  ALTER TABLE public.association_memberships
    ADD COLUMN availability_status text NOT NULL DEFAULT 'available';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.association_memberships
    ADD CONSTRAINT chk_availability_status
    CHECK (availability_status IN (
      'available', 'conditional', 'unavailable', 'to_confirm'
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Onboarding tracking
DO $$ BEGIN
  ALTER TABLE public.association_memberships
    ADD COLUMN onboarding_step integer NOT NULL DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.association_memberships
    ADD COLUMN onboarding_completed_at timestamptz;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Activity stats (denormalized for dashboard perf)
DO $$ BEGIN
  ALTER TABLE public.association_memberships
    ADD COLUMN total_missions_completed integer NOT NULL DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.association_memberships
    ADD COLUMN total_hours_volunteered numeric(8,2) NOT NULL DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.association_memberships
    ADD COLUMN reliability_score numeric(5,2) NOT NULL DEFAULT 100;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.association_memberships
    ADD COLUMN last_mission_at timestamptz;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_assoc_memberships_involvement
  ON public.association_memberships(involvement_status);
CREATE INDEX IF NOT EXISTS idx_assoc_memberships_avail_status
  ON public.association_memberships(availability_status);
CREATE INDEX IF NOT EXISTS idx_assoc_memberships_reliability
  ON public.association_memberships(association_id, reliability_score DESC);


-- ============================================================
-- 9. FUNCTIONS — Helpers & computed
-- ============================================================

-- Update slots_filled on volunteer_missions when assignments change
CREATE OR REPLACE FUNCTION public.update_mission_slots()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update mission slots_filled
  UPDATE public.volunteer_missions
  SET slots_filled = (
    SELECT COUNT(*) FROM public.volunteer_assignments
    WHERE mission_id = COALESCE(NEW.mission_id, OLD.mission_id)
      AND status IN ('confirmed', 'checked_in', 'completed')
  )
  WHERE id = COALESCE(NEW.mission_id, OLD.mission_id);

  -- Update shift slots_filled if shift assigned
  IF COALESCE(NEW.shift_id, OLD.shift_id) IS NOT NULL THEN
    UPDATE public.volunteer_shifts
    SET slots_filled = (
      SELECT COUNT(*) FROM public.volunteer_assignments
      WHERE shift_id = COALESCE(NEW.shift_id, OLD.shift_id)
        AND status IN ('confirmed', 'checked_in', 'completed')
    ),
    status = CASE
      WHEN (SELECT COUNT(*) FROM public.volunteer_assignments
            WHERE shift_id = COALESCE(NEW.shift_id, OLD.shift_id)
              AND status IN ('confirmed', 'checked_in', 'completed'))
           >= (SELECT slots_needed FROM public.volunteer_shifts WHERE id = COALESCE(NEW.shift_id, OLD.shift_id))
      THEN 'full'::public.shift_status
      ELSE 'open'::public.shift_status
    END
    WHERE id = COALESCE(NEW.shift_id, OLD.shift_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_update_mission_slots ON public.volunteer_assignments;
CREATE TRIGGER trg_update_mission_slots
  AFTER INSERT OR UPDATE OR DELETE ON public.volunteer_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_mission_slots();

-- Update membership stats when assignment completes
CREATE OR REPLACE FUNCTION public.update_volunteer_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hours numeric;
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.status = 'completed'
     AND OLD.status != 'completed'
  THEN
    -- Calculate hours from mission or shift
    v_hours := COALESCE(
      (SELECT EXTRACT(EPOCH FROM (
        COALESCE(s.end_at, m.end_at) - COALESCE(s.start_at, m.start_at)
      )) / 3600.0
       FROM public.volunteer_missions m
       LEFT JOIN public.volunteer_shifts s ON s.id = NEW.shift_id
       WHERE m.id = NEW.mission_id),
      0
    );

    UPDATE public.association_memberships
    SET total_missions_completed = total_missions_completed + 1,
        total_hours_volunteered = total_hours_volunteered + GREATEST(v_hours, 0),
        last_mission_at = NOW()
    WHERE association_id = NEW.association_id
      AND user_id = NEW.user_id
      AND is_active = true;

    -- Log activity
    INSERT INTO public.volunteer_activity_log (
      association_id, user_id, event_type, entity_type, entity_id,
      metadata, points
    ) VALUES (
      NEW.association_id, NEW.user_id, 'mission_completed', 'assignment', NEW.id,
      jsonb_build_object('mission_id', NEW.mission_id, 'hours', v_hours),
      GREATEST(FLOOR(v_hours)::integer, 1)
    );
  END IF;

  -- Track absences for reliability
  IF TG_OP = 'UPDATE'
     AND NEW.status = 'absent'
     AND OLD.status IN ('confirmed', 'checked_in')
  THEN
    UPDATE public.association_memberships
    SET reliability_score = GREATEST(reliability_score - 5, 0)
    WHERE association_id = NEW.association_id
      AND user_id = NEW.user_id
      AND is_active = true;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_volunteer_stats ON public.volunteer_assignments;
CREATE TRIGGER trg_update_volunteer_stats
  AFTER UPDATE ON public.volunteer_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_volunteer_stats();

-- Auto-create membership when application approved
CREATE OR REPLACE FUNCTION public.on_volunteer_application_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.status = 'approved'
     AND OLD.status != 'approved'
     AND NEW.user_id IS NOT NULL
  THEN
    -- Create or update membership
    INSERT INTO public.association_memberships (
      association_id, user_id, role, engagement_level, belonging_status,
      interests, skills, participation_preferences, availability,
      volunteer_experience, languages, consent_photo,
      involvement_status, onboarding_completed_at,
      is_active, membership_status
    ) VALUES (
      NEW.association_id, NEW.user_id, 'benevole', 'benevole_actif', 'valide',
      NEW.interests, NEW.skills, NEW.participation_preferences, NEW.availability,
      NEW.experience_level, NEW.languages, NEW.consent_photo,
      'active', NOW(),
      true, 'active'
    )
    ON CONFLICT (association_id, user_id) DO UPDATE SET
      engagement_level = CASE
        WHEN EXCLUDED.engagement_level IN ('benevole_actif', 'staff', 'bureau')
        THEN association_memberships.engagement_level
        ELSE 'benevole_actif'
      END,
      belonging_status = 'valide',
      interests = EXCLUDED.interests,
      skills = EXCLUDED.skills,
      participation_preferences = EXCLUDED.participation_preferences,
      availability = EXCLUDED.availability,
      volunteer_experience = EXCLUDED.experience_level,
      languages = EXCLUDED.languages,
      consent_photo = EXCLUDED.consent_photo,
      involvement_status = 'active',
      is_active = true,
      membership_status = 'active',
      updated_at = NOW();

    -- Log
    INSERT INTO public.volunteer_activity_log (
      association_id, user_id, event_type, entity_type, entity_id,
      metadata, points
    ) VALUES (
      NEW.association_id, NEW.user_id, 'application_approved', 'application', NEW.id,
      jsonb_build_object('source', NEW.source::text),
      10
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vol_app_approved ON public.volunteer_applications;
CREATE TRIGGER trg_vol_app_approved
  AFTER UPDATE ON public.volunteer_applications
  FOR EACH ROW EXECUTE FUNCTION public.on_volunteer_application_approved();


-- ============================================================
-- 10. RLS POLICIES
-- ============================================================

-- ── volunteer_applications ──
ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vol_apps_select" ON public.volunteer_applications
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR public.is_global_association_admin()
    OR public.is_association_admin(association_id)
  );

CREATE POLICY "vol_apps_insert" ON public.volunteer_applications
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
    OR public.is_global_association_admin()
    OR public.is_association_admin(association_id)
  );

CREATE POLICY "vol_apps_update" ON public.volunteer_applications
  FOR UPDATE TO authenticated USING (
    (user_id = auth.uid() AND status IN ('started', 'incomplete'))
    OR public.is_global_association_admin()
    OR public.is_association_admin(association_id)
  );

-- Allow anonymous applications via token
CREATE POLICY "vol_apps_insert_anon" ON public.volunteer_applications
  FOR INSERT TO anon WITH CHECK (source = 'external');

-- ── volunteer_missions ──
ALTER TABLE public.volunteer_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vol_missions_select" ON public.volunteer_missions
  FOR SELECT TO authenticated USING (
    public.is_association_member(association_id)
    OR public.is_global_association_admin()
  );

CREATE POLICY "vol_missions_manage" ON public.volunteer_missions
  FOR ALL TO authenticated USING (
    public.is_global_association_admin()
    OR public.is_association_admin(association_id)
    OR responsible_id = auth.uid()
  ) WITH CHECK (
    public.is_global_association_admin()
    OR public.is_association_admin(association_id)
  );

-- ── volunteer_shifts ──
ALTER TABLE public.volunteer_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vol_shifts_select" ON public.volunteer_shifts
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.volunteer_missions m
      WHERE m.id = mission_id
        AND (public.is_association_member(m.association_id)
             OR public.is_global_association_admin())
    )
  );

CREATE POLICY "vol_shifts_manage" ON public.volunteer_shifts
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.volunteer_missions m
      WHERE m.id = mission_id
        AND (public.is_association_admin(m.association_id)
             OR public.is_global_association_admin()
             OR m.responsible_id = auth.uid())
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.volunteer_missions m
      WHERE m.id = mission_id
        AND (public.is_association_admin(m.association_id)
             OR public.is_global_association_admin())
    )
  );

-- ── volunteer_assignments ──
ALTER TABLE public.volunteer_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vol_assign_select" ON public.volunteer_assignments
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR public.is_global_association_admin()
    OR public.is_association_admin(association_id)
  );

CREATE POLICY "vol_assign_manage" ON public.volunteer_assignments
  FOR ALL TO authenticated USING (
    user_id = auth.uid()
    OR public.is_global_association_admin()
    OR public.is_association_admin(association_id)
  ) WITH CHECK (
    public.is_global_association_admin()
    OR public.is_association_admin(association_id)
    -- Volunteer can confirm/cancel their own assignment
    OR (user_id = auth.uid() AND status IN ('confirmed', 'cancelled'))
  );

-- ── volunteer_documents ──
ALTER TABLE public.volunteer_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vol_docs_select" ON public.volunteer_documents
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR public.is_global_association_admin()
    OR public.is_association_admin(association_id)
  );

CREATE POLICY "vol_docs_insert" ON public.volunteer_documents
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
    OR public.is_global_association_admin()
    OR public.is_association_admin(association_id)
  );

CREATE POLICY "vol_docs_update" ON public.volunteer_documents
  FOR UPDATE TO authenticated USING (
    public.is_global_association_admin()
    OR public.is_association_admin(association_id)
  );

-- ── volunteer_messages ──
ALTER TABLE public.volunteer_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vol_msgs_select" ON public.volunteer_messages
  FOR SELECT TO authenticated USING (
    sender_id = auth.uid()
    OR recipient_id = auth.uid()
    OR (is_broadcast = true AND public.is_association_member(association_id))
    OR public.is_global_association_admin()
  );

CREATE POLICY "vol_msgs_insert" ON public.volunteer_messages
  FOR INSERT TO authenticated WITH CHECK (
    public.is_global_association_admin()
    OR public.is_association_admin(association_id)
  );

-- ── volunteer_activity_log ──
ALTER TABLE public.volunteer_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vol_log_select" ON public.volunteer_activity_log
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR public.is_global_association_admin()
    OR public.is_association_admin(association_id)
  );

-- Insert is done by triggers (SECURITY DEFINER), no RLS insert policy needed for users


-- ============================================================
-- 11. VIEWS — Dashboard helpers
-- ============================================================

CREATE OR REPLACE VIEW public.volunteer_dashboard_stats AS
SELECT
  m.association_id,
  COUNT(*) FILTER (WHERE m.engagement_level IN ('benevole_occasionnel', 'benevole_actif', 'staff') AND m.is_active) AS active_volunteers,
  COUNT(*) FILTER (WHERE m.involvement_status = 'active') AS involvement_active,
  COUNT(*) FILTER (WHERE m.involvement_status = 'occasional') AS involvement_occasional,
  COUNT(*) FILTER (WHERE m.involvement_status = 'staff_event') AS involvement_staff,
  COUNT(*) FILTER (WHERE m.involvement_status = 'zone_leader') AS involvement_zone_leaders,
  COUNT(*) FILTER (WHERE m.involvement_status = 'coordinator') AS involvement_coordinators,
  COUNT(*) FILTER (WHERE m.availability_status = 'available') AS available_count,
  COUNT(*) FILTER (WHERE m.availability_status = 'to_confirm') AS to_confirm_count,
  COALESCE(SUM(m.total_missions_completed), 0) AS total_missions_all,
  COALESCE(SUM(m.total_hours_volunteered), 0) AS total_hours_all,
  COALESCE(AVG(m.reliability_score), 100) AS avg_reliability
FROM public.association_memberships m
WHERE m.engagement_level IN ('benevole_occasionnel', 'benevole_actif', 'staff')
GROUP BY m.association_id;


-- ============================================================
-- RÉCAPITULATIF MODULE BÉNÉVOLAT V1
-- ============================================================
--
-- TABLES CRÉÉES :
--   volunteer_applications    — Candidatures bénévoles (workflow complet)
--   volunteer_missions        — Missions avec skills/priorité/schedule
--   volunteer_shifts          — Créneaux horaires par mission
--   volunteer_assignments     — Affectations bénévole ↔ mission/shift
--   volunteer_documents       — Documents bénévoles (charte, image, etc.)
--   volunteer_messages        — Communications internes
--   volunteer_activity_log    — Historique d'activité & points
--
-- COLONNES AJOUTÉES à association_memberships :
--   involvement_status       — occasional/active/staff_event/zone_leader/coordinator/alumni
--   availability_status      — available/conditional/unavailable/to_confirm
--   onboarding_step          — progression onboarding (1-9)
--   onboarding_completed_at  — date de fin d'onboarding
--   total_missions_completed — nombre de missions terminées
--   total_hours_volunteered  — heures cumulées
--   reliability_score        — score de fiabilité (0-100)
--   last_mission_at          — date dernière mission
--
-- ENUMS CRÉÉS :
--   volunteer_application_status, volunteer_application_source
--   volunteer_involvement_status, volunteer_availability_status
--   mission_status, mission_priority, shift_status, assignment_status
--   volunteer_document_type, volunteer_document_status
--   volunteer_message_type
--
-- TRIGGERS :
--   trg_update_mission_slots     — auto-update slots_filled on assignments
--   trg_update_volunteer_stats   — auto-update membership stats on completed/absent
--   trg_vol_app_approved         — auto-create/update membership on application approval
--
-- VIEWS :
--   volunteer_dashboard_stats    — stats agrégées par association
--
-- RLS : Complet pour toutes les tables
--   Bénévoles : accès à leurs propres données
--   Admins association : accès total à leurs données
--   Super admin : accès global
