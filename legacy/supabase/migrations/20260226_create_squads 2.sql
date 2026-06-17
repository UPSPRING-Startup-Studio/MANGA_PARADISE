-- =====================================================
-- MIGRATION: Create Squads System (Party Finder)
-- DATE: 2026-02-26
-- DESCRIPTION: Creates the squads and squad_members tables
--              to enable the "Party Finder" multiplayer feature.
--              Users can group together by event to coordinate
--              their cosplay projects.
-- =====================================================

-- =====================================================
-- TABLE: squads
-- Represents a cosplay group organized around an event
-- =====================================================
CREATE TABLE IF NOT EXISTS public.squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  target_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure squad names are not empty
  CONSTRAINT squad_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Add comments
COMMENT ON TABLE public.squads IS 'Cosplay groups organized around a specific event (Party Finder feature)';
COMMENT ON COLUMN public.squads.name IS 'Display name of the squad, e.g. "Groupe Demon Slayer"';
COMMENT ON COLUMN public.squads.description IS 'Optional description of the squad and its goals';
COMMENT ON COLUMN public.squads.target_event_id IS 'The event this squad is targeting (FK to events table)';
COMMENT ON COLUMN public.squads.created_by IS 'The user who created and leads this squad (FK to profiles)';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_squads_target_event_id ON public.squads(target_event_id);
CREATE INDEX IF NOT EXISTS idx_squads_created_by ON public.squads(created_by);
CREATE INDEX IF NOT EXISTS idx_squads_created_at ON public.squads(created_at DESC);

-- =====================================================
-- TABLE: squad_members
-- Junction table linking users to squads with their cosplay plan
-- =====================================================
CREATE TABLE IF NOT EXISTS public.squad_members (
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cosplay_plan_id UUID REFERENCES public.cosplay_plans(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Composite primary key: one entry per user per squad
  PRIMARY KEY (squad_id, user_id)
);

-- Add comments
COMMENT ON TABLE public.squad_members IS 'Members of a squad with their associated cosplay plan and membership status';
COMMENT ON COLUMN public.squad_members.squad_id IS 'Reference to the squad';
COMMENT ON COLUMN public.squad_members.user_id IS 'Reference to the member profile';
COMMENT ON COLUMN public.squad_members.cosplay_plan_id IS 'The cosplay plan this member is bringing to the squad';
COMMENT ON COLUMN public.squad_members.status IS 'Membership status: pending (applied) or accepted (approved by leader)';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_squad_members_squad_id ON public.squad_members(squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_members_user_id ON public.squad_members(user_id);
CREATE INDEX IF NOT EXISTS idx_squad_members_cosplay_plan_id ON public.squad_members(cosplay_plan_id);
CREATE INDEX IF NOT EXISTS idx_squad_members_status ON public.squad_members(status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on both tables
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: squads
-- =====================================================

-- Anyone authenticated can view squads (needed for Party Finder browsing)
CREATE POLICY "Authenticated users can view all squads"
  ON public.squads
  FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can create squads (they become the leader)
CREATE POLICY "Authenticated users can create squads"
  ON public.squads
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Only the squad creator can update their squad
CREATE POLICY "Squad creator can update their squad"
  ON public.squads
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Only the squad creator can delete their squad
CREATE POLICY "Squad creator can delete their squad"
  ON public.squads
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- =====================================================
-- RLS POLICIES: squad_members
-- =====================================================

-- Anyone authenticated can view squad members (for member count display)
CREATE POLICY "Authenticated users can view squad members"
  ON public.squad_members
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can apply to join a squad (insert their own membership)
CREATE POLICY "Users can apply to join a squad"
  ON public.squad_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Squad leader can update member status (accept/reject applications)
-- Users can also update their own membership (e.g., change cosplay plan)
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

-- Users can leave a squad (delete their own membership)
-- Squad leader can also remove members
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
-- GRANTS
-- =====================================================
GRANT ALL ON public.squads TO authenticated;
GRANT ALL ON public.squads TO service_role;
GRANT ALL ON public.squad_members TO authenticated;
GRANT ALL ON public.squad_members TO service_role;

-- =====================================================
-- NOTIFY PostgREST to reload schema cache (CRITICAL!)
-- =====================================================
NOTIFY pgrst, 'reload schema';
