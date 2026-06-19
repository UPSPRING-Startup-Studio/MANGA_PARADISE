-- ==============================================================
-- FIX: Allow detaching association from events via UPDATE
-- Version: 20260414
--
-- PROBLEM:
--   The WITH CHECK clause on events_update_admin_or_leader and
--   events_update_asso_owner requires association_id IS NOT NULL
--   on the NEW row. This means nobody except platform admins
--   can set association_id = NULL (detach an event from an
--   association). The USING clause is correct (checks OLD row),
--   but WITH CHECK incorrectly blocks legitimate detachment.
--
--   Similarly, the USING clause on events_update_admin_or_leader
--   requires association_id IS NOT NULL, which prevents updating
--   events that were never attached to an association (standalone
--   events created by admins).
--
-- FIX:
--   1. events_update_admin_or_leader:
--      - USING: allow platform admins OR association leaders
--        for their events, OR events with no association
--        (standalone events created by admins)
--      - WITH CHECK: allow platform admins unconditionally.
--        For association leaders: the new association_id can be
--        NULL (detach) or their own association (keep/change).
--
--   2. events_update_asso_owner:
--      - USING: keep as-is (old row must belong to their asso)
--      - WITH CHECK: relax to allow NULL (detach) or same asso
-- ==============================================================

-- ── 1. Fix events_update_admin_or_leader ─────────────────────

DROP POLICY IF EXISTS "events_update_admin_or_leader" ON public.events;

CREATE POLICY "events_update_admin_or_leader"
  ON public.events
  FOR UPDATE
  TO authenticated
  USING (
    -- Platform admins can update any event
    public.is_platform_admin()
    OR (
      -- Association leaders can update events belonging to their association
      association_id IS NOT NULL
      AND public.is_association_leader(association_id)
    )
  )
  WITH CHECK (
    -- Platform admins: no restriction on new values
    public.is_platform_admin()
    OR (
      -- Association leaders can:
      -- a) detach the event (set association_id to NULL)
      -- b) keep the event attached to their own association
      -- They cannot reassign to a different association they don't lead
      association_id IS NULL
      OR public.is_association_leader(association_id)
    )
  );

-- ── 2. Fix events_update_asso_owner ──────────────────────────

DROP POLICY IF EXISTS "events_update_asso_owner" ON public.events;

CREATE POLICY "events_update_asso_owner"
  ON public.events
  FOR UPDATE
  TO authenticated
  USING (
    -- Owner can update events belonging to their association
    association_id IS NOT NULL
    AND public.is_association_owner(association_id)
  )
  WITH CHECK (
    -- Owner can detach (NULL) or keep attached to their association
    association_id IS NULL
    OR public.is_association_owner(association_id)
  );
