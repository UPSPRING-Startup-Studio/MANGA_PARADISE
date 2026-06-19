-- =====================================================
-- MIGRATION: Add Social Features to Cosplay Plans
-- DATE: 2026-02-25
-- DESCRIPTION: Adds group_id column to cosplay_plans and creates
--              cosplan_reactions table for social interactions
-- =====================================================

-- Step 1: Add group_id column to cosplay_plans
-- Note: The group_id is nullable and will reference a parties table when it's created
-- For now, we add it without foreign key constraint to avoid dependency issues
ALTER TABLE public.cosplay_plans
ADD COLUMN IF NOT EXISTS group_id UUID;

-- Add comment to column
COMMENT ON COLUMN public.cosplay_plans.group_id IS 'Reference to a party/group for collaborative cosplay projects (FK will be added when parties table is created)';

-- Create index for group queries
CREATE INDEX IF NOT EXISTS idx_cosplay_plans_group_id ON public.cosplay_plans(group_id);

-- Step 2: Create cosplan_reactions table
CREATE TABLE IF NOT EXISTS public.cosplan_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cosplay_plan_id UUID NOT NULL REFERENCES public.cosplay_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('hype', 'love', 'favorite', 'amazing')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one reaction per user per cosplan
  UNIQUE(cosplay_plan_id, user_id)
);

-- Add comments
COMMENT ON TABLE public.cosplan_reactions IS 'Social reactions (hype, love, favorite, amazing) on cosplay plans';
COMMENT ON COLUMN public.cosplan_reactions.reaction_type IS 'Type of reaction: hype, love, favorite, or amazing';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cosplan_reactions_cosplay_plan_id ON public.cosplan_reactions(cosplay_plan_id);
CREATE INDEX IF NOT EXISTS idx_cosplan_reactions_user_id ON public.cosplan_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_cosplan_reactions_type ON public.cosplan_reactions(reaction_type);

-- Step 3: Enable Row Level Security (RLS)
ALTER TABLE public.cosplan_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cosplan_reactions
-- Policy: Users can view all reactions
CREATE POLICY "Users can view all reactions"
  ON public.cosplan_reactions
  FOR SELECT
  USING (true);

-- Policy: Users can add their own reactions
CREATE POLICY "Users can add their own reactions"
  ON public.cosplan_reactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own reactions
CREATE POLICY "Users can delete their own reactions"
  ON public.cosplan_reactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Users can update their own reactions
CREATE POLICY "Users can update their own reactions"
  ON public.cosplan_reactions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 4: Create helper function to get reaction counts for a cosplan
CREATE OR REPLACE FUNCTION public.get_cosplan_reaction_counts(p_cosplay_plan_id UUID)
RETURNS TABLE (
  hype_count BIGINT,
  love_count BIGINT,
  favorite_count BIGINT,
  amazing_count BIGINT,
  total_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE reaction_type = 'hype') AS hype_count,
    COUNT(*) FILTER (WHERE reaction_type = 'love') AS love_count,
    COUNT(*) FILTER (WHERE reaction_type = 'favorite') AS favorite_count,
    COUNT(*) FILTER (WHERE reaction_type = 'amazing') AS amazing_count,
    COUNT(*) AS total_count
  FROM public.cosplan_reactions
  WHERE cosplay_plan_id = p_cosplay_plan_id;
END;
$$;

-- Add comment to function
COMMENT ON FUNCTION public.get_cosplan_reaction_counts IS 'Returns aggregated reaction counts for a specific cosplay plan';

-- Step 5: Notify PostgREST to reload schema cache (CRITICAL!)
NOTIFY pgrst, 'reload schema';
