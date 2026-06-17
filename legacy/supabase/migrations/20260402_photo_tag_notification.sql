-- Migration: Photo Tag Notification
-- Description: Trigger qui envoie une notification quand un membre est tagué sur une photo
-- Date: 2026-04-02

-- ─── Fonction trigger ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION notify_photo_tag()
RETURNS TRIGGER AS $$
DECLARE
  v_tagger_username TEXT;
  v_cosplay_name    TEXT;
BEGIN
  -- Notifier uniquement si c'est un membre MP (tagged_user_id non null)
  -- et que le tag est en pending (les non-membres sont auto-accepted, pas de notif)
  IF NEW.tagged_user_id IS NOT NULL AND NEW.status = 'pending' THEN

    -- Récupère le pseudo du tagger
    SELECT username INTO v_tagger_username
    FROM profiles
    WHERE id = NEW.tagger_user_id;

    -- Récupère le nom du cosplay via la photo
    -- Note : cosplay_photos.cosplay_id référence cosplay_plans (pas cosplays)
    SELECT cp_plan.character_name INTO v_cosplay_name
    FROM cosplay_photos cp_photo
    JOIN cosplay_plans cp_plan ON cp_plan.id = cp_photo.cosplay_id
    WHERE cp_photo.id = NEW.photo_id;

    -- Insère la notification (même pattern que trg_notify_friend_request)
    INSERT INTO notifications (
      user_id,       -- destinataire = le taggé
      sender_id,     -- expéditeur = le tagger
      type,          -- type en MAJUSCULES comme les autres
      content,       -- message affiché dans DenDenMushi
      related_link,  -- tag_id (même rôle que friendship_id pour FRIEND_REQUEST)
      is_read
    ) VALUES (
      NEW.tagged_user_id,
      NEW.tagger_user_id,
      'PHOTO_TAG',
      COALESCE(v_tagger_username, 'Un membre') || ' t''a tagué(e) sur une photo de '
        || COALESCE(v_cosplay_name, 'cosplay'),
      NEW.id::TEXT,
      false
    );

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Trigger sur INSERT dans cosplay_photo_tags ───────────────────────────────

DROP TRIGGER IF EXISTS trg_notify_photo_tag ON cosplay_photo_tags;

CREATE TRIGGER trg_notify_photo_tag
  AFTER INSERT ON cosplay_photo_tags
  FOR EACH ROW
  EXECUTE FUNCTION notify_photo_tag();

-- ─── Notify PostgREST ─────────────────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';
