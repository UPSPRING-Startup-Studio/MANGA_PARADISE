-- ==============================================================
-- AUDIT — Backfill event_lineups depuis event_participants
-- LECTURE SEULE — Aucun INSERT, UPDATE, DELETE.
-- À exécuter dans le SQL Editor de Supabase.
-- ==============================================================


-- ═══════════════════════════════════════════════════════════════
-- 1. ÉTAT ACTUEL DE event_lineups
-- ═══════════════════════════════════════════════════════════════

SELECT 'event_lineups actuel' AS label, count(*) AS total
FROM public.event_lineups;


-- ═══════════════════════════════════════════════════════════════
-- 2. PARTICIPATIONS COSPLAYER DANS event_participants
--    (candidats potentiels au backfill)
-- ═══════════════════════════════════════════════════════════════

SELECT
  'event_participants cosplayer' AS label,
  count(*) AS total
FROM public.event_participants
WHERE role = 'cosplayer';


-- ═══════════════════════════════════════════════════════════════
-- 3. RÉSOLUTION DU cosplay_plan_id
--    Stratégie par priorité :
--    A) ep.cosplay_id (si non null — déjà un cosplay_plans.id)
--    B) cp.id via cp.source_vestiaire_id = ep.planned_cosplay_id
--    C) cp.id via cp.source_vestiaire_id = cosplay_data[0]->>'cosplayId'
-- ═══════════════════════════════════════════════════════════════

WITH candidates AS (
  SELECT
    ep.user_id,
    ep.event_id,
    ep.registered_at,
    ep.role,
    -- Stratégie A : cosplay_id direct (cosplay_plans.id)
    ep.cosplay_id AS direct_plan_id,
    -- Stratégie B : planned_cosplay_id → résoudre
    ep.planned_cosplay_id,
    -- Stratégie C : cosplay_data JSON
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
    -- Résolution finale du plan_id
    COALESCE(
      -- A) direct
      c.direct_plan_id,
      -- B) via planned_cosplay_id
      cp_b.id,
      -- C) via JSON cosplayId
      cp_c.id
    ) AS resolved_plan_id,
    -- Debug : source de résolution
    CASE
      WHEN c.direct_plan_id IS NOT NULL THEN 'A:cosplay_id'
      WHEN cp_b.id IS NOT NULL THEN 'B:planned_cosplay_id'
      WHEN cp_c.id IS NOT NULL THEN 'C:cosplay_data_json'
      ELSE 'UNRESOLVED'
    END AS resolution_source
  FROM candidates c
  LEFT JOIN public.cosplay_plans cp_b
    ON cp_b.source_vestiaire_id = c.planned_cosplay_id
    AND cp_b.user_id = c.user_id
  LEFT JOIN public.cosplay_plans cp_c
    ON cp_c.source_vestiaire_id = c.json_vestiaire_id::uuid
    AND cp_c.user_id = c.user_id
)
-- ── 3a. Comptage par source de résolution ──
SELECT resolution_source, count(*) AS nb
FROM resolved
GROUP BY resolution_source
ORDER BY resolution_source;


-- ═══════════════════════════════════════════════════════════════
-- 4. LIGNES QUI SERAIENT INSÉRÉES (preview)
--    = resolved avec plan_id non null
--      MINUS celles qui existent déjà dans event_lineups
-- ═══════════════════════════════════════════════════════════════

WITH candidates AS (
  SELECT
    ep.user_id,
    ep.event_id,
    ep.registered_at,
    ep.cosplay_id AS direct_plan_id,
    ep.planned_cosplay_id,
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
),
to_insert AS (
  SELECT
    r.user_id,
    r.event_id,
    r.resolved_plan_id,
    r.registered_at
  FROM resolved r
  WHERE r.resolved_plan_id IS NOT NULL
    -- Pas de doublon : même (cosplay_plan_id, event_id) n'existe pas déjà
    AND NOT EXISTS (
      SELECT 1 FROM public.event_lineups el
      WHERE el.cosplay_plan_id = r.resolved_plan_id
        AND el.event_id = r.event_id
    )
)
SELECT
  'lignes à insérer' AS label,
  count(*) AS total
FROM to_insert;


-- ═══════════════════════════════════════════════════════════════
-- 5. EXEMPLES CONCRETS (5 premières lignes qui seraient insérées)
-- ═══════════════════════════════════════════════════════════════

WITH candidates AS (
  SELECT
    ep.user_id,
    ep.event_id,
    ep.registered_at,
    ep.cosplay_id AS direct_plan_id,
    ep.planned_cosplay_id,
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
    ) AS resolved_plan_id,
    CASE
      WHEN c.direct_plan_id IS NOT NULL THEN 'A:cosplay_id'
      WHEN cp_b.id IS NOT NULL THEN 'B:planned_cosplay_id'
      WHEN cp_c.id IS NOT NULL THEN 'C:cosplay_data_json'
      ELSE 'UNRESOLVED'
    END AS resolution_source
  FROM candidates c
  LEFT JOIN public.cosplay_plans cp_b
    ON cp_b.source_vestiaire_id = c.planned_cosplay_id
    AND cp_b.user_id = c.user_id
  LEFT JOIN public.cosplay_plans cp_c
    ON cp_c.source_vestiaire_id = c.json_vestiaire_id::uuid
    AND cp_c.user_id = c.user_id
)
SELECT
  r.user_id,
  r.event_id,
  r.resolved_plan_id,
  r.resolution_source,
  r.registered_at,
  ev.title  AS event_title,
  ev.date   AS event_date,
  cp.character_name,
  cp.universe
FROM resolved r
JOIN public.events ev ON ev.id = r.event_id
JOIN public.cosplay_plans cp ON cp.id = r.resolved_plan_id
WHERE r.resolved_plan_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.event_lineups el
    WHERE el.cosplay_plan_id = r.resolved_plan_id
      AND el.event_id = r.event_id
  )
ORDER BY ev.date DESC
LIMIT 10;


-- ═══════════════════════════════════════════════════════════════
-- 6. RÉPARTITION TEMPORELLE (futur vs passé après backfill)
-- ═══════════════════════════════════════════════════════════════

WITH candidates AS (
  SELECT
    ep.user_id,
    ep.event_id,
    ep.cosplay_id AS direct_plan_id,
    ep.planned_cosplay_id,
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
),
all_future_lineups AS (
  -- Existing + to-be-inserted
  SELECT el.event_id FROM public.event_lineups el
  UNION ALL
  SELECT r.event_id
  FROM resolved r
  WHERE r.resolved_plan_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.event_lineups el
      WHERE el.cosplay_plan_id = r.resolved_plan_id
        AND el.event_id = r.event_id
    )
)
SELECT
  CASE
    WHEN COALESCE(ev.end_date, ev.date) >= CURRENT_DATE THEN 'upcoming'
    ELSE 'past'
  END AS temporal_bucket,
  count(*) AS nb
FROM all_future_lineups afl
JOIN public.events ev ON ev.id = afl.event_id
GROUP BY temporal_bucket
ORDER BY temporal_bucket;
