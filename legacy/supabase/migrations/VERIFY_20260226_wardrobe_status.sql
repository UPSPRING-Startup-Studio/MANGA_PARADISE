-- ============================================
-- SCRIPT DE VÉRIFICATION - Migration Wardrobe Status
-- Date: 2026-02-26
-- ============================================

-- 1. Vérifier que les colonnes existent dans cosplay_plans
SELECT 
  'Colonnes is_in_wardrobe et craft_type' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'cosplay_plans'
      AND column_name = 'is_in_wardrobe'
    ) THEN '✅ is_in_wardrobe OK'
    ELSE '❌ ERREUR: is_in_wardrobe non trouvée'
  END as is_in_wardrobe_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'cosplay_plans'
      AND column_name = 'craft_type'
    ) THEN '✅ craft_type OK'
    ELSE '❌ ERREUR: craft_type non trouvée'
  END as craft_type_status;

-- 2. Vérifier les types de données
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'cosplay_plans'
AND column_name IN ('is_in_wardrobe', 'craft_type')
ORDER BY column_name;

-- 3. Vérifier les indexes
SELECT 
  'Indexes' as check_name,
  indexname,
  tablename
FROM pg_indexes
WHERE schemaname = 'public'
AND (
  indexname LIKE '%wardrobe%'
  OR indexname LIKE '%craft%'
);

-- 4. Vérifier les contraintes CHECK
SELECT 
  'Contraintes CHECK' as check_name,
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_schema = 'public'
AND constraint_name LIKE '%craft%';

-- 5. Test d'insertion avec craft_type valide
BEGIN;
  INSERT INTO cosplay_plans (
    user_id, 
    character_name, 
    universe, 
    target_year, 
    progress_level, 
    status, 
    priority, 
    is_in_wardrobe,
    craft_type
  )
  VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    'Test Wardrobe',
    'Test Universe',
    2026,
    100,
    'finished',
    1,
    true,
    'handmade'
  )
  RETURNING 
    'Test Insert Wardrobe' as check_name,
    '✅ Insertion OK' as status,
    is_in_wardrobe,
    craft_type;
ROLLBACK;

-- 6. Test d'insertion avec craft_type invalide (devrait échouer)
BEGIN;
  INSERT INTO cosplay_plans (
    user_id, 
    character_name, 
    universe, 
    target_year, 
    progress_level, 
    status, 
    priority, 
    craft_type
  )
  VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    'Test Invalid',
    'Test Universe',
    2026,
    50,
    'started',
    1,
    'invalid_type'
  );
ROLLBACK;

-- 7. Vérifier les valeurs par défaut
SELECT 
  'Valeurs par défaut' as check_name,
  column_name,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'cosplay_plans'
AND column_name IN ('is_in_wardrobe', 'craft_type');

-- 8. Résumé final
SELECT 
  '========== RÉSUMÉ ==========' as summary,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'cosplay_plans' AND column_name = 'is_in_wardrobe') as is_in_wardrobe_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'cosplay_plans' AND column_name = 'craft_type') as craft_type_exists,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'cosplay_plans' AND indexname LIKE '%wardrobe%') as wardrobe_indexes,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'cosplay_plans' AND indexname LIKE '%craft%') as craft_indexes;

-- 9. Afficher les commentaires
SELECT 
  'Commentaires' as check_name,
  col_description((table_schema||'.'||table_name)::regclass, ordinal_position) as comment
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'cosplay_plans'
AND column_name IN ('is_in_wardrobe', 'craft_type')
ORDER BY column_name;
