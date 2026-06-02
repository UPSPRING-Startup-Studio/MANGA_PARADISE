-- Add allow_event_checkin column to profiles table
ALTER TABLE profiles 
ADD COLUMN allow_event_checkin BOOLEAN DEFAULT TRUE;

-- Add is_present and checked_in_at columns to event_participants table
ALTER TABLE event_participants
ADD COLUMN is_present BOOLEAN DEFAULT FALSE,
ADD COLUMN checked_in_at TIMESTAMPTZ;