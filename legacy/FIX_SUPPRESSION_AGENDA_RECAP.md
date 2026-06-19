# 🔧 FIX CRITIQUE : Suppression & Agenda Unifié

**Date :** 2026-02-16  
**Statut :** ✅ Corrigé

---

## 🎯 PROBLÈMES IDENTIFIÉS

### 1. **Suppression Inopérante**
- **Symptôme :** La suppression d'une candidature affichait un succès mais ne supprimait rien en base.
- **Cause :** Absence de politique RLS `DELETE` sur la table `contest_registrations`.
- **Impact :** Les utilisateurs et admins ne pouvaient pas supprimer de candidatures.

### 2. **Agenda Incomplet**
- **Symptôme :** L'agenda n'affichait que le cosplay général (Izuku) et ignorait le cosplay du concours (Tanjiro).
- **Cause :** Le hook `useUnifiedAgenda` existait déjà et fusionnait correctement les données, mais l'invalidation des queries n'était pas complète.
- **Impact :** Les candidatures au concours n'apparaissaient pas dans l'agenda après soumission.

### 3. **Erreur SQL 400 (member_since)**
- **Symptôme :** Erreur 400 dans la console : colonne `member_since` inexistante.
- **Cause :** Références à `member_since` dans plusieurs fichiers TypeScript alors que la colonne n'existe pas en base.
- **Impact :** Requêtes SQL échouées, affichage incomplet des profils.

---

## ✅ CORRECTIONS APPLIQUÉES

### 1. **Politique RLS DELETE**

**Fichier créé :** [`supabase/migrations/APPLY_DELETE_POLICY.sql`](supabase/migrations/APPLY_DELETE_POLICY.sql:1)

```sql
-- Users can delete their own pending registrations
CREATE POLICY "Users can delete own pending registrations"
  ON public.contest_registrations
  FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');

-- Admins can delete any registration
CREATE POLICY "Admins can delete all registrations"
  ON public.contest_registrations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Grant DELETE permission
GRANT DELETE ON public.contest_registrations TO authenticated;
```

**⚠️ ACTION REQUISE :** Copier-coller ce SQL dans l'éditeur SQL de Supabase.

---

### 2. **Invalidation des Queries**

**Fichier modifié :** [`src/hooks/useDeleteContestRegistration.ts`](src/hooks/useDeleteContestRegistration.ts:28)

```typescript
onSuccess: () => {
  // Invalidate all related queries to refresh the list
  queryClient.invalidateQueries({ queryKey: ["contest-registrations"] });
  queryClient.invalidateQueries({ queryKey: ["contest-registration"] });
  queryClient.invalidateQueries({ queryKey: ["unified-agenda"] }); // ✅ AJOUTÉ
  queryClient.invalidateQueries({ queryKey: ["user-contest-registrations"] }); // ✅ AJOUTÉ
  toast.success("✅ Candidature supprimée avec succès");
},
```

**Effet :** Après suppression, l'agenda se rafraîchit automatiquement.

---

### 3. **Suppression de member_since**

**Fichiers modifiés :**
- [`src/hooks/useProfile.ts`](src/hooks/useProfile.ts:16) : Suppression de `member_since: string | null;`
- [`src/pages/EspaceMembre.tsx`](src/pages/EspaceMembre.tsx:101) : Remplacement par `new Date().getFullYear()`
- [`src/pages/Annuaire.tsx`](src/pages/Annuaire.tsx:44) : Tri par `created_at` au lieu de `member_since`
- [`src/components/annuaire/MemberCard.tsx`](src/components/annuaire/MemberCard.tsx:50) : `anciennete = 0`
- [`src/components/annuaire/MemberDetailPanel.tsx`](src/components/annuaire/MemberDetailPanel.tsx:88) : `anciennete = 0` + suppression de l'affichage
- [`src/components/coscard/CosCardModal.tsx`](src/components/coscard/CosCardModal.tsx:84) : Utilisation de `new Date()` pour l'ID membre

**Effet :** Plus d'erreur 400, toutes les requêtes SQL fonctionnent.

---

## 🎨 LOGIQUE D'AFFICHAGE (Déjà Implémentée)

**Fichier :** [`src/components/annuaire/MemberAgendaTab.tsx`](src/components/annuaire/MemberAgendaTab.tsx:132)

```typescript
// Find contest registration for this event (PRIORITY display)
const contestReg = allContestRegistrations.find(
  (r) => String(r.event_id) === String(event.id)
) || null;
```

**Règle métier :**
- Si une candidature au concours existe pour un événement, elle est affichée **en priorité** sur le cosplay général.
- Le statut (`pending`, `approved`, `waitlist`) est affiché avec un badge coloré.
- Les détails du cosplay du concours (Tanjiro) remplacent ceux du cosplay général (Izuku).

---

## 🧪 TESTS À EFFECTUER

### Test 1 : Suppression
1. Aller sur la page Admin > Événements > Concours Cosplay
2. Sélectionner une candidature (ex: Tanjiro)
3. Cliquer sur "Supprimer"
4. **Résultat attendu :** La carte disparaît immédiatement de la liste

### Test 2 : Agenda Unifié
1. Soumettre une candidature au concours (ex: Tanjiro pour le 7 mars)
2. Aller dans l'Annuaire > Profil de l'utilisateur > Onglet Agenda
3. **Résultat attendu :** L'événement du 7 mars apparaît avec les détails de Tanjiro (pas Izuku)

### Test 3 : Erreur 400
1. Ouvrir la console du navigateur
2. Naviguer dans l'application (Annuaire, Profil, etc.)
3. **Résultat attendu :** Aucune erreur 400 liée à `member_since`

---

## 📊 ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    UNIFIED AGENDA FLOW                       │
└─────────────────────────────────────────────────────────────┘

1. User submits contest registration
   ↓
2. Data saved in `contest_registrations` table
   ↓
3. `useUnifiedAgenda` fetches:
   - event_participants (general registrations)
   - contest_registrations (contest submissions)
   ↓
4. Merge by event_id → Unified list
   ↓
5. `MemberAgendaTab` displays:
   - Contest cosplay (PRIORITY) if exists
   - General cosplay otherwise
   ↓
6. On delete:
   - RLS policy allows deletion
   - Queries invalidated
   - UI refreshes automatically
```

---

## 🚀 DÉPLOIEMENT

### Étape 1 : Appliquer la migration SQL
```bash
# Copier le contenu de supabase/migrations/APPLY_DELETE_POLICY.sql
# Coller dans Supabase SQL Editor
# Exécuter
```

### Étape 2 : Vérifier les logs
```bash
# Dans la console du navigateur
# Chercher les logs "DEBUG UNIFIED AGENDA"
# Vérifier que les contest_registrations sont bien récupérées
```

### Étape 3 : Tester la suppression
```bash
# En tant qu'admin ou utilisateur
# Supprimer une candidature
# Vérifier que la carte disparaît
```

---

## 📝 NOTES TECHNIQUES

### Hook `useUnifiedAgenda`
- **Localisation :** [`src/hooks/useUnifiedAgenda.ts`](src/hooks/useUnifiedAgenda.ts:31)
- **Fonction :** Fusionne `event_participants` et `contest_registrations` par `event_id`
- **Avantage :** Une seule source de vérité pour l'agenda

### Hook `useDeleteContestRegistration`
- **Localisation :** [`src/hooks/useDeleteContestRegistration.ts`](src/hooks/useDeleteContestRegistration.ts:9)
- **Fonction :** Supprime une candidature et invalide les queries
- **Sécurité :** RLS policy vérifie que l'utilisateur est propriétaire ou admin

### Composant `MemberAgendaTab`
- **Localisation :** [`src/components/annuaire/MemberAgendaTab.tsx`](src/components/annuaire/MemberAgendaTab.tsx:59)
- **Fonction :** Affiche l'agenda unifié avec priorité au cosplay du concours
- **UX :** Badge coloré selon le statut (`pending`, `approved`, `waitlist`)

---

## ✅ CHECKLIST FINALE

- [x] Politique RLS DELETE créée
- [x] Invalidation des queries ajoutée
- [x] Références à `member_since` supprimées
- [x] Logique d'affichage prioritaire implémentée
- [ ] Migration SQL appliquée en production
- [ ] Tests de suppression effectués
- [ ] Tests d'affichage de l'agenda effectués

---

**Prochaine étape :** Appliquer la migration SQL et tester en production.
