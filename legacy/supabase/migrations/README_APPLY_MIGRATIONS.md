# 🚀 Guide d'Application des Migrations Contest Cosplay

## ⚠️ Problème Actuel
L'erreur `Could not find the table 'public.contest_registrations' in the schema cache` indique que les migrations SQL n'ont pas été appliquées à la base de données Supabase.

## 📋 Migrations à Appliquer

### 1️⃣ **APPLY_CONTEST_CONFIG_COLUMN.sql** (Optionnel si déjà fait)
Ajoute la colonne `contest_config` à la table `event_schedule`.

### 2️⃣ **APPLY_CONTEST_REGISTRATIONS_COMPLETE.sql** (OBLIGATOIRE)
Crée la table `contest_registrations` avec toutes les colonnes nécessaires :
- `media_type` (audio, video, link)
- `media_link` (pour YouTube/Vimeo)
- `guardian_phone`, `guardian_email` (autorisation parentale)
- Politiques RLS configurées

---

## 🛠️ Instructions d'Application

### Méthode 1 : Via Supabase Dashboard (Recommandé)

1. **Ouvrir Supabase Dashboard**
   - Aller sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Sélectionner votre projet

2. **Accéder au SQL Editor**
   - Menu latéral : `SQL Editor`
   - Cliquer sur `New Query`

3. **Appliquer APPLY_CONTEST_CONFIG_COLUMN.sql**
   - Copier le contenu du fichier `APPLY_CONTEST_CONFIG_COLUMN.sql`
   - Coller dans l'éditeur SQL
   - Cliquer sur `Run` (ou `Ctrl+Enter`)
   - ✅ Vérifier le message de succès

4. **Appliquer APPLY_CONTEST_REGISTRATIONS_COMPLETE.sql**
   - Copier le contenu du fichier `APPLY_CONTEST_REGISTRATIONS_COMPLETE.sql`
   - Coller dans l'éditeur SQL
   - Cliquer sur `Run`
   - ✅ Vérifier le message de succès

5. **Vérification**
   ```sql
   -- Vérifier que la table existe
   SELECT * FROM public.contest_registrations LIMIT 1;
   
   -- Vérifier la colonne contest_config
   SELECT id, title, contest_config 
   FROM public.event_schedule 
   WHERE type = 'contest' 
   LIMIT 5;
   ```

---

### Méthode 2 : Via CLI Supabase (Avancé)

```bash
# Se connecter au projet
supabase link --project-ref YOUR_PROJECT_REF

# Appliquer les migrations
supabase db push

# Ou appliquer manuellement
supabase db execute -f supabase/migrations/APPLY_CONTEST_CONFIG_COLUMN.sql
supabase db execute -f supabase/migrations/APPLY_CONTEST_REGISTRATIONS_COMPLETE.sql
```

---

## ✅ Vérification Post-Migration

### 1. Vérifier la structure de la table

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'contest_registrations'
ORDER BY ordinal_position;
```

### 2. Vérifier les politiques RLS

```sql
SELECT 
  policyname, 
  cmd, 
  qual
FROM pg_policies
WHERE tablename = 'contest_registrations';
```

### 3. Tester une insertion (depuis l'app)

Retourner sur l'application et tenter une inscription au concours cosplay. L'erreur devrait disparaître.

---

## 🔧 Dépannage

### Erreur : "relation already exists"
La table existe déjà. Exécuter d'abord :
```sql
DROP TABLE IF EXISTS public.contest_registrations CASCADE;
```
Puis réappliquer `APPLY_CONTEST_REGISTRATIONS_COMPLETE.sql`.

### Erreur : "permission denied"
Vérifier que vous êtes connecté avec un compte ayant les droits admin sur le projet Supabase.

### Erreur : "column already exists"
La colonne `contest_config` existe déjà. Ignorer `APPLY_CONTEST_CONFIG_COLUMN.sql` et passer directement à `APPLY_CONTEST_REGISTRATIONS_COMPLETE.sql`.

---

## 📝 Notes Importantes

- **Backup** : Supabase conserve automatiquement des backups, mais vous pouvez faire un snapshot manuel avant d'appliquer les migrations.
- **RLS** : Les politiques RLS sont configurées pour permettre aux utilisateurs authentifiés d'insérer leurs propres inscriptions.
- **Storage** : Assurez-vous que le bucket `contest-files` existe dans Supabase Storage (créé automatiquement lors du premier upload).

---

## 🎯 Résultat Attendu

Après application des migrations :
- ✅ La table `contest_registrations` existe
- ✅ Les colonnes `media_type`, `media_link`, `guardian_phone`, `guardian_email` sont présentes
- ✅ Les politiques RLS permettent l'insertion pour les utilisateurs authentifiés
- ✅ L'inscription au concours cosplay fonctionne sans erreur
