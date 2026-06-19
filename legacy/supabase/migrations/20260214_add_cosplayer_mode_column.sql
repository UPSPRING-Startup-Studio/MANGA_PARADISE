-- Add is_cosplayer_mode_active column to profiles table if it doesn't exist
-- This column tracks whether the user has activated their cosplayer profile mode

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_cosplayer_mode_active'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN is_cosplayer_mode_active BOOLEAN DEFAULT false;
    
    COMMENT ON COLUMN public.profiles.is_cosplayer_mode_active IS 'Indicates if the user has activated their cosplayer profile mode';
  END IF;
END $$;
