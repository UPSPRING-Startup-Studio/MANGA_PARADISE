-- ============================================================
-- Migration : Phase 3 — Durcissement RLS admin_status
-- Date      : 2026-04-16
-- Objet     : Étendre is_association_writable / is_association_restricted
--             à toutes les tables d'écriture : volunteer_*, membership_form_*,
--             events. Garantir la triple protection (UI + handler + RLS).
--
-- Dépend de : 20260415_admin_status_governance.sql
--             (colonnes admin_status, deleted_at, helpers writable/restricted)
--
-- Principe  :
--   - is_association_writable(id) = false si blocked OU deleted
--   - is_association_restricted(id) = true si restricted
--   - Super-admin bypass via is_global_association_admin() dans chaque policy
--
-- Matrice Phase 2 appliquée :
--   volunteer_missions       → blocked + restricted → writable AND NOT restricted
--   volunteer_assignments    → blocked only         → writable
--   volunteer_applications   → blocked only (self-apply OK en restricted) → writable
--   membership_form_defs     → blocked + restricted → writable AND NOT restricted
--   membership_submissions   → blocked only (public apply OK en restricted) → writable
--   membership_sub_answers   → blocked only → via helper submission writable
--   membership_consents      → blocked only → via helper submission writable
--   membership_signatures    → blocked only → via helper submission writable
--   events                   → blocked + restricted → writable AND NOT restricted
-- ============================================================


-- ────────────────────────────────────────────────
-- 1. HELPER SUPPLÉMENTAIRE : is_submission_association_writable
-- ────────────────────────────────────────────────
-- Nécessaire pour les 3 tables indirectes (answers, consents, signatures)
-- qui n'ont pas de association_id direct mais un submission_id FK.

CREATE OR REPLACE FUNCTION public.is_submission_association_writable(p_submission_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.membership_submissions s
    JOIN public.associations a ON a.id = s.association_id
    WHERE s.id = p_submission_id
      AND a.admin_status != 'blocked'
      AND a.deleted_at IS NULL
  );
$$;

COMMENT ON FUNCTION public.is_submission_association_writable(uuid) IS
  'Résout submission → association et vérifie que l''association n''est ni bloquée ni supprimée. '
  'Utilisé par les RLS policies sur membership_submission_answers, membership_consents, membership_signatures.';


-- ============================================================
-- 2. VOLUNTEER_MISSIONS
-- ============================================================
-- Matrice : blocked = NO writes, restricted = NO writes
-- Super-admin bypass

-- Drop l'ancienne policy ALL unique
DROP POLICY IF EXISTS "vol_missions_manage" ON public.volunteer_missions;

-- INSERT : admin global OU (admin asso ET asso ouverte ET pas restricted)
CREATE POLICY "vol_missions_insert"
  ON public.volunteer_missions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_global_association_admin()
    OR (
      public.is_association_admin(association_id)
      AND public.is_association_writable(association_id)
      AND NOT public.is_association_restricted(association_id)
    )
  );

-- UPDATE : admin global OU (admin asso / responsable ET asso ouverte ET pas restricted)
CREATE POLICY "vol_missions_update"
  ON public.volunteer_missions
  FOR UPDATE
  TO authenticated
  USING (
    public.is_global_association_admin()
    OR (
      (public.is_association_admin(association_id) OR responsible_id = auth.uid())
      AND public.is_association_writable(association_id)
      AND NOT public.is_association_restricted(association_id)
    )
  )
  WITH CHECK (
    public.is_global_association_admin()
    OR (
      public.is_association_admin(association_id)
      AND public.is_association_writable(association_id)
      AND NOT public.is_association_restricted(association_id)
    )
  );

-- DELETE : admin global OU (admin asso ET asso ouverte)
CREATE POLICY "vol_missions_delete"
  ON public.volunteer_missions
  FOR DELETE
  TO authenticated
  USING (
    public.is_global_association_admin()
    OR (
      public.is_association_admin(association_id)
      AND public.is_association_writable(association_id)
    )
  );


-- ============================================================
-- 3. VOLUNTEER_ASSIGNMENTS
-- ============================================================
-- Matrice : blocked = NO writes, restricted = OK
-- Super-admin bypass

DROP POLICY IF EXISTS "vol_assign_manage" ON public.volunteer_assignments;

-- INSERT : admin global OU (admin asso ET asso writable)
CREATE POLICY "vol_assign_insert"
  ON public.volunteer_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_global_association_admin()
    OR (
      public.is_association_admin(association_id)
      AND public.is_association_writable(association_id)
    )
  );

-- UPDATE : admin global OU (admin asso / self-user ET asso writable)
CREATE POLICY "vol_assign_update"
  ON public.volunteer_assignments
  FOR UPDATE
  TO authenticated
  USING (
    public.is_global_association_admin()
    OR (
      (user_id = auth.uid() OR public.is_association_admin(association_id))
      AND public.is_association_writable(association_id)
    )
  )
  WITH CHECK (
    public.is_global_association_admin()
    OR (
      (
        public.is_association_admin(association_id)
        OR (user_id = auth.uid() AND status IN ('confirmed', 'cancelled'))
      )
      AND public.is_association_writable(association_id)
    )
  );

-- DELETE : admin global OU (admin asso ET asso writable)
CREATE POLICY "vol_assign_delete"
  ON public.volunteer_assignments
  FOR DELETE
  TO authenticated
  USING (
    public.is_global_association_admin()
    OR (
      public.is_association_admin(association_id)
      AND public.is_association_writable(association_id)
    )
  );


-- ============================================================
-- 4. VOLUNTEER_APPLICATIONS
-- ============================================================
-- Matrice : blocked = NO writes (even self-apply), restricted = self-apply OK
-- Les candidatures externes (anon) sont aussi bloquées si asso blocked.
-- Super-admin bypass

DROP POLICY IF EXISTS "vol_apps_insert" ON public.volunteer_applications;
DROP POLICY IF EXISTS "vol_apps_update" ON public.volunteer_applications;
DROP POLICY IF EXISTS "vol_apps_insert_anon" ON public.volunteer_applications;

-- INSERT (authenticated) : self-apply OU admin, mais asso doit être writable
CREATE POLICY "vol_apps_insert"
  ON public.volunteer_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_global_association_admin()
    OR (
      (user_id = auth.uid() OR public.is_association_admin(association_id))
      AND public.is_association_writable(association_id)
    )
  );

-- INSERT (anon / external) : seulement si source = 'external' ET asso writable
CREATE POLICY "vol_apps_insert_anon"
  ON public.volunteer_applications
  FOR INSERT
  TO anon
  WITH CHECK (
    source = 'external'
    AND public.is_association_writable(association_id)
  );

-- UPDATE : admin global OU (admin asso / self-user en brouillon) ET asso writable
CREATE POLICY "vol_apps_update"
  ON public.volunteer_applications
  FOR UPDATE
  TO authenticated
  USING (
    public.is_global_association_admin()
    OR (
      (
        (user_id = auth.uid() AND status IN ('started', 'incomplete'))
        OR public.is_association_admin(association_id)
      )
      AND public.is_association_writable(association_id)
    )
  );


-- ============================================================
-- 5. MEMBERSHIP_FORM_DEFINITIONS
-- ============================================================
-- Matrice : blocked + restricted = NO writes (canManageForms = false)
-- Super-admin bypass. Le SELECT reste inchangé.

DROP POLICY IF EXISTS "form_defs_manage" ON public.membership_form_definitions;

-- INSERT : admin global OU (admin asso ET asso ouverte ET pas restricted)
CREATE POLICY "form_defs_insert"
  ON public.membership_form_definitions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_global_association_admin()
    OR (
      public.is_association_admin(association_id)
      AND public.is_association_writable(association_id)
      AND NOT public.is_association_restricted(association_id)
    )
  );

-- UPDATE : admin global OU (admin asso ET asso ouverte ET pas restricted)
CREATE POLICY "form_defs_update"
  ON public.membership_form_definitions
  FOR UPDATE
  TO authenticated
  USING (
    public.is_global_association_admin()
    OR (
      public.is_association_admin(association_id)
      AND public.is_association_writable(association_id)
      AND NOT public.is_association_restricted(association_id)
    )
  )
  WITH CHECK (
    public.is_global_association_admin()
    OR (
      public.is_association_admin(association_id)
      AND public.is_association_writable(association_id)
      AND NOT public.is_association_restricted(association_id)
    )
  );

-- DELETE : admin global OU (admin asso ET asso ouverte)
CREATE POLICY "form_defs_delete"
  ON public.membership_form_definitions
  FOR DELETE
  TO authenticated
  USING (
    public.is_global_association_admin()
    OR (
      public.is_association_admin(association_id)
      AND public.is_association_writable(association_id)
    )
  );


-- ============================================================
-- 6. MEMBERSHIP_SUBMISSIONS
-- ============================================================
-- Matrice : blocked = NO new submissions, restricted = OK (public apply allowed)
-- UPDATE (admin review) : blocked = NO, restricted = OK
-- INSERT public (anon) : bloqué si asso blocked
-- Super-admin bypass

DROP POLICY IF EXISTS "submissions_insert_public" ON public.membership_submissions;
DROP POLICY IF EXISTS "submissions_update_admin" ON public.membership_submissions;

-- INSERT : formulaire published ET asso writable
CREATE POLICY "submissions_insert"
  ON public.membership_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.membership_form_definitions fd
      WHERE fd.id = form_definition_id
        AND fd.status = 'published'
    )
    AND public.is_association_writable(association_id)
  );

-- UPDATE (admin review) : admin global OU (admin asso ET asso writable)
CREATE POLICY "submissions_update"
  ON public.membership_submissions
  FOR UPDATE
  TO authenticated
  USING (
    public.is_global_association_admin()
    OR (
      public.is_association_admin(association_id)
      AND public.is_association_writable(association_id)
    )
  );


-- ============================================================
-- 7. MEMBERSHIP_SUBMISSION_ANSWERS (indirect via submission_id)
-- ============================================================
-- Matrice : blocked = NO writes (même pour le candidat)
-- La table n'a pas association_id → utilise le helper submission

DROP POLICY IF EXISTS "answers_insert_public" ON public.membership_submission_answers;

-- INSERT : uniquement si l'asso de la submission est writable
CREATE POLICY "answers_insert"
  ON public.membership_submission_answers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    public.is_submission_association_writable(submission_id)
  );


-- ============================================================
-- 8. MEMBERSHIP_CONSENTS (indirect via submission_id)
-- ============================================================

DROP POLICY IF EXISTS "consents_insert_public" ON public.membership_consents;

-- INSERT : uniquement si l'asso de la submission est writable
CREATE POLICY "consents_insert"
  ON public.membership_consents
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    public.is_submission_association_writable(submission_id)
  );


-- ============================================================
-- 9. MEMBERSHIP_SIGNATURES (indirect via submission_id)
-- ============================================================

DROP POLICY IF EXISTS "signatures_insert_public" ON public.membership_signatures;

-- INSERT : uniquement si l'asso de la submission est writable
CREATE POLICY "signatures_insert"
  ON public.membership_signatures
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    public.is_submission_association_writable(submission_id)
  );


-- ============================================================
-- 10. EVENTS
-- ============================================================
-- Matrice : blocked + restricted = NO create/edit d'événements liés à l'asso
-- Events sans association (association_id IS NULL) ne sont pas impactés
-- Super-admin bypass via is_platform_admin()
--
-- On remplace les policies UPDATE existantes et on ajoute INSERT/DELETE.

DROP POLICY IF EXISTS "events_update_admin_or_leader" ON public.events;
DROP POLICY IF EXISTS "events_update_asso_owner" ON public.events;

-- INSERT : admin plateforme OU (pas d'asso OU asso ouverte et pas restricted + leader)
-- Note : les événements sans association sont libres de création selon les rules existantes.
-- On protège uniquement les événements rattachés à une association.
CREATE POLICY "events_insert_gov"
  ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR (
      association_id IS NULL
    )
    OR (
      association_id IS NOT NULL
      AND public.is_association_leader(association_id)
      AND public.is_association_writable(association_id)
      AND NOT public.is_association_restricted(association_id)
    )
  );

-- UPDATE : admin plateforme OU (leader/owner ET, si asso rattachée, asso ouverte + pas restricted)
CREATE POLICY "events_update_gov"
  ON public.events
  FOR UPDATE
  TO authenticated
  USING (
    public.is_platform_admin()
    OR (
      association_id IS NULL
      AND organizer_id = auth.uid()
    )
    OR (
      association_id IS NOT NULL
      AND (
        public.is_association_leader(association_id)
        OR public.is_association_owner(association_id)
      )
      AND public.is_association_writable(association_id)
      AND NOT public.is_association_restricted(association_id)
    )
  )
  WITH CHECK (
    public.is_platform_admin()
    OR (
      -- Permettre de détacher un événement (mettre association_id à NULL)
      association_id IS NULL
    )
    OR (
      association_id IS NOT NULL
      AND (
        public.is_association_leader(association_id)
        OR public.is_association_owner(association_id)
      )
      AND public.is_association_writable(association_id)
      AND NOT public.is_association_restricted(association_id)
    )
  );

-- DELETE : admin plateforme OU (leader asso ET asso writable)
CREATE POLICY "events_delete_gov"
  ON public.events
  FOR DELETE
  TO authenticated
  USING (
    public.is_platform_admin()
    OR (
      association_id IS NOT NULL
      AND public.is_association_leader(association_id)
      AND public.is_association_writable(association_id)
    )
    OR (
      association_id IS NULL
      AND organizer_id = auth.uid()
    )
  );


-- ============================================================
-- 11. Vérification : s'assurer que is_association_owner existe
-- ============================================================
-- Certaines policies events référencent is_association_owner.
-- Si la fonction n'existe pas déjà, la créer.

CREATE OR REPLACE FUNCTION public.is_association_owner(p_association_id uuid)
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
      AND role = 'president'
      AND is_active = true
  );
END;
$$;


-- ============================================================
-- FIN DE LA MIGRATION PHASE 3
-- ============================================================
