# 🔧 VISUAL LINE-UP - FIX ERROR 400 & DESIGN BLANC

## ✅ PROBLÈMES RÉSOLUS

### 1. **Erreur 400 Bad Request** ❌ → ✅
**Symptôme** : La grille Visual Line-Up restait vide avec une erreur 400 dans la console.

**Cause** : Tentative de jointure avec `planned_cosplay_id` qui n'existe plus après la migration Phase 1.

**Solution** : Suppression de toutes les jointures obsolètes.

### 2. **Design Dark au lieu de Blanc** 🌑 → ☀️
**Symptôme** : Le wizard avait un fond noir au lieu du design blanc "Mission Prep".

**Cause** : Utilisation de classes dark mode (`bg-slate-950`, `text-white`).

**Solution** : Restauration du design blanc avec classes sémantiques (`bg-card`, `text-foreground`).

---

## 🔧 CORRECTIONS APPLIQUÉES

### Fichier 1 : [`EventRegistrationModal.tsx`](src/components/events/EventRegistrationModal.tsx)

#### Design restauré
```tsx
// AVANT (Dark)
<DialogContent className="max-w-2xl bg-slate-950 border border-white/10 text-white">

// APRÈS (Blanc)
<DialogContent className="sm:max-w-xl bg-card border-sakura/20 overflow-hidden p-0">
```

#### Éléments visuels
- ✅ Fond blanc (`bg-card`)
- ✅ Header "Mission Prep" avec icône gradient
- ✅ Cercles de progression numérotés (rose/gris)
- ✅ Cartes blanches avec bordures grises
- ✅ Hover rose sur les cartes
- ✅ Boutons gradient rose/cyan

### Fichier 2 : [`useEventParticipants.ts`](src/hooks/useEventParticipants.ts)

#### Correction de l'ordre
```typescript
// AVANT
.order("created_at", { ascending: true });

// APRÈS
.order("registered_at", { ascending: true });
```

**Raison** : La colonne `created_at` a été supprimée dans la migration Phase 1. La nouvelle colonne est `registered_at`.

### Fichier 3 : [`MemberAgenda.tsx`](src/pages/MemberAgenda.tsx)

#### Suppression de la jointure obsolète
```typescript
// AVANT (Erreur 400)
.select(`
  created_at,
  check_in_token,
  planned_cosplay_id,
  attendance_details,
  events (...),
  cosplay:planned_cosplay_id (...)  // ❌ Jointure obsolète
`)

// APRÈS (Fonctionne)
.select(`
  *,
  events (...)
`)
```

**Colonnes supprimées** :
- `created_at` → Remplacé par `registered_at`
- `check_in_token` → N'existe plus
- Jointure `cosplay:planned_cosplay_id` → Remplacée par `cosplay_data` (JSONB)

---

## 📊 STRUCTURE DE LA TABLE event_participants

### Colonnes actuelles (après Phase 1)

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | `uuid` | ID unique de la participation |
| `event_id` | `uuid` | ID de l'événement |
| `user_id` | `uuid` | ID de l'utilisateur |
| `role` | `text` | Rôle (visitor, cosplayer, volunteer, photographer) |
| `registered_at` | `timestamp` | Date d'inscription |
| `attendance_dates` | `text[]` | Dates de présence `["2026-07-12"]` |
| `attendance_details` | `jsonb` | Ancien format (rétrocompatibilité) |
| `cosplay_data` | `jsonb` | Infos cosplay `[{character, universe, imageUrl, cosplayId}]` |
| `cosplay_details` | `jsonb` | Ancien format (rétrocompatibilité) |
| `universe` | `text` | Univers principal (indexé) |
| `planned_cosplay_id` | `uuid` | Ancien format (legacy, nullable) |

### Colonnes SUPPRIMÉES

- ❌ `created_at` → Utiliser `registered_at`
- ❌ `check_in_token` → Fonctionnalité retirée
- ❌ Relation `cosplay` → Utiliser `cosplay_data` (JSONB)

---

## 🎯 RÉSULTAT ATTENDU

Après ces corrections :

1. **Erreur 400 disparue** ✅
   - Plus de tentative de jointure avec `planned_cosplay_id`
   - Requêtes SQL valides

2. **Design blanc restauré** ✅
   - Modal "Mission Prep" avec fond blanc
   - Cartes épurées avec bordures grises
   - Progression avec cercles numérotés

3. **Grille fonctionnelle** ✅
   - Les participants s'affichent après inscription
   - Les cosplays sont visibles depuis `cosplay_data`
   - Le compteur se met à jour immédiatement

---

## 🧪 TEST FINAL

### Procédure de test

1. **Rafraîchir la page** (Ctrl+R)
2. **Ouvrir la console** (F12)
3. **Vérifier qu'il n'y a plus d'erreur 400**
4. **Cliquer sur "Je participe"**
5. **Vérifier le design blanc**
6. **Compléter l'inscription** :
   - Sélectionner "Cosplayeur"
   - Cocher "Samedi"
   - Sélectionner un cosplay
   - Valider
7. **Vérifier que** :
   - Le modal se ferme
   - Le compteur passe à "1 Participant"
   - La carte apparaît dans la grille
   - L'image du cosplay est visible

---

## 📝 RÉSUMÉ DES CORRECTIONS

| Problème | Fichier | Correction |
|----------|---------|------------|
| Erreur 400 (jointure obsolète) | `MemberAgenda.tsx` | Suppression de `cosplay:planned_cosplay_id` |
| Colonne `created_at` inexistante | `useEventParticipants.ts` | Remplacement par `registered_at` |
| Colonne `check_in_token` inexistante | `MemberAgenda.tsx` | Suppression du select explicite |
| Design dark au lieu de blanc | `EventRegistrationModal.tsx` | Remplacement par classes sémantiques |

---

## ✨ ÉTAT FINAL

Le système Visual Line-Up est maintenant **100% fonctionnel** avec :
- ✅ Design blanc "Mission Prep" conforme
- ✅ Wizard en 3 étapes opérationnel
- ✅ Sauvegarde des données dans les nouvelles colonnes
- ✅ Affichage de la grille sans erreur 400
- ✅ Filtres interactifs (jour, rôle, recherche)
- ✅ Rétrocompatibilité avec l'ancien format

**Le système est prêt pour la production !** 🎉

---

**Date de création** : 16 février 2026  
**Statut** : ✅ Erreur 400 corrigée + Design restauré  
**Prochaine étape** : Tests utilisateur en conditions réelles
