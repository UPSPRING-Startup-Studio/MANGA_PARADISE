-- ==============================================================
-- AUDIT DIAGNOSTIC — Tables lineup (lecture seule)
-- Aucun CREATE, ALTER, DROP, INSERT, UPDATE, DELETE.
-- À exécuter dans le SQL Editor de Supabase.
-- ==============================================================


-- ═══════════════════════════════════════════════════════════════
-- 1. EXISTENCE DES TABLES
-- ═══════════════════════════════════════════════════════════════

SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('cosplay_lineups', 'event_lineups', 'event_cosplay_lineups')
ORDER BY table_name;


-- ═══════════════════════════════════════════════════════════════
-- 2. COLONNES EXACTES (types, nullability, defaults)
-- ═══════════════════════════════════════════════════════════════

SELECT
  table_name,
  column_name,
  ordinal_position,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('cosplay_lineups', 'event_lineups', 'event_cosplay_lineups')
ORDER BY table_name, ordinal_position;


-- ═══════════════════════════════════════════════════════════════
-- 3a. PRIMARY KEYS
-- ═══════════════════════════════════════════════════════════════

SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON  kcu.constraint_name = tc.constraint_name
  AND kcu.table_schema    = tc.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('cosplay_lineups', 'event_lineups', 'event_cosplay_lineups')
  AND tc.constraint_type = 'PRIMARY KEY'
ORDER BY tc.table_name;


-- ═══════════════════════════════════════════════════════════════
-- 3b. FOREIGN KEYS
-- ═══════════════════════════════════════════════════════════════

SELECT
  tc.table_name       AS source_table,
  kcu.column_name     AS source_column,
  tc.constraint_name,
  ccu.table_name      AS referenced_table,
  ccu.column_name     AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON  kcu.constraint_name = tc.constraint_name
  AND kcu.table_schema    = tc.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON  ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema    = tc.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('cosplay_lineups', 'event_lineups', 'event_cosplay_lineups')
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;


-- ═══════════════════════════════════════════════════════════════
-- 3c. UNIQUE CONSTRAINTS
-- ═══════════════════════════════════════════════════════════════

SELECT
  tc.table_name,
  tc.constraint_name,
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON  kcu.constraint_name = tc.constraint_name
  AND kcu.table_schema    = tc.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('cosplay_lineups', 'event_lineups', 'event_cosplay_lineups')
  AND tc.constraint_type = 'UNIQUE'
GROUP BY tc.table_name, tc.constraint_name
ORDER BY tc.table_name;


-- ═══════════════════════════════════════════════════════════════
-- 3d. CHECK CONSTRAINTS
-- ═══════════════════════════════════════════════════════════════

SELECT
  con.conname         AS constraint_name,
  rel.relname         AS table_name,
  pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
  AND rel.relname IN ('cosplay_lineups', 'event_lineups', 'event_cosplay_lineups')
  AND con.contype = 'c'
ORDER BY rel.relname, con.conname;


-- ═══════════════════════════════════════════════════════════════
-- 3e. INDEX
-- ═══════════════════════════════════════════════════════════════

SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('cosplay_lineups', 'event_lineups', 'event_cosplay_lineups')
ORDER BY tablename, indexname;


-- ═══════════════════════════════════════════════════════════════
-- 4. NOMBRE DE LIGNES PAR TABLE
-- ═══════════════════════════════════════════════════════════════

SELECT 'cosplay_lineups' AS table_name, count(*) AS row_count
FROM public.cosplay_lineups
UNION ALL
SELECT 'event_lineups', count(*)
FROM public.event_lineups
UNION ALL
SELECT 'event_cosplay_lineups', count(*)
FROM public.event_cosplay_lineups;
-- Note : si une table n'existe pas, cette requête échouera.
-- Dans ce cas, commenter la ligne correspondante et relancer.


-- ═══════════════════════════════════════════════════════════════
-- 5. EXEMPLES (5 lignes max par table)
-- ═══════════════════════════════════════════════════════════════

-- 5a. cosplay_lineups
SELECT * FROM public.cosplay_lineups LIMIT 5;

-- 5b. event_lineups
SELECT * FROM public.event_lineups LIMIT 5;

-- 5c. event_cosplay_lineups (commenter si n'existe pas)
-- SELECT * FROM public.event_cosplay_lineups LIMIT 5;


-- ═══════════════════════════════════════════════════════════════
-- 6. POLICIES RLS
-- ═══════════════════════════════════════════════════════════════

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('cosplay_lineups', 'event_lineups', 'event_cosplay_lineups')
ORDER BY tablename, cmd, policyname;


-- ═══════════════════════════════════════════════════════════════
-- 7. RLS activé ou non sur chaque table
-- ═══════════════════════════════════════════════════════════════

SELECT
  relname       AS table_name,
  relrowsecurity AS rls_enabled,
  relforcerowsecurity AS rls_forced
FROM pg_class
JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
WHERE pg_namespace.nspname = 'public'
  AND relname IN ('cosplay_lineups', 'event_lineups', 'event_cosplay_lineups')
ORDER BY relname;
