-- Add official_image_url column to ref_characters table if it doesn't exist
-- This column stores the official/reference image URL for characters

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ref_characters' 
    AND column_name = 'official_image_url'
  ) THEN
    ALTER TABLE public.ref_characters 
    ADD COLUMN official_image_url TEXT DEFAULT NULL;
    
    COMMENT ON COLUMN public.ref_characters.official_image_url IS 'URL of the official/reference image for this character';
    
    RAISE NOTICE 'Column official_image_url added to ref_characters';
  ELSE
    RAISE NOTICE 'Column official_image_url already exists in ref_characters';
  END IF;
END $$;

-- Add character_id and universe_id columns to cosplay_plans table
-- These columns link the cosplay project to the reference character and universe

DO $$ 
BEGIN
  -- Add character_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'cosplay_plans' 
    AND column_name = 'character_id'
  ) THEN
    ALTER TABLE public.cosplay_plans 
    ADD COLUMN character_id UUID DEFAULT NULL REFERENCES public.ref_characters(id) ON DELETE SET NULL;
    
    COMMENT ON COLUMN public.cosplay_plans.character_id IS 'Reference to the character in ref_characters table';
    
    RAISE NOTICE 'Column character_id added to cosplay_plans';
  ELSE
    RAISE NOTICE 'Column character_id already exists in cosplay_plans';
  END IF;
  
  -- Add universe_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'cosplay_plans' 
    AND column_name = 'universe_id'
  ) THEN
    ALTER TABLE public.cosplay_plans 
    ADD COLUMN universe_id UUID DEFAULT NULL REFERENCES public.ref_universes(id) ON DELETE SET NULL;
    
    COMMENT ON COLUMN public.cosplay_plans.universe_id IS 'Reference to the universe in ref_universes table';
    
    RAISE NOTICE 'Column universe_id added to cosplay_plans';
  ELSE
    RAISE NOTICE 'Column universe_id already exists in cosplay_plans';
  END IF;
END $$;
