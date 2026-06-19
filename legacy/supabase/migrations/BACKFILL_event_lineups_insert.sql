-- ==============================================================
-- BACKFILL — Injecter les participations cosplayer historiques
--            depuis event_participants vers event_lineups.
--
-- IDEMPOTENT : ON CONFLICT DO NOTHING.
-- NON DESTRUCTIF : aucun DELETE, aucun UPDATE.
-- À exécuter APRÈS avoir validé le script d'audit.
-- ==============================================================


-- ── INSERT avec résolution du cosplay_plan_id ────────────────

WITH candidates AS (
  SELECT
    ep.user_id,
    ep.event_id,
    ep.registered_at,
    -- Stratégie A : cosplay_id direct (déjà cosplay_plans.id)
    ep.cosplay_id AS direct_plan_id,
    -- Stratégie B : planned_cosplay_id (cosplay_vestiaire.id)
    ep.planned_cosplay_id,
    -- Stratégie C : cosplay_data JSON → premier élément
    CASE
      WHEN ep.cosplay_data IS NOT NULL
       AND jsonb_typeof(ep.cosplay_data) = 'array'
       AND jsonb_array_length(ep.cosplay_data) > 0
      THEN ep.cosplay_data->0->>'cosplayId'
      ELSE NULL
    END AS json_vestiaire_id
  FROM public.event_participants ep
  WHERE ep.role = 'cosplayer'
),
resolved AS (
  SELECT
    c.user_id,
    c.event_id,
    c.registered_at,
    COALESCE(
      c.direct_plan_id,
      cp_b.id,
      cp_c.id
    ) AS resolved_plan_id
  FROM candidates c
  LEFT JOIN public.cosplay_plans cp_b
    ON cp_b.source_vestiaire_id = c.planned_cosplay_id
    AND cp_b.user_id = c.user_id
  LEFT JOIN public.cosplay_plans cp_c
    ON cp_c.source_vestiaire_id = c.json_vestiaire_id::uuid
    AND cp_c.user_id = c.user_id
)
INSERT INTO public.event_lineups (
  cosplay_plan_id,
  event_id,
  user_id,
  created_at
)
SELECT
  r.resolved_plan_id,
  r.event_id,
  r.user_id,
  COALESCE(r.registered_at, NOW())
FROM resolved r
WHERE r.resolved_plan_id IS NOT NULL
ON CONFLICT (cosplay_plan_id, event_id) DO NOTHING;


-- ── Vérification post-INSERT ─────────────────────────────────

SELECT 'event_lineups après backfill' AS label, count(*) AS total
FROM public.event_lineups;

SELECT
  CASE
    WHEN COALESCE(ev.end_date, ev.date) >= CURRENT_DATE THEN 'upcoming'
    ELSE 'past'
  END AS temporal_bucket,
  count(*) AS nb
FROM public.event_lineups el
JOIN public.events ev ON ev.id = el.event_id
GROUP BY temporal_bucket
ORDER BY temporal_bucket;
