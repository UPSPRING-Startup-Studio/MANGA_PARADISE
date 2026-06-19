-- =====================================================
-- MIGRATION: Party Finder — Slots Architecture (v2)
-- DATE: 2026-02-25
-- DESCRIPTION:
--   Refactors the Party Finder system to support a
--   slot-based application model (MMORPG-style LFG).
--
--   TASK 1: ALTER squads — add `mode` and `is_private`
--   TASK 2: CREATE squad_slots — specific openings defined by the leader
--   TASK 3: ALTER squad_members — add `slot_id`, refactor PK
-- =====================================================


-- =====================================================
-- TASK 1: ALTER TABLE squads
-- Add `mode` (squad type) and `is_private` (visibility)
-- =====================================================

-- Add the `mode` column with a CHECK constraint limiting to 3 values:
--   'squad'    → social group (default use case)
--   'shooting' → photo/video session
--   'concours' → competition/performance group
ALTER TABLE public.squads
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'squad'
    CONSTRAINT squads_mode_check CHECK (mode IN ('squad', 'shooting', 'concours'));

-- Add the `is_private` column (false = publicly visible in Party Finder)
ALTER TABLE public.squads
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;

-- Document the new columns
COMMENT ON COLUMN public.squads.mode IS 'Type of squad: squad (social), shooting (photo session), concours (competition)';
COMMENT ON COLUMN public.squads.is_private IS 'If true, the squad is hidden from public Party Finder listings';

-- Index for filtering by mode in the Party Finder UI
CREATE INDEX IF NOT EXISTS idx_squads_mode ON public.squads(mode);
-- Index for filtering public squads efficiently
CREATE INDEX IF NOT EXISTS idx_squads_is_private ON public.squads(is_private);


-- =====================================================
-- TASK 2: CREATE TABLE squad_slots
-- Specific openings (roles/seats) defined by the squad leader.
-- Users apply to a specific slot, not the squad globally.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.squad_slots (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id    UUID        NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,

  -- Human-readable label for the slot, e.g. "Naruto", "Photographe", "Covoiturage"
  title       TEXT        NOT NULL,

  -- Categorical type to help filter/display slots:
  --   'character' → a cosplay character role
  --   'staff'     → photographer, videographer, makeup artist, etc.
  --   'generic'   → any other open seat (carpool, companion, etc.)
  role_type   TEXT        NOT NULL DEFAULT 'generic'
    CONSTRAINT squad_slots_role_type_check CHECK (role_type IN ('character', 'staff', 'generic')),

  -- Free-text requirements set by the leader, e.g. "Costume 100% fini"
  requirements TEXT,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- A slot title must not be blank
  CONSTRAINT squad_slots_title_not_empty CHECK (LENGTH(TRIM(title)) > 0)
);

-- Document the table and columns
COMMENT ON TABLE  public.squad_slots IS 'Individual openings within a squad that users can apply to (slot-based LFG)';
COMMENT ON COLUMN public.squad_slots.squad_id     IS 'Parent squad (FK → squads, CASCADE on delete)';
COMMENT ON COLUMN public.squad_slots.title        IS 'Display name of the slot, e.g. "Naruto", "Photographe"';
COMMENT ON COLUMN public.squad_slots.role_type    IS 'Slot category: character | staff | generic';
COMMENT ON COLUMN public.squad_slots.requirements IS 'Leader-defined conditions for this slot, e.g. "Costume 100% fini"';

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_squad_slots_squad_id   ON public.squad_slots(squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_slots_role_type  ON public.squad_slots(role_type);
CREATE INDEX IF NOT EXISTS idx_squad_slots_created_at ON public.squad_slots(created_at DESC);

-- =====================================================
-- RLS: squad_slots
-- =====================================================

ALTER TABLE public.squad_slots ENABLE ROW LEVEL SECURITY;

-- Public read: anyone (even anonymous) can browse available slots
CREATE POLICY "Public can view squad slots"
  ON public.squad_slots
  FOR SELECT
  USING (true);

-- Only the squad leader (created_by on the parent squad) can create slots
CREATE POLICY "Squad leader can create slots"
  ON public.squad_slots
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT created_by FROM public.squads WHERE id = squad_id
    )
  );

-- Only the squad leader can update their slots
CREATE POLICY "Squad leader can update slots"
  ON public.squad_slots
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT created_by FROM public.squads WHERE id = squad_id
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT created_by FROM public.squads WHERE id = squad_id
    )
  );

-- Only the squad leader can delete their slots
CREATE POLICY "Squad leader can delete slots"
  ON public.squad_slots
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT created_by FROM public.squads WHERE id = squad_id
    )
  );

-- Grants
GRANT ALL ON public.squad_slots TO authenticated;
GRANT ALL ON public.squad_slots TO service_role;


-- =====================================================
-- TASK 3: ALTER TABLE squad_members
-- Add `slot_id` FK and refactor the primary key.
--
-- RATIONALE:
--   The old PK was (squad_id, user_id), which prevented a user
--   from applying to multiple slots in the same squad.
--   The new PK is (slot_id, user_id): one application per slot per user,
--   but a user can hold multiple slots in the same squad (e.g., character
--   role + carpool seat).
-- =====================================================

-- Step 1: Drop the old composite primary key constraint
ALTER TABLE public.squad_members
  DROP CONSTRAINT IF EXISTS squad_members_pkey;

-- Step 2: Add the slot_id column (nullable first to avoid breaking existing rows)
ALTER TABLE public.squad_members
  ADD COLUMN IF NOT EXISTS slot_id UUID REFERENCES public.squad_slots(id) ON DELETE CASCADE;

-- Step 3: Define the new composite primary key on (slot_id, user_id).
--   NOTE: slot_id can be NULL for legacy rows that pre-date this migration.
--   We use a UNIQUE constraint instead of a PK to tolerate NULLs gracefully,
--   and add a separate surrogate PK if needed. However, since Supabase/PostgREST
--   requires a PK, we add a surrogate UUID PK column.
--
--   Strategy chosen: add a surrogate `id` UUID PK so the table always has a
--   stable primary key, and enforce uniqueness on (slot_id, user_id) via a
--   UNIQUE constraint (NULLs are excluded from uniqueness checks in PostgreSQL,
--   which is the desired behaviour for legacy rows).

-- Add surrogate PK column (only if it doesn't already exist)
ALTER TABLE public.squad_members
  ADD COLUMN IF NOT EXISTS id UUID NOT NULL DEFAULT gen_random_uuid();

-- Promote it to primary key
ALTER TABLE public.squad_members
  ADD CONSTRAINT squad_members_pkey PRIMARY KEY (id);

-- Enforce: one application per user per slot
ALTER TABLE public.squad_members
  ADD CONSTRAINT squad_members_slot_user_unique UNIQUE (slot_id, user_id);

-- Document the new columns
COMMENT ON COLUMN public.squad_members.slot_id IS 'The specific slot this member applied to (FK → squad_slots, CASCADE on delete). NULL for legacy global applications.';
COMMENT ON COLUMN public.squad_members.id      IS 'Surrogate primary key (UUID). Replaces the old composite PK (squad_id, user_id).';

-- Index for fast lookup of all applicants for a given slot
CREATE INDEX IF NOT EXISTS idx_squad_members_slot_id ON public.squad_members(slot_id);

-- =====================================================
-- Update existing RLS policies on squad_members
-- (Drop & recreate to reflect the new schema)
-- =====================================================

-- Drop old policies that may reference the old PK logic
DROP POLICY IF EXISTS "Authenticated users can view squad members"   ON public.squad_members;
DROP POLICY IF EXISTS "Users can apply to join a squad"              ON public.squad_members;
DROP POLICY IF EXISTS "Squad leader or member can update membership" ON public.squad_members;
DROP POLICY IF EXISTS "Users can leave or be removed from a squad"   ON public.squad_members;

-- Recreate: public read (same as before)
CREATE POLICY "Authenticated users can view squad members"
  ON public.squad_members
  FOR SELECT
  TO authenticated
  USING (true);

-- Recreate: users apply to a slot (insert their own application)
CREATE POLICY "Users can apply to a slot"
  ON public.squad_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Recreate: squad leader accepts/rejects; member can update their own application
CREATE POLICY "Squad leader or member can update membership"
  ON public.squad_members
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT created_by FROM public.squads WHERE id = squad_id
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT created_by FROM public.squads WHERE id = squad_id
    )
  );

-- Recreate: member can withdraw; leader can remove
CREATE POLICY "Users can leave or be removed from a squad"
  ON public.squad_members
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT created_by FROM public.squads WHERE id = squad_id
    )
  );


-- =====================================================
-- NOTIFY PostgREST to reload schema cache (CRITICAL!)
-- =====================================================
NOTIFY pgrst, 'reload schema';
