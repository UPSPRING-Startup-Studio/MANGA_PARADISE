-- =====================================================
-- MIGRATION: Add UNIQUE constraint on contest_registrations
-- DATE: 2026-02-16
-- DESCRIPTION: Prevents duplicate registrations for the same user/event
-- 
-- INSTRUCTIONS:
-- 1. Ouvrir Supabase Dashboard: https://uwzftqjhdiaytybthrnk.supabase.co
-- 2. Aller dans SQL Editor
-- 3. Copier-coller ce script et l'exécuter
-- =====================================================

-- Add unique constraint on (user_id, event_id)
-- This ensures a user can only register once per event
ALTER TABLE public.contest_registrations
ADD CONSTRAINT contest_registrations_user_event_unique 
UNIQUE (user_id, event_id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_contest_registrations_user_event 
ON public.contest_registrations(user_id, event_id);

-- Add comment
COMMENT ON CONSTRAINT contest_registrations_user_event_unique 
ON public.contest_registrations 
IS 'Ensures a user can only register once per event';

-- Verify the constraint was added
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.contest_registrations'::regclass
  AND conname = 'contest_registrations_user_event_unique';
