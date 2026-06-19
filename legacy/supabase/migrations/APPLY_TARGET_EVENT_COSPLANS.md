# Migration : Ajout du champ target_event_id aux cosplans

## Objectif
Ajouter la possibilité de lier un projet cosplay à un événement cible spécifique.

## Instructions d'application

### Option 1 : Via Supabase Dashboard (Recommandé)
1. Ouvrir le Dashboard Supabase : https://supabase.com/dashboard
2. Sélectionner votre projet
3. Aller dans **SQL Editor**
4. Copier-coller le contenu du fichier `20260224_add_target_event_to_cosplans.sql`
5. Cliquer sur **Run**

### Option 2 : Via CLI Supabase (si configuré)
```bash
npx supabase db push
```

## Vérification
Après l'application, vérifier que :
- La colonne `target_event_id` existe dans la table `cosplay_plans`
- L'index `idx_cosplay_plans_target_event_id` a été créé
- La foreign key vers `events(id)` est active

## Rollback (si nécessaire)
```sql
DROP INDEX IF EXISTS idx_cosplay_plans_target_event_id;
ALTER TABLE cosplay_plans DROP COLUMN IF EXISTS target_event_id;
```

## Impact
- ✅ Aucun impact sur les données existantes (colonne nullable)
- ✅ Permet de lier un cosplay à un événement
- ✅ La deadline peut être automatiquement synchronisée avec la date de l'événement
