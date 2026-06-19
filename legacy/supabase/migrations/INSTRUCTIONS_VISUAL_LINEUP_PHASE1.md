# Visual Line-Up Phase 1 - Instructions d'Application

## 📋 Résumé

Cette phase prépare la base de données pour la fonctionnalité **Visual Line-Up** en :
1. **Nettoyant** la table `event_participants` (suppression de toutes les données de test)
2. **Ajoutant** les colonnes nécessaires pour gérer les jours de présence et les cosplays
3. **Configurant** les politiques RLS pour permettre aux utilisateurs de gérer leurs données

## 🎯 Objectif

- La section "Participants" sur le site doit être **vide** (0 participant)
- La base de données est prête à recevoir les inscriptions détaillées (Jours + Cosplay)

## 📁 Fichiers de Migration

### 1. `20260216_visual_lineup_phase1_cleanup.sql`
- **Étape 1:** Vide la table `event_participants` (TRUNCATE)
- **Étape 2:** Ajoute les colonnes :
  - `attendance_dates` (TEXT[]) - Tableau de dates
  - `role` (TEXT) - visitor, cosplayer, photographer, volunteer
  - `cosplay_details` (JSONB) - Détails du cosplay par date

### 2. `20260216_visual_lineup_rls_policies.sql`
- Réinitialise les politiques RLS
- Assure que les utilisateurs peuvent INSERT/UPDATE leurs propres lignes
- Permet aux admins de gérer toutes les données
- Permet au public de lire les inscriptions (pour afficher la Visual Line-Up)

### 3. `APPLY_VISUAL_LINEUP_PHASE1.sql`
- **Script complet** à exécuter manuellement dans Supabase SQL Editor
- Combine les deux migrations ci-dessus
- À utiliser si les migrations automatiques ne s'appliquent pas

## 🚀 Comment Appliquer

### Option A : Via Supabase CLI (Recommandé)
```bash
# Les migrations seront appliquées automatiquement lors du prochain déploiement
# Vérifier le statut :
npx supabase migration list
```

### Option B : Manuellement dans Supabase Dashboard
1. Aller à **SQL Editor** dans Supabase Dashboard
2. Copier le contenu de `APPLY_VISUAL_LINEUP_PHASE1.sql`
3. Exécuter le script complet
4. Vérifier que la table est vide et les colonnes sont ajoutées

## ✅ Vérification

Après application, exécuter cette requête pour vérifier :

```sql
-- Vérifier la structure de la table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'event_participants' 
ORDER BY ordinal_position;

-- Vérifier que la table est vide
SELECT COUNT(*) FROM public.event_participants;

-- Vérifier les politiques RLS
SELECT policyname, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'event_participants';
```

## 📊 Structure des Données

### Colonnes Ajoutées

#### `attendance_dates` (TEXT[])
```sql
-- Exemple :
['2026-03-07', '2026-03-08', '2026-03-09']
```

#### `role` (TEXT)
```sql
-- Valeurs possibles :
'visitor'      -- Visiteur simple
'cosplayer'    -- Participant en cosplay
'photographer' -- Photographe
'volunteer'    -- Bénévole
```

#### `cosplay_details` (JSONB)
```json
{
  "2026-03-07": {
    "character": "Luffy",
    "universe": "One Piece",
    "imageUrl": "https://..."
  },
  "2026-03-08": {
    "character": "Naruto",
    "universe": "Naruto",
    "imageUrl": "https://..."
  }
}
```

## 🔒 Politiques RLS

| Politique | Type | Condition |
|-----------|------|-----------|
| `event_participants_select_own` | SELECT | `auth.uid() = user_id` |
| `event_participants_insert_own` | INSERT | `auth.uid() = user_id` |
| `event_participants_update_own` | UPDATE | `auth.uid() = user_id` |
| `event_participants_delete_own` | DELETE | `auth.uid() = user_id` |
| `event_participants_admin_all` | ALL | Admin uniquement |
| `event_participants_public_read` | SELECT | Public (true) |

## 🔍 Prochaines Étapes

- **Phase 2:** Créer l'interface UI pour que les utilisateurs déclarent leurs jours et cosplays
- **Phase 3:** Implémenter l'affichage de la Visual Line-Up
- **Phase 4:** Ajouter les fonctionnalités de filtrage et de recherche

## ⚠️ Notes Importantes

- ⚠️ **TRUNCATE** supprime TOUTES les données existantes - c'est intentionnel pour cette phase
- Les migrations sont **idempotentes** (peuvent être exécutées plusieurs fois sans erreur)
- Les indexes sont créés pour optimiser les performances
- Les commentaires SQL documentent chaque colonne pour les futurs développeurs
