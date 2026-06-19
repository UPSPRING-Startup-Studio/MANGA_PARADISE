# 🧪 Guide de Test - Système de Dossiers Cosplay

## 📋 Prérequis

### 1. Appliquer la Migration SQL
```bash
# Option 1 : Via Supabase CLI
supabase db push

# Option 2 : Via le Dashboard Supabase
# 1. Aller sur https://supabase.com/dashboard
# 2. Sélectionner votre projet
# 3. Aller dans "SQL Editor"
# 4. Copier le contenu de supabase/migrations/20260226_create_cosplay_folders.sql
# 5. Exécuter la requête
```

### 2. Vérifier que la Migration est Appliquée
```sql
-- Dans le SQL Editor de Supabase
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'cosplay_folders';

-- Devrait retourner 1 ligne

-- Vérifier la colonne folder_id dans cosplay_plans
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cosplay_plans' 
AND column_name = 'folder_id';

-- Devrait retourner 1 ligne
```

### 3. Démarrer le Serveur de Développement
```bash
npm run dev
```

## 🧪 Scénarios de Test

### Test 1 : Accès à la Page Vestiaire
**Objectif** : Vérifier que la page se charge correctement

**Étapes :**
1. Se connecter à l'application
2. Naviguer vers `/espace-membre/vestiaire`
3. Vérifier que la page s'affiche avec :
   - Header "👘 Vestiaire Cosplay"
   - Sidebar à gauche avec "📁 Mes Dossiers"
   - Bouton "+ Créer un dossier"
   - Item "Tous mes cosplays"
   - Grille centrale (vide ou avec des cosplays existants)

**Résultat attendu :**
- ✅ Page chargée sans erreur
- ✅ Layout correct (Sidebar + Grid)
- ✅ Animations fluides au chargement

---

### Test 2 : Création d'un Dossier Racine
**Objectif** : Créer un dossier à la racine

**Étapes :**
1. Cliquer sur le bouton "+ Créer un dossier"
2. Dans le dialog, entrer "Cosplays 2026"
3. Cliquer sur "Créer"

**Résultat attendu :**
- ✅ Dialog s'ouvre avec animation
- ✅ Toast de succès "Dossier créé avec succès"
- ✅ Nouveau dossier apparaît dans la sidebar
- ✅ Icône de dossier visible
- ✅ Nom du dossier affiché correctement

---

### Test 3 : Création d'un Sous-dossier
**Objectif** : Créer un dossier enfant

**Étapes :**
1. Survoler le dossier "Cosplays 2026"
2. Cliquer sur le menu "⋮" (trois points)
3. Sélectionner "Créer un sous-dossier"
4. Entrer "Conventions"
5. Cliquer sur "Créer"

**Résultat attendu :**
- ✅ Menu contextuel s'affiche au survol
- ✅ Dialog s'ouvre
- ✅ Sous-dossier créé avec succès
- ✅ Sous-dossier apparaît indenté sous le parent
- ✅ Chevron (>) apparaît sur le dossier parent

---

### Test 4 : Expand/Collapse d'un Dossier
**Objectif** : Tester l'arborescence

**Étapes :**
1. Cliquer sur le chevron (>) du dossier "Cosplays 2026"
2. Observer l'animation
3. Cliquer à nouveau pour replier

**Résultat attendu :**
- ✅ Chevron change de (>) à (v)
- ✅ Sous-dossiers apparaissent avec animation fluide
- ✅ Indentation visuelle correcte
- ✅ Replier cache les sous-dossiers avec animation

---

### Test 5 : Sélection d'un Dossier
**Objectif** : Filtrer les cosplays par dossier

**Étapes :**
1. Cliquer sur "Tous mes cosplays"
2. Observer la grille (tous les cosplays)
3. Cliquer sur un dossier spécifique
4. Observer la grille (filtrée)

**Résultat attendu :**
- ✅ Dossier sélectionné a un fond rose néon (#FF007F/20)
- ✅ Bordure rose néon visible
- ✅ Grille se met à jour instantanément
- ✅ Compteur de projets correct
- ✅ Message "Ce dossier est vide" si aucun cosplay

---

### Test 6 : Drag & Drop - Déplacer un Cosplay
**Objectif** : Ranger un cosplay dans un dossier

**Prérequis :** Avoir au moins 1 cosplay existant

**Étapes :**
1. Sélectionner "Tous mes cosplays"
2. Cliquer et maintenir sur une carte de cosplay
3. Glisser vers un dossier dans la sidebar
4. Observer le feedback visuel
5. Relâcher sur le dossier

**Résultat attendu :**
- ✅ Carte devient semi-transparente pendant le drag
- ✅ DragOverlay apparaît (preview du cosplay)
- ✅ Dossier survolé a un glow cyan (#00F0FF)
- ✅ Toast de succès "Cosplay déplacé dans le dossier"
- ✅ Cosplay disparaît de "Tous mes cosplays"
- ✅ Cosplay apparaît dans le dossier cible

---

### Test 7 : Drag & Drop - Retour à la Racine
**Objectif** : Sortir un cosplay d'un dossier

**Étapes :**
1. Sélectionner un dossier contenant un cosplay
2. Glisser le cosplay vers "Tous mes cosplays"
3. Relâcher

**Résultat attendu :**
- ✅ "Tous mes cosplays" a un glow cyan au survol
- ✅ Toast "Cosplay déplacé vers la racine"
- ✅ Cosplay visible dans "Tous mes cosplays"
- ✅ Cosplay retiré du dossier

---

### Test 8 : Renommer un Dossier
**Objectif** : Modifier le nom d'un dossier

**Étapes :**
1. Cliquer sur le menu "⋮" d'un dossier
2. Sélectionner "Renommer"
3. Modifier le nom en "Cosplays JapanExpo 2026"
4. Appuyer sur Entrée ou cliquer "Renommer"

**Résultat attendu :**
- ✅ Dialog de renommage s'ouvre
- ✅ Nom actuel pré-rempli
- ✅ Toast "Dossier renommé avec succès"
- ✅ Nom mis à jour dans la sidebar
- ✅ Cosplays restent dans le dossier

---

### Test 9 : Supprimer un Dossier Vide
**Objectif** : Supprimer un dossier sans cosplays

**Étapes :**
1. Créer un nouveau dossier "Test Suppression"
2. Cliquer sur le menu "⋮"
3. Sélectionner "Supprimer"
4. Confirmer dans l'alerte

**Résultat attendu :**
- ✅ Confirmation demandée
- ✅ Toast "Dossier supprimé avec succès"
- ✅ Dossier disparaît de la sidebar
- ✅ Si sélectionné, retour à "Tous mes cosplays"

---

### Test 10 : Supprimer un Dossier avec Sous-dossiers
**Objectif** : Vérifier le cascade delete

**Étapes :**
1. Créer un dossier "Parent" avec un sous-dossier "Enfant"
2. Supprimer le dossier "Parent"
3. Confirmer

**Résultat attendu :**
- ✅ Message de confirmation mentionne les sous-dossiers
- ✅ Dossier parent ET enfant supprimés
- ✅ Cosplays dans ces dossiers ont `folder_id = NULL`

---

### Test 11 : Supprimer un Dossier avec Cosplays
**Objectif** : Vérifier le SET NULL

**Étapes :**
1. Déplacer un cosplay dans un dossier
2. Supprimer le dossier
3. Vérifier "Tous mes cosplays"

**Résultat attendu :**
- ✅ Dossier supprimé
- ✅ Cosplay réapparaît dans "Tous mes cosplays"
- ✅ `folder_id` du cosplay = NULL en base

---

### Test 12 : Arborescence Profonde (3+ niveaux)
**Objectif** : Tester la hiérarchie infinie

**Étapes :**
1. Créer : "2026" > "Conventions" > "JapanExpo" > "Cosplay de Groupe"
2. Expand tous les niveaux
3. Déplacer un cosplay dans le dernier niveau

**Résultat attendu :**
- ✅ Tous les niveaux créés sans erreur
- ✅ Indentation visuelle correcte (16px par niveau)
- ✅ Expand/Collapse fonctionne à tous les niveaux
- ✅ Drag & drop fonctionne sur le dernier niveau

---

### Test 13 : Responsive Design
**Objectif** : Vérifier l'affichage sur différentes tailles

**Étapes :**
1. Redimensionner la fenêtre du navigateur
2. Tester sur mobile (DevTools)

**Résultat attendu :**
- ✅ Sidebar reste à 320px (w-80)
- ✅ Grille s'adapte (1-4 colonnes selon la largeur)
- ✅ Pas de débordement horizontal
- ✅ Scroll vertical fonctionne

---

### Test 14 : Performance avec Beaucoup de Dossiers
**Objectif** : Tester avec 20+ dossiers

**Étapes :**
1. Créer 20 dossiers via l'interface
2. Créer 5 sous-dossiers dans 5 dossiers différents
3. Observer les performances

**Résultat attendu :**
- ✅ Pas de lag lors du scroll
- ✅ Animations restent fluides
- ✅ Expand/Collapse instantané
- ✅ Drag & drop réactif

---

### Test 15 : Gestion des Erreurs
**Objectif** : Tester les cas d'erreur

**Étapes :**
1. Essayer de créer un dossier avec un nom vide
2. Essayer de renommer avec un nom vide
3. Simuler une erreur réseau (DevTools Offline)

**Résultat attendu :**
- ✅ Toast d'erreur "Le nom ne peut pas être vide"
- ✅ Dialog reste ouvert
- ✅ Toast d'erreur réseau si applicable
- ✅ Pas de crash de l'application

---

## 🎨 Vérifications Visuelles

### Design System
- [ ] Dark Mode appliqué partout
- [ ] Glassmorphism (backdrop-blur-md) visible
- [ ] Accents Neon Pink (#FF007F) pour sélection
- [ ] Accents Cyan (#00F0FF) pour drag over
- [ ] Bordures blanches semi-transparentes (border-white/10)
- [ ] Glow effects sur les interactions
- [ ] Emojis présents (📁, 👘, 📚)

### Animations
- [ ] Framer Motion pour toutes les transitions
- [ ] Fade in au chargement
- [ ] Scale effect au hover des cartes
- [ ] Smooth expand/collapse
- [ ] DragOverlay fluide

### Typographie
- [ ] Titres en font-bold
- [ ] Texte blanc pour les labels
- [ ] Texte slate-400 pour les descriptions
- [ ] Tailles cohérentes (text-sm, text-lg, text-2xl)

---

## 🐛 Bugs Potentiels à Surveiller

1. **Boucle Infinie** : Dossier parent de lui-même
2. **Race Condition** : Drag & drop rapide
3. **Memory Leak** : Trop de dossiers ouverts
4. **RLS** : Accès aux dossiers d'autres utilisateurs
5. **Cascade** : Suppression ne se propage pas
6. **Null Reference** : folder_id non géré

---

## 📊 Checklist Finale

### Fonctionnalités
- [ ] Création de dossiers racine
- [ ] Création de sous-dossiers
- [ ] Renommage de dossiers
- [ ] Suppression de dossiers
- [ ] Expand/Collapse
- [ ] Sélection de dossiers
- [ ] Filtrage de la grille
- [ ] Drag & Drop vers dossier
- [ ] Drag & Drop vers racine
- [ ] Arborescence infinie

### UX/UI
- [ ] Animations fluides
- [ ] Feedback visuel constant
- [ ] Toasts pour toutes les actions
- [ ] États vides gérés
- [ ] Loading states
- [ ] Error states
- [ ] Responsive design

### Technique
- [ ] Migration SQL appliquée
- [ ] RLS configuré
- [ ] Indexes créés
- [ ] Cascade DELETE fonctionne
- [ ] SET NULL fonctionne
- [ ] Pas d'erreurs console
- [ ] Pas de warnings React

---

## 🚀 Commandes Utiles

### Vérifier les Logs Supabase
```bash
supabase logs
```

### Réinitialiser la Base (DEV ONLY)
```bash
# ATTENTION : Supprime toutes les données
supabase db reset
```

### Inspecter les Données
```sql
-- Voir tous les dossiers
SELECT * FROM cosplay_folders ORDER BY created_at DESC;

-- Voir les cosplays avec leur dossier
SELECT cp.character_name, cf.name as folder_name
FROM cosplay_plans cp
LEFT JOIN cosplay_folders cf ON cp.folder_id = cf.id;

-- Voir l'arborescence
WITH RECURSIVE folder_tree AS (
  SELECT id, name, parent_id, 0 as level
  FROM cosplay_folders
  WHERE parent_id IS NULL
  
  UNION ALL
  
  SELECT cf.id, cf.name, cf.parent_id, ft.level + 1
  FROM cosplay_folders cf
  JOIN folder_tree ft ON cf.parent_id = ft.id
)
SELECT * FROM folder_tree ORDER BY level, name;
```

---

## 📝 Rapport de Test

**Date :** _____________________  
**Testeur :** _____________________  
**Version :** _____________________  

**Tests Réussis :** _____ / 15  
**Bugs Trouvés :** _____________________  
**Notes :** _____________________

---

## ✅ Validation Finale

Une fois tous les tests passés :
1. [ ] Commit des changements
2. [ ] Push vers le repository
3. [ ] Déploiement en staging
4. [ ] Test en production
5. [ ] Documentation utilisateur
6. [ ] Annonce aux utilisateurs

**Système prêt pour la production ! 🎉**
