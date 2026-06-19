-- Migration: Photo Tag Response Notifications
-- Description: Trigger that notifies the tagger when a tagged user accepts or declines
-- Date: 2026-04-03

-- ─── Fonction trigger sur UPDATE de cosplay_photo_tags ─────────────────────────

CREATE OR REPLACE FUNCTION notify_photo_tag_response()
RETURNS TRIGGER AS $$
DECLARE
  v_tagged_username TEXT;
  v_notif_type      TEXT;
  v_content         TEXT;
BEGIN
  -- Only fire when status actually changes to accepted or declined
  IF OLD.status = 'pending' AND NEW.status IN ('accepted', 'declined') THEN

    -- Get the tagged user's username
    SELECT username INTO v_tagged_username
    FROM profiles WHERE id = NEW.tagged_user_id;

    IF NEW.status = 'accepted' THEN
      v_notif_type := 'PHOTO_TAG_ACCEPTED';
      v_content := COALESCE(v_tagged_username, 'Un membre') || ' a accepté ton tag photo !';
    ELSE
      v_notif_type := 'PHOTO_TAG_DECLINED';
      v_content := COALESCE(v_tagged_username, 'Un membre') || ' a refusé ton tag photo.';
    END IF;

    INSERT INTO notifications (user_id, sender_id, type, content, related_link, is_read)
    VALUES (
      OLD.tagger_user_id,       -- recipient = the original tagger
      NEW.tagged_user_id,       -- sender = the tagged user who responded
      v_notif_type,
      v_content,
      NEW.photo_id::TEXT,       -- link to the photo for context
      false
    );

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Trigger sur UPDATE de cosplay_photo_tags ─────────────────────────────────

DROP TRIGGER IF EXISTS trg_notify_photo_tag_response ON public.cosplay_photo_tags;

CREATE TRIGGER trg_notify_photo_tag_response
  AFTER UPDATE ON public.cosplay_photo_tags
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_photo_tag_response();

-- ─── Notify PostgREST ─────────────────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';
