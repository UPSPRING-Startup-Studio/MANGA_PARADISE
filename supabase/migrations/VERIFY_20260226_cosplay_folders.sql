-- ============================================
-- SCRIPT DE VÉRIFICATION - Migration Cosplay Folders
-- Date: 2026-02-26
-- ============================================

-- 1. Vérifier que la table cosplay_folders existe
SELECT 
  'Table cosplay_folders' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'cosplay_folders'
    ) THEN '✅ OK'
    ELSE '❌ ERREUR: Table non trouvée'
  END as status;

-- 2. Vérifier les colonnes de cosplay_folders
SELECT 
  'Colonnes cosplay_folders' as check_name,
  string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'cosplay_folders';

-- 3. Vérifier que la colonne folder_id existe dans cosplay_plans
SELECT 
  'Colonne folder_id dans cosplay_plans' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'cosplay_plans'
      AND column_name = 'folder_id'
    ) THEN '✅ OK'
    ELSE '❌ ERREUR: Colonne non trouvée'
  END as status;

-- 4. Vérifier les contraintes de clés étrangères
SELECT 
  'Foreign Keys' as check_name,
  constraint_name,
  table_name,
  '→' as arrow,
  (
    SELECT table_name 
    FROM information_schema.table_constraints tc2
    WHERE tc2.constraint_name = tc.constraint_name
    AND tc2.constraint_type = 'UNIQUE'
  ) as references_table
FROM information_schema.table_constraints tc
WHERE constraint_type = 'FOREIGN KEY'
AND table_name IN ('cosplay_folders', 'cosplay_plans')
AND constraint_name LIKE '%folder%';

-- 5. Vérifier les indexes
SELECT 
  'Indexes' as check_name,
  indexname,
  tablename
FROM pg_indexes
WHERE schemaname = 'public'
AND (
  indexname LIKE '%folder%'
  OR tablename = 'cosplay_folders'
);

-- 6. Vérifier les politiques RLS
SELECT 
  'RLS Policies' as check_name,
  policyname,
  tablename,
  cmd as command,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'cosplay_folders';

-- 7. Vérifier que RLS est activé
SELECT 
  'RLS Enabled' as check_name,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ Activé'
    ELSE '❌ Désactivé'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'cosplay_folders';

-- 8. Vérifier les triggers
SELECT 
  'Triggers' as check_name,
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table = 'cosplay_folders';

-- 9. Test d'insertion (sera rollback)
BEGIN;
  -- Tenter d'insérer un dossier test
  INSERT INTO cosplay_folders (user_id, name, parent_id)
  VALUES (
    (SELECT id FROM auth.users LIMIT 1), -- Premier user
    'Test Folder',
    NULL
  )
  RETURNING 
    'Test Insert' as check_name,
    '✅ Insertion OK' as status,
    id,
    name;
ROLLBACK;

-- 10. Résumé final
SELECT 
  '========== RÉSUMÉ ==========' as summary,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'cosplay_folders') as table_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'cosplay_folders') as columns_count,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'cosplay_plans' AND column_name = 'folder_id') as folder_id_exists,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'cosplay_folders') as rls_policies_count,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'cosplay_folders') as indexes_count;

-- 11. Afficher la structure complète de cosplay_folders
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'cosplay_folders'
ORDER BY ordinal_position;

-- 12. Vérifier les permissions
SELECT 
  'Permissions' as check_name,
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND table_name = 'cosplay_folders'
AND grantee IN ('authenticated', 'service_role');
