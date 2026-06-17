-- ==============================================================
-- FIX CRITIQUE : Policy SELECT sur la table events
-- Version : 20260409
--
-- PROBLÈME CONSTATÉ :
--   Un utilisateur authentifié standard (membre) exécutant
--     SELECT * FROM events LIMIT 20
--   obtient 0 ligne, alors que la table contient des événements.
--   L'admin voit les événements car is_platform_admin() est true
--   dans d'autres policies ou parce qu'il a un rôle service_role.
--
-- CAUSE :
--   La policy "events_select_authenticated" (USING true) a été
--   soit non appliquée, soit droppée par une migration ultérieure.
--   Avec RLS activé et aucune policy SELECT matching, PostgreSQL
--   retourne silencieusement 0 lignes (pas d'erreur).
--
-- CORRECTIF :
--   1. Re-créer la policy SELECT pour tous les authenticated
--   2. Ajouter une policy SELECT pour anon (agenda public)
--      afin de couvrir aussi le cas où la session n'est pas
--      encore restaurée côté client (race condition auth).
-- ==============================================================

-- ── 1. S'assurer que RLS est activé ─────────────────────────
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- ── 2. Policy SELECT pour les utilisateurs authentifiés ──────
-- Supprime et recrée pour être sûr qu'elle existe avec USING(true)
DROP POLICY IF EXISTS "events_select_authenticated" ON public.events;

CREATE POLICY "events_select_authenticated"
  ON public.events
  FOR SELECT
  TO authenticated
  USING (true);

-- ── 3. Policy SELECT pour les visiteurs anonymes (anon) ──────
-- L'agenda est une page publique : même sans être connecté,
-- un visiteur doit pouvoir voir les événements à venir.
-- Cela couvre aussi le cas d'une race condition côté client
-- où la query part avant que la session JWT soit restaurée.
DROP POLICY IF EXISTS "events_select_anon" ON public.events;

CREATE POLICY "events_select_anon"
  ON public.events
  FOR SELECT
  TO anon
  USING (true);

-- ── Vérification ─────────────────────────────────────────────
-- Après application, vérifier avec :
--   SELECT policyname, cmd, roles, qual
--   FROM pg_policies
--   WHERE tablename = 'events' AND schemaname = 'public';
--
-- Résultat attendu (au minimum) :
--   events_select_authenticated | SELECT | {authenticated} | true
--   events_select_anon          | SELECT | {anon}          | true
