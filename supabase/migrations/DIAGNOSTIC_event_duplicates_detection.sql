-- ============================================================
-- DIAGNOSTIC – Détection de doublons potentiels dans events
--
-- Ce script est en lecture seule (SELECT uniquement).
-- Il ne modifie aucune donnée.
-- À exécuter manuellement dans le SQL Editor de Supabase.
-- ============================================================


-- ────────────────────────────────────────────────
-- 1. CLUSTERS PAR NOM NORMALISÉ (fuzzy simple)
--
-- Normalise les titres en :
--   - minuscule
--   - suppression des chiffres isolés (années : 2024, 2025, 2026…)
--   - suppression des espaces multiples
--   - trim
--
-- Regroupe les events dont le titre normalisé est identique.
-- ────────────────────────────────────────────────

WITH normalized AS (
  SELECT
    id,
    title,
    city,
    EXTRACT(YEAR FROM COALESCE(date_debut, date::timestamptz)) AS event_year,
    COALESCE(date_debut, date::timestamptz)                     AS effective_date,
    -- Normalisation du titre
    TRIM(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          LOWER(title),
          '\b(20\d{2})\b',   -- Supprime les années 20XX
          '',
          'g'
        ),
        '\s+',               -- Réduit les espaces multiples
        ' ',
        'g'
      )
    ) AS normalized_title
  FROM public.events
),
clusters AS (
  SELECT
    normalized_title,
    COUNT(*)                                         AS nb_editions,
    ARRAY_AGG(title ORDER BY effective_date)         AS titles,
    ARRAY_AGG(city ORDER BY effective_date)           AS cities,
    ARRAY_AGG(event_year ORDER BY effective_date)     AS years,
    ARRAY_AGG(id ORDER BY effective_date)             AS event_ids
  FROM normalized
  GROUP BY normalized_title
  HAVING COUNT(*) >= 2
)
SELECT
  normalized_title   AS "nom_normalisé",
  nb_editions        AS "nb_events",
  titles             AS "titres_originaux",
  cities             AS "villes",
  years              AS "années",
  event_ids          AS "ids"
FROM clusters
ORDER BY nb_editions DESC, normalized_title;


-- ────────────────────────────────────────────────
-- 2. CLUSTERS PAR NOM NORMALISÉ + VILLE
--
-- Plus strict : regroupe uniquement les events dont
-- le titre normalisé ET la ville sont identiques.
-- Utile pour distinguer "Japan Expo (Paris)" de
-- "Japan Expo Sud (Marseille)".
-- ────────────────────────────────────────────────

WITH normalized AS (
  SELECT
    id,
    title,
    LOWER(COALESCE(city, '')) AS norm_city,
    EXTRACT(YEAR FROM COALESCE(date_debut, date::timestamptz)) AS event_year,
    COALESCE(date_debut, date::timestamptz)                     AS effective_date,
    TRIM(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          LOWER(title),
          '\b(20\d{2})\b',
          '',
          'g'
        ),
        '\s+',
        ' ',
        'g'
      )
    ) AS normalized_title
  FROM public.events
),
clusters AS (
  SELECT
    normalized_title,
    norm_city,
    COUNT(*)                                         AS nb_editions,
    ARRAY_AGG(title ORDER BY effective_date)         AS titles,
    ARRAY_AGG(event_year ORDER BY effective_date)     AS years,
    ARRAY_AGG(id ORDER BY effective_date)             AS event_ids
  FROM normalized
  GROUP BY normalized_title, norm_city
  HAVING COUNT(*) >= 2
)
SELECT
  normalized_title   AS "nom_normalisé",
  norm_city           AS "ville",
  nb_editions        AS "nb_events",
  titles             AS "titres_originaux",
  years              AS "années",
  event_ids          AS "ids"
FROM clusters
ORDER BY nb_editions DESC, normalized_title;


-- ────────────────────────────────────────────────
-- 3. DÉTECTION DE NOMS "PRESQUE IDENTIQUES" (trigrams)
--
-- Requiert l'extension pg_trgm (activée par défaut sur Supabase).
-- Compare chaque paire d'events et retourne celles dont
-- la similarité du titre dépasse 0.4 (seuil ajustable).
-- Limité aux 200 paires les plus similaires.
-- ────────────────────────────────────────────────

-- Activer l'extension si besoin (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

WITH event_pairs AS (
  SELECT
    a.id     AS id_a,
    a.title  AS title_a,
    a.city   AS city_a,
    b.id     AS id_b,
    b.title  AS title_b,
    b.city   AS city_b,
    SIMILARITY(LOWER(a.title), LOWER(b.title)) AS sim
  FROM public.events a
  JOIN public.events b
    ON a.id < b.id                           -- évite les doublons de paires
   AND SIMILARITY(LOWER(a.title), LOWER(b.title)) > 0.4
)
SELECT
  title_a     AS "titre_1",
  city_a      AS "ville_1",
  title_b     AS "titre_2",
  city_b      AS "ville_2",
  ROUND(sim::numeric, 3) AS "similarité",
  id_a        AS "id_1",
  id_b        AS "id_2"
FROM event_pairs
ORDER BY sim DESC
LIMIT 200;


-- ────────────────────────────────────────────────
-- 4. APERÇU event_name_manual ORPHELINS (photos)
--
-- Liste les valeurs distinctes de event_name_manual
-- dans cosplay_photos qui n'ont pas de event_id FK,
-- et leur proximité avec des titres existants dans events.
-- Aide à identifier les photos à rattacher.
-- ────────────────────────────────────────────────

WITH manual_names AS (
  SELECT DISTINCT event_name_manual
  FROM public.cosplay_photos
  WHERE event_id IS NULL
    AND event_name_manual IS NOT NULL
),
best_match AS (
  SELECT
    mn.event_name_manual,
    e.id         AS closest_event_id,
    e.title      AS closest_event_title,
    e.city       AS closest_event_city,
    SIMILARITY(LOWER(mn.event_name_manual), LOWER(e.title)) AS sim,
    ROW_NUMBER() OVER (
      PARTITION BY mn.event_name_manual
      ORDER BY SIMILARITY(LOWER(mn.event_name_manual), LOWER(e.title)) DESC
    ) AS rn
  FROM manual_names mn
  CROSS JOIN public.events e
)
SELECT
  event_name_manual  AS "nom_manuel_photo",
  closest_event_title AS "event_le_plus_proche",
  closest_event_city  AS "ville_event",
  ROUND(sim::numeric, 3) AS "similarité",
  closest_event_id   AS "event_id_suggestion"
FROM best_match
WHERE rn = 1
ORDER BY sim DESC;
