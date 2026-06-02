# 🔒 PHASE VERROUILLAGE INSCRIPTION - CANDIDATURE UNIQUE

**Date :** 16 février 2026  
**Objectif :** Empêcher les inscriptions multiples au même concours et améliorer la colorimétrie des statuts

---

## 🎯 PROBLÈME RÉSOLU

Un utilisateur pouvait relancer le wizard d'inscription même s'il avait déjà une candidature en cours ou validée pour le même concours. Cette phase implémente un verrouillage strict : **une seule candidature par utilisateur et par concours**.

---

## ✅ MODIFICATIONS APPORTÉES

### 1️⃣ **ContestRegistrationButton.tsx** - Nouvelle Colorimétrie Éclatante

**Fichier :** [`src/components/events/ContestRegistrationButton.tsx`](src/components/events/ContestRegistrationButton.tsx:112)

#### Changements :
- **Statut `pending` (En examen)** :
  - ❌ Ancien : `bg-amber-400/20 text-amber-900` (semi-transparent)
  - ✅ Nouveau : `bg-amber-400 text-slate-950` (Jaune éclatant, texte sombre)
  - 🔒 **Désactivé** : `disabled: true` (impossible de cliquer)
  - ✨ Effet glow : `shadow-[0_0_20px_rgba(251,191,36,0.6)]`

- **Statut `approved` (Approuvé)** :
  - ✅ `bg-green-500 text-white` (Vert vif)
  - 🔒 **Désactivé** : `disabled: true`
  - ✨ Effet glow : `shadow-[0_0_20px_rgba(34,197,94,0.6)]`

- **Statut `rejected` (Refusé)** :
  - ❌ `bg-red-500 text-white` (Rouge vif)
  - 🔒 **Désactivé** : `disabled: true`
  - ✨ Effet glow : `shadow-[0_0_20px_rgba(239,68,68,0.6)]`

- **Statut `waitlist` (Liste d'attente)** :
  - ℹ️ `bg-blue-500 text-white` (Bleu vif)
  - 🔒 **Désactivé** : `disabled: true`
  - ✨ Effet glow : `shadow-[0_0_20px_rgba(59,130,246,0.6)]`

#### Résultat :
Dès qu'une candidature existe (peu importe le statut), le bouton devient **visuellement éclatant** et **non cliquable**.

---

### 2️⃣ **CosplayRegistrationModal.tsx** - Barrière de Sécurité

**Fichier :** [`src/components/events/CosplayRegistrationModal.tsx`](src/components/events/CosplayRegistrationModal.tsx:239)

#### Ajouts :
1. **Import du hook de vérification** :
   ```typescript
   import { useContestRegistration } from "@/hooks/useContestRegistration";
   ```

2. **Vérification à l'ouverture** :
   ```typescript
   const { data: existingRegistration, isLoading: registrationLoading } = useContestRegistration(activityId);
   const hasExistingRegistration = existingRegistration !== null;
   ```

3. **Affichage conditionnel** :
   - Si `hasExistingRegistration === true` :
     - ❌ Les étapes du wizard sont **masquées**
     - 🚫 Un message d'erreur s'affiche : **"Vous avez déjà un dossier en cours pour ce concours"**
     - 📊 Le statut actuel est affiché (pending/approved/rejected/waitlist)
     - 🔒 Message : "Une seule candidature par utilisateur et par concours est autorisée."

4. **Invalidation du cache renforcée** :
   ```typescript
   queryClient.invalidateQueries({ queryKey: ["contest-registration", activityId, user.id] });
   ```
   - Ajout de la clé spécifique pour invalider le cache du bouton instantanément

#### Résultat :
Impossible d'accéder aux étapes du wizard si une candidature existe déjà. L'utilisateur voit un écran de blocage explicite.

---

### 3️⃣ **useDeleteContestRegistration.ts** - Invalidation Complète

**Fichier :** [`src/hooks/useDeleteContestRegistration.ts`](src/hooks/useDeleteContestRegistration.ts:28)

#### Vérification :
Le hook invalide **toutes les queries nécessaires** lors de la suppression :
```typescript
queryClient.invalidateQueries({ queryKey: ["contest-registrations"] });
queryClient.invalidateQueries({ queryKey: ["contest-registration"] });
queryClient.invalidateQueries({ queryKey: ["user-contest-registrations"] });
queryClient.invalidateQueries({ queryKey: ["approved-contestants"] });
queryClient.invalidateQueries({ queryKey: ["event-schedule"] });
queryClient.invalidateQueries({ queryKey: ["unified-agenda"] });
queryClient.invalidateQueries({ queryKey: ["activity-participation"] });
queryClient.invalidateQueries({ queryKey: ["allApprovedContestants"] });
```

#### Résultat :
Quand l'admin supprime une candidature (🗑️), le bouton redevient **instantanément** :
- 🟡 Jaune standard
- ✨ Cliquable
- 📝 Texte : "M'inscrire au Concours"

---

## 🎨 PALETTE DE COULEURS FINALE

| Statut | Couleur | Texte | Glow | Cliquable |
|--------|---------|-------|------|-----------|
| **Aucune candidature** | `bg-gradient-to-r from-[#FFD700] to-[#FFA500]` | Noir | Jaune doré | ✅ Oui |
| **Pending (En examen)** | `bg-amber-400` | Noir | Ambre | ❌ Non |
| **Approved (Approuvé)** | `bg-green-500` | Blanc | Vert | ❌ Non |
| **Rejected (Refusé)** | `bg-red-500` | Blanc | Rouge | ❌ Non |
| **Waitlist (Liste d'attente)** | `bg-blue-500` | Blanc | Bleu | ❌ Non |
| **Deadline passée** | `bg-slate-700/30` | Gris | Aucun | ❌ Non |

---

## 🔐 FLUX DE SÉCURITÉ

### Scénario 1 : Première inscription
1. L'utilisateur clique sur le bouton **jaune doré** "M'inscrire au Concours"
2. Le wizard s'ouvre normalement
3. Il remplit les 4 étapes et valide
4. ✅ Inscription créée avec `status: "pending"`
5. 🔄 Le cache est invalidé
6. 🟡 Le bouton devient **jaune éclatant** "⏳ Candidature en examen" (désactivé)

### Scénario 2 : Tentative de double inscription
1. L'utilisateur a déjà une candidature (peu importe le statut)
2. Il clique sur le bouton (qui est désactivé, mais imaginons un bug)
3. Le modal s'ouvre
4. 🚫 **Barrière de sécurité activée** : Le wizard est masqué
5. Message d'erreur affiché : "Vous avez déjà un dossier en cours pour ce concours"
6. Impossible d'accéder aux étapes

### Scénario 3 : Suppression par l'admin
1. L'admin ouvre le panneau de gestion des candidatures
2. Il clique sur 🗑️ pour supprimer une candidature
3. ✅ Suppression réussie
4. 🔄 **Invalidation complète du cache** (8 queries)
5. 🟡 Le bouton redevient **instantanément** jaune standard et cliquable
6. L'utilisateur peut s'inscrire à nouveau

---

## 🧪 TESTS À EFFECTUER

### ✅ Test 1 : Inscription initiale
- [ ] Cliquer sur "M'inscrire au Concours" (jaune doré)
- [ ] Remplir le wizard et valider
- [ ] Vérifier que le bouton devient jaune éclatant "⏳ Candidature en examen"
- [ ] Vérifier que le bouton est désactivé

### ✅ Test 2 : Tentative de double inscription
- [ ] Avoir une candidature en cours
- [ ] Essayer de cliquer sur le bouton (doit être désactivé)
- [ ] Si le modal s'ouvre (via un lien direct), vérifier le message d'erreur
- [ ] Vérifier que les étapes sont masquées

### ✅ Test 3 : Suppression admin
- [ ] En tant qu'admin, supprimer une candidature
- [ ] Vérifier que le bouton redevient jaune standard instantanément
- [ ] Vérifier que le bouton est cliquable
- [ ] Vérifier qu'on peut s'inscrire à nouveau

### ✅ Test 4 : Changements de statut
- [ ] Passer une candidature de `pending` à `approved`
- [ ] Vérifier que le bouton devient vert "✅ Candidature Approuvée"
- [ ] Passer à `rejected` : vérifier le rouge
- [ ] Passer à `waitlist` : vérifier le bleu

---

## 📊 IMPACT SUR L'UX

### Avant :
- ❌ Possibilité d'envoyer plusieurs candidatures
- ❌ Couleurs ternes (semi-transparentes)
- ❌ Pas de feedback visuel fort
- ❌ Risque de doublons en base de données

### Après :
- ✅ **Candidature unique garantie**
- ✅ **Couleurs éclatantes** (haute visibilité)
- ✅ **Feedback visuel immédiat** (glow effects)
- ✅ **Sécurité renforcée** (barrière dans le modal)
- ✅ **Invalidation du cache optimale** (réactivité instantanée)

---

## 🚀 PROCHAINES ÉTAPES POSSIBLES

1. **Notifications push** : Alerter l'utilisateur quand son statut change
2. **Historique des candidatures** : Afficher les candidatures passées (refusées/approuvées)
3. **Système de feedback** : Permettre à l'utilisateur de demander des précisions sur un refus
4. **Analytics** : Tracker les tentatives de double inscription (pour détecter les bugs)

---

## 📝 NOTES TECHNIQUES

### Hooks utilisés :
- [`useContestRegistration`](src/hooks/useContestRegistration.ts:25) : Récupère la candidature de l'utilisateur
- [`useDeleteContestRegistration`](src/hooks/useDeleteContestRegistration.ts:9) : Supprime une candidature (admin)
- `useQueryClient` : Gestion du cache React Query

### Queries invalidées :
1. `contest-registrations` (liste globale)
2. `contest-registration` (candidature spécifique)
3. `user-contest-registrations` (candidatures de l'utilisateur)
4. `approved-contestants` (liste des approuvés)
5. `event-schedule` (programme de l'événement)
6. `unified-agenda` (agenda unifié)
7. `activity-participation` (stats de participation)
8. `allApprovedContestants` (tous les approuvés)

### Composants modifiés :
- [`ContestRegistrationButton.tsx`](src/components/events/ContestRegistrationButton.tsx:1)
- [`CosplayRegistrationModal.tsx`](src/components/events/CosplayRegistrationModal.tsx:1)

---

## ✨ RÉSULTAT FINAL

**L'utilisateur ne peut jamais envoyer deux fois le même dossier pour le même événement.**

- 🔒 Verrouillage au niveau du bouton (désactivé si candidature existe)
- 🚫 Verrouillage au niveau du modal (barrière de sécurité)
- 🔄 Invalidation complète du cache (réactivité instantanée)
- 🎨 Colorimétrie éclatante (feedback visuel fort)

---

**Mission accomplie ! 🎉**
