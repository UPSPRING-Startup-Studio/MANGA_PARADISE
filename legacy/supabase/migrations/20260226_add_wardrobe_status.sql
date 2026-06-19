-- Migration: Add Wardrobe Status and Craft Type
-- Description: Add columns to track cosplay wardrobe status and craft type
-- Date: 2026-02-26

-- Add is_in_wardrobe column to cosplay_plans
ALTER TABLE public.cosplay_plans
ADD COLUMN IF NOT EXISTS is_in_wardrobe BOOLEAN DEFAULT false;

-- Add craft_type column to cosplay_plans
ALTER TABLE public.cosplay_plans
ADD COLUMN IF NOT EXISTS craft_type TEXT CHECK (craft_type IS NULL OR craft_type IN ('handmade', 'bought', 'mixed'));

-- Create index for wardrobe queries
CREATE INDEX IF NOT EXISTS idx_cosplay_plans_is_in_wardrobe ON public.cosplay_plans(is_in_wardrobe);
CREATE INDEX IF NOT EXISTS idx_cosplay_plans_craft_type ON public.cosplay_plans(craft_type);

-- Create index for combined queries (user + wardrobe status)
CREATE INDEX IF NOT EXISTS idx_cosplay_plans_user_wardrobe ON public.cosplay_plans(user_id, is_in_wardrobe);

-- Add comment to columns for documentation
COMMENT ON COLUMN public.cosplay_plans.is_in_wardrobe IS 'Indicates if the cosplay has been transferred to the wardrobe (100% complete)';
COMMENT ON COLUMN public.cosplay_plans.craft_type IS 'Type of crafting: handmade (100% fait main), bought (acheté), or mixed (mixte)';

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
