-- =====================================================
-- MIGRATION: Clean Duplicates & Add UNIQUE Constraint
-- DATE: 2026-02-16
-- DESCRIPTION: 
--   1. Identifies and removes duplicate contest registrations
--   2. Keeps only the most recent registration per (user_id, event_id)
--   3. Adds UNIQUE constraint to prevent future duplicates
-- 
-- INSTRUCTIONS:
-- 1. Ouvrir Supabase Dashboard: https://uwzftqjhdiaytybthrnk.supabase.co
-- 2. Aller dans SQL Editor
-- 3. Copier-coller ce script COMPLET et l'exécuter
-- =====================================================

-- ─────────────────────────────────────────────────────
-- ÉTAPE 1 : IDENTIFIER LES DOUBLONS
-- ─────────────────────────────────────────────────────

-- Afficher les doublons existants (pour information)
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT user_id, event_id, COUNT(*) as count
    FROM public.contest_registrations
    GROUP BY user_id, event_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  RAISE NOTICE '🔍 Nombre de paires (user_id, event_id) en double : %', duplicate_count;
END $$;

-- ─────────────────────────────────────────────────────
-- ÉTAPE 2 : SUPPRIMER LES DOUBLONS (GARDER LE PLUS RÉCENT)
-- ─────────────────────────────────────────────────────

-- Créer une table temporaire avec les IDs à conserver
CREATE TEMP TABLE registrations_to_keep AS
SELECT DISTINCT ON (user_id, event_id) id
FROM public.contest_registrations
ORDER BY user_id, event_id, created_at DESC;

-- Afficher combien d'enregistrements seront supprimés
DO $$
DECLARE
  to_delete_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO to_delete_count
  FROM public.contest_registrations
  WHERE id NOT IN (SELECT id FROM registrations_to_keep);
  
  RAISE NOTICE '🗑️  Nombre d''inscriptions en double à supprimer : %', to_delete_count;
END $$;

-- Supprimer les doublons (garder uniquement les plus récents)
DELETE FROM public.contest_registrations
WHERE id NOT IN (SELECT id FROM registrations_to_keep);

-- Nettoyer la table temporaire
DROP TABLE registrations_to_keep;

-- ─────────────────────────────────────────────────────
-- ÉTAPE 3 : AJOUTER LA CONTRAINTE UNIQUE
-- ─────────────────────────────────────────────────────

-- Vérifier si la contrainte existe déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'contest_registrations_user_event_unique'
  ) THEN
    -- Ajouter la contrainte UNIQUE
    ALTER TABLE public.contest_registrations
    ADD CONSTRAINT contest_registrations_user_event_unique 
    UNIQUE (user_id, event_id);
    
    RAISE NOTICE '✅ Contrainte UNIQUE ajoutée avec succès !';
  ELSE
    RAISE NOTICE '⚠️  La contrainte existe déjà, aucune action nécessaire.';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────
-- ÉTAPE 4 : AJOUTER UN INDEX POUR LES PERFORMANCES
-- ─────────────────────────────────────────────────────

-- Créer un index si nécessaire (améliore les requêtes)
CREATE INDEX IF NOT EXISTS idx_contest_registrations_user_event 
ON public.contest_registrations(user_id, event_id);

-- ─────────────────────────────────────────────────────
-- ÉTAPE 5 : VÉRIFICATION FINALE
-- ─────────────────────────────────────────────────────

-- Afficher le résultat final
DO $$
DECLARE
  total_registrations INTEGER;
  unique_pairs INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_registrations
  FROM public.contest_registrations;
  
  SELECT COUNT(DISTINCT (user_id, event_id)) INTO unique_pairs
  FROM public.contest_registrations;
  
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ NETTOYAGE TERMINÉ !';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '📊 Total d''inscriptions : %', total_registrations;
  RAISE NOTICE '🔑 Paires uniques (user_id, event_id) : %', unique_pairs;
  
  IF total_registrations = unique_pairs THEN
    RAISE NOTICE '🎉 Aucun doublon détecté ! La contrainte est active.';
  ELSE
    RAISE WARNING '⚠️  Attention : Il reste des doublons !';
  END IF;
END $$;

-- Afficher les contraintes actives sur la table
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.contest_registrations'::regclass
  AND conname = 'contest_registrations_user_event_unique';
