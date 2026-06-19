# 🔧 Fix Error 23505 - Guide Rapide

## ❌ LE PROBLÈME

Vous avez cette erreur lors de l'application de la contrainte UNIQUE :

```
ERROR: could not create unique index "contest_registrations_user_event_unique"
DETAIL: Key (user_id, event_id)=(xxx, yyy) is duplicated.
```

**Cause :** Vous avez des inscriptions en double dans votre base de données (tests multiples).

---

## ✅ LA SOLUTION

### Étape 1 : Ouvrir Supabase Dashboard

1. Aller sur : https://uwzftqjhdiaytybthrnk.supabase.co
2. Cliquer sur **SQL Editor** dans le menu de gauche
3. Cliquer sur **New Query**

### Étape 2 : Copier le script de nettoyage

Ouvrir le fichier : [`supabase/migrations/CLEAN_DUPLICATES_AND_ADD_CONSTRAINT.sql`](supabase/migrations/CLEAN_DUPLICATES_AND_ADD_CONSTRAINT.sql)

**Copier TOUT le contenu** (Cmd+A / Ctrl+A puis Cmd+C / Ctrl+C)

### Étape 3 : Coller et exécuter

1. Coller le script dans l'éditeur SQL de Supabase
2. Cliquer sur **Run** (ou Cmd+Enter / Ctrl+Enter)

### Étape 4 : Vérifier les résultats

Le script affichera dans les logs :

```
🔍 Nombre de paires (user_id, event_id) en double : X
🗑️  Nombre d'inscriptions en double à supprimer : Y
✅ Contrainte UNIQUE ajoutée avec succès !
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ NETTOYAGE TERMINÉ !
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Total d'inscriptions : Z
🔑 Paires uniques (user_id, event_id) : Z
🎉 Aucun doublon détecté ! La contrainte est active.
```

---

## 🎯 CE QUE LE SCRIPT FAIT

1. **Identifie les doublons** : Trouve toutes les paires (user_id, event_id) qui apparaissent plusieurs fois
2. **Conserve le plus récent** : Garde uniquement l'inscription avec la date `created_at` la plus récente
3. **Supprime les anciennes** : Efface toutes les autres inscriptions en double
4. **Applique la contrainte** : Ajoute la contrainte UNIQUE pour empêcher les futurs doublons
5. **Vérifie** : Confirme que tout est OK

---

## 🔍 EXEMPLE CONCRET

**Avant le script :**
```
user_id  | event_id | character_name | created_at
---------|----------|----------------|-------------------
abc123   | evt001   | Luffy          | 2026-02-15 10:00
abc123   | evt001   | Zoro           | 2026-02-15 14:00  ← Plus récent
abc123   | evt001   | Nami           | 2026-02-15 12:00
```

**Après le script :**
```
user_id  | event_id | character_name | created_at
---------|----------|----------------|-------------------
abc123   | evt001   | Zoro           | 2026-02-15 14:00  ← Conservé
```

**Résultat :** L'utilisateur `abc123` n'a plus qu'une seule inscription pour l'événement `evt001` (la plus récente).

---

## ⚠️ IMPORTANT

- **Aucune donnée importante n'est perdue** : Seules les inscriptions en double sont supprimées
- **Le plus récent est conservé** : Votre dernière inscription est toujours gardée
- **Sécurité activée** : Après le script, impossible de créer des doublons

---

## 🚀 APRÈS L'EXÉCUTION

Une fois le script exécuté avec succès :

1. ✅ Tous les doublons sont supprimés
2. ✅ La contrainte UNIQUE est active
3. ✅ Le frontend affichera correctement l'état d'inscription
4. ✅ Impossible de s'inscrire deux fois au même concours

---

## 🆘 EN CAS DE PROBLÈME

Si le script échoue ou si vous avez des questions :

1. Vérifier les logs d'erreur dans Supabase
2. Copier le message d'erreur complet
3. Vérifier que vous avez les droits d'administration sur la base

---

## 📝 NOTES TECHNIQUES

**Logique de conservation :**
```sql
SELECT DISTINCT ON (user_id, event_id) id
FROM public.contest_registrations
ORDER BY user_id, event_id, created_at DESC
```

Cette requête :
- Groupe par `(user_id, event_id)`
- Trie par `created_at DESC` (plus récent en premier)
- Garde uniquement le premier résultat de chaque groupe

**Contrainte appliquée :**
```sql
ALTER TABLE public.contest_registrations
ADD CONSTRAINT contest_registrations_user_event_unique 
UNIQUE (user_id, event_id);
```

---

**Code avec passion. Ship avec confiance.** 🚀✨
