-- ============================================================
-- NAKAMAS SYSTEM — Friendships + Notifications
-- ============================================================
-- Tables : friendships, notifications
-- Enum   : friendship_status
-- RLS    : policies per table
-- Trigger: auto-notify on friend request
-- ============================================================

-- 1. ENUM friendship_status
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.friendship_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- 2. TABLE friendships
-- ============================================================
CREATE TABLE IF NOT EXISTS public.friendships (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status            public.friendship_status NOT NULL DEFAULT 'pending',
  meeting_context   TEXT,
  meeting_event_id  UUID REFERENCES public.events(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Prevent self-friendship
  CONSTRAINT no_self_friendship CHECK (requester_id <> addressee_id)
);

-- Bidirectional uniqueness: prevent duplicate A→B and B→A pairs
-- (LEAST/GREATEST expressions require a unique INDEX, not an inline CONSTRAINT)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_friendship
  ON public.friendships (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id));

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON public.friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status    ON public.friendships(status);


-- 3. TABLE notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type         TEXT NOT NULL,            -- 'FRIEND_REQUEST' | 'EVENT_REMINDER' | 'LIKE' | 'COMMENT' | 'SYSTEM'
  content      TEXT NOT NULL,
  related_link TEXT,                     -- For FRIEND_REQUEST: stores the friendship_id (UUID as text)
  is_read      BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id   ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read   ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type      ON public.notifications(type);


-- 4. RLS — friendships
-- ============================================================
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "friendships_select" ON public.friendships;
CREATE POLICY "friendships_select"
  ON public.friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

DROP POLICY IF EXISTS "friendships_insert" ON public.friendships;
CREATE POLICY "friendships_insert"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "friendships_update" ON public.friendships;
CREATE POLICY "friendships_update"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

DROP POLICY IF EXISTS "friendships_delete" ON public.friendships;
CREATE POLICY "friendships_delete"
  ON public.friendships FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);


-- 5. RLS — notifications
-- ============================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
CREATE POLICY "notifications_select"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_service" ON public.notifications;
CREATE POLICY "notifications_insert_service"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
CREATE POLICY "notifications_update"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete" ON public.notifications;
CREATE POLICY "notifications_delete"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);


-- 6. AUTO-NOTIFY TRIGGER — friend request received
-- ============================================================
-- When a friendship row is inserted with status='pending',
-- automatically create a FRIEND_REQUEST notification for the addressee.
-- The `related_link` stores the friendship id so DenDenMushi can accept/reject.

CREATE OR REPLACE FUNCTION public.notify_friend_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name TEXT;
BEGIN
  -- Only trigger on new pending requests
  IF NEW.status <> 'pending' THEN
    RETURN NEW;
  END IF;

  -- Fetch display name of requester for the notification content
  SELECT COALESCE(display_name, username, 'Quelqu''un')
  INTO sender_name
  FROM public.profiles
  WHERE id = NEW.requester_id;

  -- Insert the notification
  INSERT INTO public.notifications (user_id, sender_id, type, content, related_link, is_read)
  VALUES (
    NEW.addressee_id,
    NEW.requester_id,
    'FRIEND_REQUEST',
    sender_name || ' veut rejoindre ton équipage !',
    NEW.id::text,   -- friendship_id — used by DenDenMushi to accept/reject
    false
  );

  RETURN NEW;
END;
$$;

-- Drop + recreate trigger (idempotent)
DROP TRIGGER IF EXISTS trg_notify_friend_request ON public.friendships;
CREATE TRIGGER trg_notify_friend_request
  AFTER INSERT ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_friend_request();


-- 7. AUTO-UPDATE updated_at on friendships
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_friendships_updated_at ON public.friendships;
CREATE TRIGGER trg_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
