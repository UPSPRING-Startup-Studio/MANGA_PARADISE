-- Migration: Create Event Lineups (N:M relation between cosplay_plans and events)
-- Description: Replaces the 1:1 target_event_id with a proper N:M junction table.
--              A cosplay plan can now be assigned to multiple events.
-- Date: 2026-02-26
-- IDEMPOTENT: Safe to run multiple times (uses IF NOT EXISTS / DROP IF EXISTS)

-- ─── Table: event_lineups ──────────────────────────────────────────────────────
-- Junction table linking a cosplay_plan to one or more events.
-- Each row represents "I plan to wear this cosplay at this event".

CREATE TABLE IF NOT EXISTS public.event_lineups (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cosplay_plan_id UUID        NOT NULL REFERENCES public.cosplay_plans(id) ON DELETE CASCADE,
  event_id        UUID        NOT NULL REFERENCES public.events(id)        ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES auth.users(id)           ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate assignments: same cosplay at the same event
  CONSTRAINT uq_event_lineups_cosplay_event UNIQUE (cosplay_plan_id, event_id)
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_event_lineups_cosplay_plan_id
  ON public.event_lineups(cosplay_plan_id);

CREATE INDEX IF NOT EXISTS idx_event_lineups_event_id
  ON public.event_lineups(event_id);

CREATE INDEX IF NOT EXISTS idx_event_lineups_user_id
  ON public.event_lineups(user_id);

-- ─── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE public.event_lineups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating (idempotent)
DROP POLICY IF EXISTS "Users can view their own event lineups"   ON public.event_lineups;
DROP POLICY IF EXISTS "Users can insert their own event lineups" ON public.event_lineups;
DROP POLICY IF EXISTS "Users can delete their own event lineups" ON public.event_lineups;

-- Users can view their own lineups
CREATE POLICY "Users can view their own event lineups"
  ON public.event_lineups
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own lineups
CREATE POLICY "Users can insert their own event lineups"
  ON public.event_lineups
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own lineups
CREATE POLICY "Users can delete their own event lineups"
  ON public.event_lineups
  FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Notify PostgREST to reload schema ────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
