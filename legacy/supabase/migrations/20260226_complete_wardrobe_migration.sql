-- ============================================================================
-- MIGRATION COMPLETE: Unify cosplay_vestiaire into cosplay_plans
-- ============================================================================
-- Description: This script adds all necessary columns to cosplay_plans and
--              migrates existing incarnations from cosplay_vestiaire.
--              Execute this ENTIRE script in Supabase SQL Editor.
-- Date: 2026-02-26
-- ============================================================================

-- ============================================================================
-- STEP 1: Add wardrobe status columns to cosplay_plans
-- ============================================================================

-- Add is_in_wardrobe column (tracks if item is in the wardrobe)
ALTER TABLE public.cosplay_plans
ADD COLUMN IF NOT EXISTS is_in_wardrobe BOOLEAN DEFAULT false;

-- Add craft_type column (handmade, bought, mixed)
ALTER TABLE public.cosplay_plans
ADD COLUMN IF NOT EXISTS craft_type TEXT DEFAULT NULL
CHECK (craft_type IS NULL OR craft_type IN ('handmade', 'bought', 'mixed'));

-- Add folder_id column (for hierarchical organization)
ALTER TABLE public.cosplay_plans
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.cosplay_folders(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 2: Add vestiaire-specific columns to cosplay_plans
-- ============================================================================

-- Add source_vestiaire_id column to track migrated items
ALTER TABLE public.cosplay_plans
ADD COLUMN IF NOT EXISTS source_vestiaire_id UUID REFERENCES public.cosplay_vestiaire(id) ON DELETE SET NULL;

-- Add user_image_url column (user's cosplay photo)
ALTER TABLE public.cosplay_plans
ADD COLUMN IF NOT EXISTS user_image_url TEXT;

-- Add official_image_url column (official character image)
ALTER TABLE public.cosplay_plans
ADD COLUMN IF NOT EXISTS official_image_url TEXT;

-- ============================================================================
-- STEP 3: Migrate existing cosplay_vestiaire entries to cosplay_plans
-- ============================================================================

-- Insert all vestiaire entries that haven't been migrated yet
-- Note: We do NOT include character_id and universe_id as they don't exist in cosplay_plans
INSERT INTO public.cosplay_plans (
  user_id,
  character_name,
  universe,
  target_year,
  progress_level,
  status,
  priority,
  image_url,
  user_image_url,
  official_image_url,
  is_in_wardrobe,
  craft_type,
  auto_progress,
  source_vestiaire_id,
  created_at
)
SELECT 
  cv.user_id,
  cv.character_name,
  cv.universe,
  EXTRACT(YEAR FROM cv.created_at)::INTEGER as target_year,
  100 as progress_level,
  'finished' as status,
  0 as priority,
  cv.user_image_url as image_url,  -- Use user_image_url as main image
  cv.user_image_url,
  cv.official_image_url,
  true as is_in_wardrobe,
  NULL as craft_type,  -- User can set this later
  false as auto_progress,
  cv.id as source_vestiaire_id,
  cv.created_at
FROM public.cosplay_vestiaire cv
WHERE NOT EXISTS (
  -- Don't migrate if already migrated (check by source_vestiaire_id)
  SELECT 1 FROM public.cosplay_plans cp 
  WHERE cp.source_vestiaire_id = cv.id
);

-- ============================================================================
-- STEP 4: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_cosplay_plans_is_in_wardrobe ON public.cosplay_plans(is_in_wardrobe);
CREATE INDEX IF NOT EXISTS idx_cosplay_plans_folder_id ON public.cosplay_plans(folder_id);
CREATE INDEX IF NOT EXISTS idx_cosplay_plans_source_vestiaire_id ON public.cosplay_plans(source_vestiaire_id);

-- ============================================================================
-- STEP 5: Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN public.cosplay_plans.is_in_wardrobe IS 'Whether this cosplay is in the wardrobe (completed)';
COMMENT ON COLUMN public.cosplay_plans.craft_type IS 'Type of cosplay: handmade, bought, or mixed';
COMMENT ON COLUMN public.cosplay_plans.folder_id IS 'Folder for organization (hierarchical)';
COMMENT ON COLUMN public.cosplay_plans.source_vestiaire_id IS 'Reference to original cosplay_vestiaire entry (for migrated items)';
COMMENT ON COLUMN public.cosplay_plans.user_image_url IS 'User photo of the cosplay (from vestiaire)';
COMMENT ON COLUMN public.cosplay_plans.official_image_url IS 'Official character image (from vestiaire)';

-- ============================================================================
-- STEP 6: Notify PostgREST to reload schema
-- ============================================================================

NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- VERIFICATION QUERIES (run separately to check migration)
-- ============================================================================

-- Check how many items were migrated:
-- SELECT COUNT(*) FROM cosplay_plans WHERE source_vestiaire_id IS NOT NULL;

-- Check total vestiaire items:
-- SELECT COUNT(*) FROM cosplay_vestiaire;

-- View migrated items:
-- SELECT id, character_name, universe, is_in_wardrobe, source_vestiaire_id 
-- FROM cosplay_plans 
-- WHERE source_vestiaire_id IS NOT NULL;
