# 🔧 Fix Erreur PGRST204 - Cosplay Plans - RÉCAPITULATIF

## 🚨 Problème Initial
Lors de la soumission du formulaire "Nouveau Projet Cosplay", l'erreur Supabase suivante apparaissait :
```
code: 'PGRST204'
message: "Could not find the 'auto_progress' column of 'cosplay_plans' in the schema cache"
```

## 🔍 Diagnostic
L'erreur **PGRST204** indique que PostgREST (l'API REST de Supabase) n'a pas trouvé la colonne `auto_progress` dans son **cache de schéma**. Cela peut arriver quand :
1. La colonne n'existe pas en base de données
2. La colonne existe mais le cache PostgREST n'a pas été rafraîchi

## ✅ Solution Appliquée

### 1. **Migration SQL** : [`20260224_add_auto_progress_to_cosplans.sql`](supabase/migrations/20260224_add_auto_progress_to_cosplans.sql:1)

```sql
ALTER TABLE cosplay_plans
ADD COLUMN IF NOT EXISTS auto_progress BOOLEAN DEFAULT false NOT NULL;

COMMENT ON COLUMN cosplay_plans.auto_progress IS 'If true, progress_level is automatically calculated from completed tasks';

-- CRITICAL: Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
```

**Caractéristiques** :
- Type : `BOOLEAN`
- Valeur par défaut : `false`
- `NOT NULL` (toujours défini)
- **NOTIFY pgrst** : Force le rechargement du cache PostgREST (résout le PGRST204)

### 2. **Migration SQL** : [`20260224_add_target_event_to_cosplans.sql`](supabase/migrations/20260224_add_target_event_to_cosplans.sql:1) (Mise à jour)

Ajout du `NOTIFY pgrst` à la fin de cette migration également pour éviter les problèmes de cache avec `target_event_id`.

### 3. **Vérification TypeScript** : [`useCosplans.ts`](src/hooks/useCosplans.ts:1)

#### Interface `CosplayPlan` ✅
```typescript
export interface CosplayPlan {
  // ... autres champs
  auto_progress: boolean; // ✅ Présent
  // ...
}
```

#### Interface `CreateCosplanInput` ✅
```typescript
export interface CreateCosplanInput {
  // ... autres champs
  // auto_progress n'est PAS ici (normal, défini par défaut dans la mutation)
}
```

#### Interface `UpdateCosplanInput` ✅
```typescript
export interface UpdateCosplanInput {
  // ... autres champs
  auto_progress?: boolean; // ✅ Présent (optionnel)
}
```

#### Hook `useCreateCosplan` ✅
```typescript
const { data, error } = await supabase
  .from("cosplay_plans")
  .insert({
    user_id: userId,
    progress_level: 0,
    auto_progress: false, // ✅ Défini par défaut
    ...planData,
  })
  .select()
  .single();
```

**Tout est correct côté TypeScript !** Le payload d'insertion inclut bien `auto_progress: false` par défaut.

---

## 📦 Fichiers Créés/Modifiés

| Fichier | Type | Description |
|---------|------|-------------|
| [`supabase/migrations/20260224_add_auto_progress_to_cosplans.sql`](supabase/migrations/20260224_add_auto_progress_to_cosplans.sql:1) | Migration | Ajoute la colonne `auto_progress` + NOTIFY |
| [`supabase/migrations/20260224_add_target_event_to_cosplans.sql`](supabase/migrations/20260224_add_target_event_to_cosplans.sql:1) | Migration | Mise à jour avec NOTIFY |
| [`FIX_COSPLAN_PGRST204_RECAP.md`](FIX_COSPLAN_PGRST204_RECAP.md:1) | Doc | Ce document |

---

## 🚀 Instructions d'Application

### Étape 1 : Appliquer les migrations SQL

#### Via Supabase Dashboard (Recommandé)
1. Ouvrir https://supabase.com/dashboard
2. Sélectionner votre projet
3. Aller dans **SQL Editor**
4. **Copier-coller le contenu de `20260224_add_auto_progress_to_cosplans.sql`**
5. Cliquer sur **Run**
6. **Copier-coller le contenu de `20260224_add_target_event_to_cosplans.sql`**
7. Cliquer sur **Run**

#### Via CLI Supabase (si configuré)
```bash
npx supabase db push
```

### Étape 2 : Vérifier le cache PostgREST
Après l'application des migrations, le `NOTIFY pgrst, 'reload schema';` devrait automatiquement recharger le cache. Si l'erreur persiste :

1. **Redémarrer le projet Supabase** (via Dashboard)
2. Ou attendre quelques secondes (le cache se rafraîchit automatiquement)

### Étape 3 : Tester la création d'un projet cosplay
1. Se connecter à l'application
2. Naviguer vers la section Cosplans
3. Cliquer sur "Nouveau Projet Cosplay"
4. Remplir le formulaire (Univers, Personnage, etc.)
5. Sélectionner un événement cible (optionnel)
6. Cliquer sur "Créer le projet"
7. ✅ Le projet devrait être créé sans erreur PGRST204

---

## 🔑 Points Clés

### Pourquoi `NOTIFY pgrst, 'reload schema'` ?
PostgREST met en cache le schéma de la base de données pour des raisons de performance. Quand on ajoute une colonne, PostgREST ne le sait pas immédiatement. La commande `NOTIFY pgrst, 'reload schema';` force PostgREST à **recharger son cache** et à détecter les nouvelles colonnes.

### Pourquoi `auto_progress` n'est pas dans `CreateCosplanInput` ?
C'est une bonne pratique : `auto_progress` est toujours défini à `false` par défaut lors de la création. L'utilisateur peut le modifier ensuite via l'édition (d'où sa présence dans `UpdateCosplanInput`).

### Ordre des migrations
1. **`20260224_add_auto_progress_to_cosplans.sql`** (colonne manquante)
2. **`20260224_add_target_event_to_cosplans.sql`** (nouvelle fonctionnalité)

Les deux doivent être appliquées pour que le formulaire fonctionne correctement.

---

## ✅ Checklist de Vérification

- [x] Migration `auto_progress` créée
- [x] Migration `target_event_id` mise à jour avec NOTIFY
- [x] Types TypeScript vérifiés (CosplayPlan, CreateCosplanInput, UpdateCosplanInput)
- [x] Payload d'insertion vérifié (auto_progress: false par défaut)
- [ ] Migrations appliquées en base de données (à faire manuellement)
- [ ] Test de création d'un projet cosplay réussi

---

## 🐛 Troubleshooting

### L'erreur PGRST204 persiste après la migration
1. Vérifier que la colonne existe bien en BDD :
   ```sql
   SELECT column_name, data_type, column_default 
   FROM information_schema.columns 
   WHERE table_name = 'cosplay_plans' AND column_name = 'auto_progress';
   ```
2. Redémarrer le projet Supabase (Dashboard > Settings > Restart)
3. Vider le cache du navigateur (Ctrl+Shift+R)

### Autre erreur lors de l'insertion
Vérifier les logs de la console navigateur et les logs Supabase pour identifier le champ manquant ou invalide.

---

**Date du fix** : 24 février 2026  
**Développeur** : Kilo Code (Senior Fullstack)  
**Stack** : React + TypeScript + Supabase + PostgREST
