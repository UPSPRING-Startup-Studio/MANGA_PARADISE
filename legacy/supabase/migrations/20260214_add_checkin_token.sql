-- =====================================================
-- MIGRATION: Add check_in_token to event_participants
-- DATE: 2026-02-14
-- DESCRIPTION: Adds a unique check_in_token for QR code generation
-- =====================================================

-- Add check_in_token column if it doesn't exist
ALTER TABLE public.event_participants
ADD COLUMN IF NOT EXISTS check_in_token UUID DEFAULT gen_random_uuid() UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_event_participants_check_in_token ON public.event_participants(check_in_token);

-- Add comment
COMMENT ON COLUMN public.event_participants.check_in_token IS 'Unique token for QR code check-in validation';
