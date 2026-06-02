-- =====================================================
-- MIGRATION: activity_participation_stats View
-- DATE: 2026-02-14
-- DESCRIPTION: Creates a view to aggregate participation stats
--              for each activity in the event schedule
-- =====================================================

-- Drop view if exists
DROP VIEW IF EXISTS public.activity_participation_stats;

-- Create view for activity participation statistics
CREATE OR REPLACE VIEW public.activity_participation_stats AS
SELECT 
  uf.activity_id,
  uf.event_id,
  COUNT(DISTINCT uf.user_id) AS participant_count,
  json_agg(
    json_build_object(
      'id', p.id,
      'username', p.username,
      'avatar_url', p.avatar_url,
      'display_name', COALESCE(p.display_name, p.username)
    ) ORDER BY uf.created_at ASC
  ) FILTER (WHERE p.id IS NOT NULL) AS participants
FROM public.user_favorites uf
LEFT JOIN public.profiles p ON p.id = uf.user_id
GROUP BY uf.activity_id, uf.event_id;

-- Add comment to view
COMMENT ON VIEW public.activity_participation_stats IS 'Aggregates participation statistics for each activity, including participant count and user details';

-- Grant access to authenticated users
GRANT SELECT ON public.activity_participation_stats TO authenticated;
