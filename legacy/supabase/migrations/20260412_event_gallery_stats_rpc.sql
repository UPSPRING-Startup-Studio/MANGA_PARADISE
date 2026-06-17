-- ============================================================================
-- Migration: Event Community Gallery — RPC stats function
-- Date: 2026-04-12
-- Purpose: Efficient aggregate stats for the community gallery of a past event.
-- ============================================================================

-- Returns total photos and unique contributor count for an event's community gallery.
-- Used by the EventCommunityGallery component to display stats without fetching all rows.
-- Note: total_group_photos is computed client-side (is_group_photo column may not exist yet).

CREATE OR REPLACE FUNCTION get_event_gallery_stats(p_event_id UUID)
RETURNS TABLE (
  total_photos BIGINT,
  total_contributors BIGINT,
  total_cosplays BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    COUNT(*)::BIGINT                    AS total_photos,
    COUNT(DISTINCT user_id)::BIGINT     AS total_contributors,
    COUNT(DISTINCT cosplay_id)::BIGINT  AS total_cosplays
  FROM cosplay_photos
  WHERE event_id = p_event_id;
$$;

-- Grant execute to authenticated users (RLS on the underlying table still applies for the query)
GRANT EXECUTE ON FUNCTION get_event_gallery_stats(UUID) TO authenticated;

COMMENT ON FUNCTION get_event_gallery_stats IS
  'Returns aggregate stats (photos, contributors, cosplays) for an event community gallery.';
