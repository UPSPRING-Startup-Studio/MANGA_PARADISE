-- Migration: Unify cosplay_vestiaire into cosplay_plans
-- Description: Migrate existing incarnations from cosplay_vestiaire to cosplay_plans
--              and add a source_vestiaire_id column to track the origin
-- Date: 2026-02-26

-- Step 1: Add source_vestiaire_id column to cosplay_plans to track migrated items
ALTER TABLE public.cosplay_plans
ADD COLUMN IF NOT EXISTS source_vestiaire_id UUID REFERENCES public.cosplay_vestiaire(id) ON DELETE SET NULL;

-- Step 2: Add user_image_url column to cosplay_plans (for vestiaire-style photos)
ALTER TABLE public.cosplay_plans
ADD COLUMN IF NOT EXISTS user_image_url TEXT;

-- Step 3: Add official_image_url column to cosplay_plans
ALTER TABLE public.cosplay_plans
ADD COLUMN IF NOT EXISTS official_image_url TEXT;

-- Step 4: Migrate existing cosplay_vestiaire entries to cosplay_plans
-- Only migrate entries that don't already have a corresponding cosplay_plan
INSERT INTO public.cosplay_plans (
  user_id,
  character_name,
  character_id,
  universe,
  universe_id,
  target_year,
  progress_level,
  status,
  priority,
  image_url,
  user_image_url,
  official_image_url,
  is_in_wardrobe,
  auto_progress,
  source_vestiaire_id,
  created_at
)
SELECT 
  cv.user_id,
  cv.character_name,
  cv.character_id,
  cv.universe,
  cv.universe_id,
  EXTRACT(YEAR FROM cv.created_at)::INTEGER as target_year,
  100 as progress_level,
  'finished' as status,
  0 as priority,
  cv.user_image_url as image_url,
  cv.user_image_url,
  cv.official_image_url,
  true as is_in_wardrobe,
  false as auto_progress,
  cv.id as source_vestiaire_id,
  cv.created_at
FROM public.cosplay_vestiaire cv
WHERE NOT EXISTS (
  -- Don't migrate if already migrated (check by source_vestiaire_id)
  SELECT 1 FROM public.cosplay_plans cp 
  WHERE cp.source_vestiaire_id = cv.id
);

-- Step 5: Create index for source_vestiaire_id
CREATE INDEX IF NOT EXISTS idx_cosplay_plans_source_vestiaire_id ON public.cosplay_plans(source_vestiaire_id);

-- Step 6: Add comment
COMMENT ON COLUMN public.cosplay_plans.source_vestiaire_id IS 'Reference to original cosplay_vestiaire entry (for migrated items)';
COMMENT ON COLUMN public.cosplay_plans.user_image_url IS 'User photo of the cosplay (from vestiaire)';
COMMENT ON COLUMN public.cosplay_plans.official_image_url IS 'Official character image (from vestiaire)';

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
