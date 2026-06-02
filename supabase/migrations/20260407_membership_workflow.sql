-- ============================================================
-- MODULE ADHESION — Workflow complet de bulletin d'adhesion
--
-- Tables :
--   1. membership_form_definitions    — definitions de formulaires par asso
--   2. membership_submissions         — dossiers de demande d'adhesion
--   3. membership_submission_answers  — reponses individuelles
--   4. membership_consents            — consentements traces
--   5. membership_signatures          — signatures tracees
--   6. membership_submission_status_history — historique des statuts
--   7. membership_submission_requests — demandes de complement
--
-- IDEMPOTENT : IF NOT EXISTS / DO $$ EXCEPTION $$
-- ============================================================


-- ============================================================
-- 1. membership_form_definitions
-- ============================================================

CREATE TABLE IF NOT EXISTS public.membership_form_definitions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id  uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  slug            text NOT NULL,
  name            text NOT NULL,
  season          text,
  version         integer NOT NULL DEFAULT 1,
  status          text NOT NULL DEFAULT 'published',
  definition      jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default      boolean NOT NULL DEFAULT false,
  created_by      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(association_id, slug, version)
);

DO $$ BEGIN
  ALTER TABLE public.membership_form_definitions
    ADD CONSTRAINT chk_form_def_status CHECK (status IN ('draft', 'published', 'archived'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_form_defs_association ON public.membership_form_definitions(association_id);
CREATE INDEX IF NOT EXISTS idx_form_defs_slug ON public.membership_form_definitions(slug);
CREATE INDEX IF NOT EXISTS idx_form_defs_default ON public.membership_form_definitions(association_id, is_default) WHERE is_default = true;

DROP TRIGGER IF EXISTS on_form_def_updated ON public.membership_form_definitions;
CREATE TRIGGER on_form_def_updated
  BEFORE UPDATE ON public.membership_form_definitions
  FOR EACH ROW EXECUTE FUNCTION public.handle_association_updated_at();


-- ============================================================
-- 2. membership_submissions
-- ============================================================

CREATE TABLE IF NOT EXISTS public.membership_submissions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id        uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  form_definition_id    uuid NOT NULL REFERENCES public.membership_form_definitions(id) ON DELETE RESTRICT,
  public_slug           text,
  applicant_profile_id  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  submitted_by_user_id  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  pathway               text NOT NULL DEFAULT 'major',
  season                text,
  status                text NOT NULL DEFAULT 'submitted',
  payment_status        text NOT NULL DEFAULT 'unpaid',
  review_notes          text,
  internal_notes        text,
  submitted_at          timestamptz,
  reviewed_at           timestamptz,
  reviewed_by           uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at           timestamptz,
  rejected_at           timestamptz,
  activated_at          timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE public.membership_submissions
    ADD CONSTRAINT chk_submission_pathway CHECK (pathway IN ('major', 'minor'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.membership_submissions
    ADD CONSTRAINT chk_submission_status CHECK (status IN (
      'draft', 'submitted', 'under_review', 'needs_more_info',
      'approved', 'rejected', 'awaiting_payment', 'activated'
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.membership_submissions
    ADD CONSTRAINT chk_payment_status CHECK (payment_status IN (
      'unpaid', 'pending', 'paid', 'waived', 'not_applicable'
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_submissions_association ON public.membership_submissions(association_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.membership_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_payment ON public.membership_submissions(payment_status);
CREATE INDEX IF NOT EXISTS idx_submissions_applicant ON public.membership_submissions(applicant_profile_id);
CREATE INDEX IF NOT EXISTS idx_submissions_season ON public.membership_submissions(season);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON public.membership_submissions(submitted_at DESC);

DROP TRIGGER IF EXISTS on_submission_updated ON public.membership_submissions;
CREATE TRIGGER on_submission_updated
  BEFORE UPDATE ON public.membership_submissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_association_updated_at();


-- ============================================================
-- 3. membership_submission_answers
-- ============================================================

CREATE TABLE IF NOT EXISTS public.membership_submission_answers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   uuid NOT NULL REFERENCES public.membership_submissions(id) ON DELETE CASCADE,
  step_id         text NOT NULL,
  field_id        text NOT NULL,
  field_type      text NOT NULL,
  value           jsonb,
  is_visible      boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_answers_submission ON public.membership_submission_answers(submission_id);
CREATE INDEX IF NOT EXISTS idx_answers_field ON public.membership_submission_answers(field_id);


-- ============================================================
-- 4. membership_consents
-- ============================================================

CREATE TABLE IF NOT EXISTS public.membership_consents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   uuid NOT NULL REFERENCES public.membership_submissions(id) ON DELETE CASCADE,
  field_id        text NOT NULL,
  label           text NOT NULL,
  accepted        boolean NOT NULL,
  accepted_at     timestamptz,
  consent_text    text,
  version         text,
  actor_type      text NOT NULL DEFAULT 'member',
  created_at      timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE public.membership_consents
    ADD CONSTRAINT chk_consent_actor CHECK (actor_type IN ('member', 'guardian', 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_consents_submission ON public.membership_consents(submission_id);


-- ============================================================
-- 5. membership_signatures
-- ============================================================

CREATE TABLE IF NOT EXISTS public.membership_signatures (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id     uuid NOT NULL REFERENCES public.membership_submissions(id) ON DELETE CASCADE,
  field_id          text NOT NULL,
  signed_name       text NOT NULL,
  signed_at         timestamptz NOT NULL DEFAULT now(),
  actor_type        text NOT NULL DEFAULT 'member',
  signature_payload jsonb,
  created_at        timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE public.membership_signatures
    ADD CONSTRAINT chk_signature_actor CHECK (actor_type IN ('member', 'guardian', 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_signatures_submission ON public.membership_signatures(submission_id);


-- ============================================================
-- 6. membership_submission_status_history
-- ============================================================

CREATE TABLE IF NOT EXISTS public.membership_submission_status_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   uuid NOT NULL REFERENCES public.membership_submissions(id) ON DELETE CASCADE,
  from_status     text,
  to_status       text NOT NULL,
  reason          text,
  changed_by      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_status_history_submission ON public.membership_submission_status_history(submission_id);
CREATE INDEX IF NOT EXISTS idx_status_history_created ON public.membership_submission_status_history(created_at DESC);


-- ============================================================
-- 7. membership_submission_requests
-- ============================================================

CREATE TABLE IF NOT EXISTS public.membership_submission_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   uuid NOT NULL REFERENCES public.membership_submissions(id) ON DELETE CASCADE,
  type            text NOT NULL DEFAULT 'missing_info',
  message         text NOT NULL,
  status          text NOT NULL DEFAULT 'open',
  requested_by    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_at    timestamptz NOT NULL DEFAULT now(),
  resolved_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE public.membership_submission_requests
    ADD CONSTRAINT chk_request_status CHECK (status IN ('open', 'resolved', 'cancelled'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_requests_submission ON public.membership_submission_requests(submission_id);


-- ============================================================
-- 8. RLS POLICIES
-- ============================================================

-- ── form definitions ──
ALTER TABLE public.membership_form_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "form_defs_select_published"
  ON public.membership_form_definitions FOR SELECT
  TO authenticated
  USING (
    status = 'published'
    OR public.is_global_association_admin()
    OR public.is_association_admin(association_id)
  );

-- Anon can also read published definitions (public form)
CREATE POLICY "form_defs_select_anon"
  ON public.membership_form_definitions FOR SELECT
  TO anon
  USING (status = 'published');

CREATE POLICY "form_defs_manage"
  ON public.membership_form_definitions FOR ALL
  TO authenticated
  USING (
    public.is_global_association_admin()
    OR public.is_association_admin(association_id)
  );

-- ── submissions ──
ALTER TABLE public.membership_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can INSERT a submission for a published form
CREATE POLICY "submissions_insert_public"
  ON public.membership_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.membership_form_definitions fd
      WHERE fd.id = form_definition_id AND fd.status = 'published'
    )
  );

-- Authenticated user can read own submissions
CREATE POLICY "submissions_select_own"
  ON public.membership_submissions FOR SELECT
  TO authenticated
  USING (
    submitted_by_user_id = auth.uid()
    OR applicant_profile_id = auth.uid()
  );

-- Association admins can read all submissions for their asso
CREATE POLICY "submissions_select_admin"
  ON public.membership_submissions FOR SELECT
  TO authenticated
  USING (
    public.is_global_association_admin()
    OR public.is_association_admin(association_id)
  );

-- Association admins can update submissions
CREATE POLICY "submissions_update_admin"
  ON public.membership_submissions FOR UPDATE
  TO authenticated
  USING (
    public.is_global_association_admin()
    OR public.is_association_admin(association_id)
  );

-- ── answers ──
ALTER TABLE public.membership_submission_answers ENABLE ROW LEVEL SECURITY;

-- Anyone can insert answers (during form submit)
CREATE POLICY "answers_insert_public"
  ON public.membership_submission_answers FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Read: own submission or admin
CREATE POLICY "answers_select"
  ON public.membership_submission_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.membership_submissions s
      WHERE s.id = submission_id
      AND (
        s.submitted_by_user_id = auth.uid()
        OR s.applicant_profile_id = auth.uid()
        OR public.is_global_association_admin()
        OR public.is_association_admin(s.association_id)
      )
    )
  );

-- ── consents ──
ALTER TABLE public.membership_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consents_insert_public"
  ON public.membership_consents FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "consents_select"
  ON public.membership_consents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.membership_submissions s
      WHERE s.id = submission_id
      AND (
        s.submitted_by_user_id = auth.uid()
        OR public.is_global_association_admin()
        OR public.is_association_admin(s.association_id)
      )
    )
  );

-- ── signatures ──
ALTER TABLE public.membership_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "signatures_insert_public"
  ON public.membership_signatures FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "signatures_select"
  ON public.membership_signatures FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.membership_submissions s
      WHERE s.id = submission_id
      AND (
        s.submitted_by_user_id = auth.uid()
        OR public.is_global_association_admin()
        OR public.is_association_admin(s.association_id)
      )
    )
  );

-- ── status history ──
ALTER TABLE public.membership_submission_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "status_history_insert"
  ON public.membership_submission_status_history FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "status_history_select"
  ON public.membership_submission_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.membership_submissions s
      WHERE s.id = submission_id
      AND (
        s.submitted_by_user_id = auth.uid()
        OR public.is_global_association_admin()
        OR public.is_association_admin(s.association_id)
      )
    )
  );

-- ── requests ──
ALTER TABLE public.membership_submission_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "requests_manage"
  ON public.membership_submission_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.membership_submissions s
      WHERE s.id = submission_id
      AND (
        public.is_global_association_admin()
        OR public.is_association_admin(s.association_id)
      )
    )
  );

CREATE POLICY "requests_select_own"
  ON public.membership_submission_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.membership_submissions s
      WHERE s.id = submission_id
      AND (s.submitted_by_user_id = auth.uid() OR s.applicant_profile_id = auth.uid())
    )
  );
