# 🔧 FIX CRITICAL : Événement Cible non enregistré dans Cosplan

## 🐛 Problème Identifié

Lorsqu'un utilisateur sélectionnait un "Événement cible" (ex: Cosplay Garden V4) dans la modale de création/modification d'un projet Cosplay, **la donnée n'était PAS sauvegardée en base de données**.

## 🔍 Diagnostic Pas-à-Pas

### 1. ✅ Structure Base de Données
**Fichier** : [`supabase/migrations/20260224_add_target_event_to_cosplans.sql`](supabase/migrations/20260224_add_target_event_to_cosplans.sql:1)

La colonne `target_event_id` existe bien :
```sql
ALTER TABLE cosplay_plans
ADD COLUMN IF NOT EXISTS target_event_id UUID REFERENCES events(id) ON DELETE SET NULL;
```

### 2. ✅ Formulaire Frontend
**Fichier** : [`src/components/cosplay/CosplanModal.tsx`](src/components/cosplay/CosplanModal.tsx:756)

Le Select de l'événement cible fonctionne correctement :
- Stocke l'UUID de l'événement dans `targetEventId`
- Synchronise automatiquement la date butoir avec la date de l'événement (ligne 764-767)
- Désactive le champ "Date butoir" quand un événement est sélectionné (ligne 824)

### 3. ✅ Fonction handleSubmit du Modal
**Fichier** : [`src/components/cosplay/CosplanModal.tsx`](src/components/cosplay/CosplanModal.tsx:293)

Le `target_event_id` est bien envoyé dans l'objet `onSubmit` :
```typescript
await onSubmit({
  // ...
  target_event_id: targetEventId,  // ✅ Ligne 293
  // ...
});
```

### 4. ❌ PROBLÈME TROUVÉ : handleCosplanSubmit
**Fichier** : [`src/pages/SettingsCosplayer.tsx`](src/pages/SettingsCosplayer.tsx:292)

**Le `target_event_id` n'était PAS inclus dans les données envoyées à Supabase !**

#### Avant (BUGUÉ) :
```typescript
const handleCosplanSubmit = async (data: {
  // ...
  deadline?: string | null;
  notes?: string | null;
  // ❌ target_event_id manquant dans le type
}) => {
  if (data.id) {
    // Edit mode
    await updateCosplanMutation.mutateAsync({
      // ...
      deadline: data.deadline,
      notes: data.notes,
      // ❌ target_event_id manquant ici
    });
  } else {
    // Create mode
    await createCosplanMutation.mutateAsync({
      // ...
      deadline: data.deadline,
      notes: data.notes,
      // ❌ target_event_id manquant ici aussi
    });
  }
};
```

## ✅ Solution Appliquée

**Fichier modifié** : [`src/pages/SettingsCosplayer.tsx`](src/pages/SettingsCosplayer.tsx:292)

### Changements :

1. **Ajout du type** `target_event_id` dans la signature de la fonction (ligne 304)
2. **Ajout de l'envoi** en mode édition (ligne 321)
3. **Ajout de l'envoi** en mode création (ligne 336)

#### Après (FIXÉ) :
```typescript
const handleCosplanSubmit = async (data: {
  // ...
  deadline?: string | null;
  target_event_id?: string | null;  // ✅ Ajouté
  notes?: string | null;
}) => {
  if (data.id) {
    // Edit mode
    await updateCosplanMutation.mutateAsync({
      // ...
      deadline: data.deadline,
      target_event_id: data.target_event_id,  // ✅ Ajouté
      notes: data.notes,
    });
  } else {
    // Create mode
    await createCosplanMutation.mutateAsync({
      // ...
      deadline: data.deadline,
      target_event_id: data.target_event_id,  // ✅ Ajouté
      notes: data.notes,
    });
  }
};
```

### 5. ✅ Hooks Supabase
**Fichier** : [`src/hooks/useCosplans.ts`](src/hooks/useCosplans.ts:1)

Les hooks acceptaient déjà `target_event_id` :
- Interface `CosplayPlan` (ligne 22)
- Interface `CreateCosplanInput` (ligne 39)
- Interface `UpdateCosplanInput` (ligne 54)

## 🎯 Résultat Attendu

Maintenant, quand l'utilisateur :
1. Sélectionne "Cosplay Garden V4" dans le Select
2. La date butoir se fige automatiquement sur celle de l'événement
3. Clique sur "Sauvegarder"
4. **L'ID de l'événement est bien enregistré en base de données**
5. Quand il rouvre la modale, l'événement sélectionné est bien affiché

## 📊 Fonctionnalités Complètes

### Synchronisation Date Butoir / Événement
**Fichier** : [`src/components/cosplay/CosplanModal.tsx`](src/components/cosplay/CosplanModal.tsx:758)

```typescript
onValueChange={(v) => {
  if (v === "none") {
    setTargetEventId(null);
  } else {
    setTargetEventId(v);
    // Auto-set deadline to event date
    const selectedEvent = upcomingEvents.find(e => e.id === v);
    if (selectedEvent) {
      setDeadline(parseISO(selectedEvent.date));  // ✅ Synchronisation auto
    }
  }
}}
```

### UX : Champ Date Butoir Désactivé
**Fichier** : [`src/components/cosplay/CosplanModal.tsx`](src/components/cosplay/CosplanModal.tsx:824)

```typescript
<Button
  type="button"
  variant="outline"
  disabled={!!targetEventId}  // ✅ Désactivé si événement sélectionné
  className={cn(
    "w-full justify-start text-left font-normal",
    targetEventId && "opacity-50 cursor-not-allowed"  // ✅ Style visuel
  )}
>
```

## 📝 Fichiers Modifiés

1. **FIXÉ** : [`src/pages/SettingsCosplayer.tsx`](src/pages/SettingsCosplayer.tsx:292) - Ajout de `target_event_id` dans `handleCosplanSubmit`

## 🧪 Tests à Effectuer

1. Créer un nouveau projet cosplay
2. Sélectionner un événement cible (ex: "Cosplay Garden V4")
3. Vérifier que la date butoir se met à jour automatiquement
4. Sauvegarder le projet
5. Rouvrir la modale d'édition
6. Vérifier que l'événement est toujours sélectionné
7. Vérifier en base de données que `target_event_id` contient bien l'UUID de l'événement

---

**Status** : ✅ Fix appliqué et prêt à tester
**Date** : 25/02/2026
**Développeur** : Kilo Code
