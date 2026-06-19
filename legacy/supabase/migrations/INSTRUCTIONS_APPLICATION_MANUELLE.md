# 🚨 APPLICATION MANUELLE DES MIGRATIONS (URGENT)

## ⚠️ Le CLI Supabase n'est pas installé sur ce système

Tu dois appliquer les migrations **manuellement via le Dashboard Supabase**.

---

## 📋 ÉTAPES À SUIVRE (5 minutes)

### 1️⃣ Ouvrir Supabase Dashboard

1. Va sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Connecte-toi avec ton compte
3. Sélectionne le projet **Manga Paradise**

---

### 2️⃣ Accéder au SQL Editor

1. Dans le menu latéral gauche, clique sur **"SQL Editor"**
2. Clique sur **"New Query"** (bouton en haut à droite)

---

### 3️⃣ Appliquer la Migration 1 : contest_config

1. **Ouvre le fichier** : `supabase/migrations/APPLY_CONTEST_CONFIG_COLUMN.sql`
2. **Copie TOUT le contenu** du fichier (Cmd+A puis Cmd+C)
3. **Colle** dans l'éditeur SQL du Dashboard
4. **Clique sur "Run"** (ou appuie sur Cmd+Enter)
5. ✅ **Vérifie** que tu vois un message de succès (pas d'erreur rouge)

---

### 4️⃣ Appliquer la Migration 2 : contest_registrations ⭐ **PRINCIPAL**

1. **Ouvre le fichier** : `supabase/migrations/APPLY_CONTEST_REGISTRATIONS_COMPLETE.sql`
2. **Copie TOUT le contenu** du fichier (Cmd+A puis Cmd+C)
3. **Colle** dans l'éditeur SQL du Dashboard (nouvelle query)
4. **Clique sur "Run"** (ou appuie sur Cmd+Enter)
5. ✅ **Vérifie** que tu vois un message de succès

---

### 5️⃣ Vérification Finale

Dans le SQL Editor, exécute cette requête de vérification :

\`\`\`sql
-- Vérifier que la table existe
SELECT * FROM public.contest_registrations LIMIT 1;

-- Vérifier les colonnes
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'contest_registrations'
ORDER BY ordinal_position;
\`\`\`

**Résultat attendu :**
- Pas d'erreur "table does not exist"
- Liste des colonnes incluant `media_type`, `media_link`, `guardian_phone`, `guardian_email`

---

### 6️⃣ Tester l'Application

1. Retourne sur l'application Manga Paradise
2. Va sur un événement avec un concours cosplay
3. Clique sur **"M'inscrire au Concours"**
4. Remplis le formulaire en 4 étapes
5. Clique sur **"Confirmer l'inscription"**

**Résultat attendu :**
- ✅ Message de succès : "🎉 Inscription envoyée !"
- ✅ Pas d'erreur "Could not find the table"

---

## 🔧 En cas d'erreur

### Erreur : "relation already exists"
La table existe déjà. Exécute d'abord :
\`\`\`sql
DROP TABLE IF EXISTS public.contest_registrations CASCADE;
\`\`\`
Puis réapplique `APPLY_CONTEST_REGISTRATIONS_COMPLETE.sql`.

### Erreur : "permission denied"
Tu n'as pas les droits admin sur le projet. Vérifie que tu es connecté avec le bon compte.

### Erreur : "column already exists"
La colonne `contest_config` existe déjà. Ignore la migration 1 et passe directement à la migration 2.

---

## 📞 Besoin d'aide ?

Si tu rencontres un problème, envoie-moi :
1. Le message d'erreur exact (copie-colle)
2. Une capture d'écran du SQL Editor avec l'erreur

---

## ⏱️ Temps estimé : **5 minutes**

Une fois les migrations appliquées, l'inscription au concours cosplay fonctionnera immédiatement.
