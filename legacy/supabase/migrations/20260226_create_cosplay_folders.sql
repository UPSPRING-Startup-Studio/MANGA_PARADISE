-- Migration: Create Cosplay Folders System
-- Description: Add hierarchical folder structure for organizing cosplay projects
-- Date: 2026-02-26

-- Create cosplay_folders table with hierarchical structure
CREATE TABLE IF NOT EXISTS public.cosplay_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.cosplay_folders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure folder names are not empty
  CONSTRAINT name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Add folder_id column to cosplay_plans table
ALTER TABLE public.cosplay_plans
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.cosplay_folders(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cosplay_folders_user_id ON public.cosplay_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_cosplay_folders_parent_id ON public.cosplay_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_cosplay_plans_folder_id ON public.cosplay_plans(folder_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_cosplay_folders_updated_at ON public.cosplay_folders;
CREATE TRIGGER update_cosplay_folders_updated_at
  BEFORE UPDATE ON public.cosplay_folders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.cosplay_folders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cosplay_folders
-- Users can view their own folders
CREATE POLICY "Users can view their own folders"
  ON public.cosplay_folders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own folders
CREATE POLICY "Users can create their own folders"
  ON public.cosplay_folders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own folders
CREATE POLICY "Users can update their own folders"
  ON public.cosplay_folders
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own folders
CREATE POLICY "Users can delete their own folders"
  ON public.cosplay_folders
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.cosplay_folders TO authenticated;
GRANT ALL ON public.cosplay_folders TO service_role;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
