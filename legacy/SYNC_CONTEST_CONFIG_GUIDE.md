# Guide de Synchronisation - Contest Config

## 🎯 Problème Résolu

Deux interfaces modifient la même donnée (`contest_config` dans `event_schedule`) :
1. **ContestConfigModal** (Dashboard Contest Manager) - Édition rapide
2. **EventProgramForm** (Admin général) - Édition complète

**Problème initial** : Les modifications dans une interface ne se reflétaient pas dans l'autre à cause du cache React Query.

## ✅ Solution Implémentée

### 1. Invalidation du Cache React Query

**Fichier** : [`src/components/admin/ContestConfigModal.tsx`](src/components/admin/ContestConfigModal.tsx:132)

Quand la configuration est sauvegardée, on invalide **tous** les caches liés :

```typescript
onSuccess: () => {
  // Invalider tous les caches liés aux données du programme
  queryClient.invalidateQueries({ queryKey: ["contest-activities"] });
  queryClient.invalidateQueries({ queryKey: ["event-program"] });
  queryClient.invalidateQueries({ queryKey: ["event-schedule"] });
  queryClient.invalidateQueries({ queryKey: ["contest-config"] });
  // Invalider les caches de la page admin pour forcer le re-téléchargement
  queryClient.invalidateQueries({ queryKey: ["admin-events"] });
  queryClient.invalidateQueries({ queryKey: ["events"] });
  queryClient.invalidateQueries({ queryKey: ["event", activityId] });
  toast.success("Configuration du concours mise à jour et synchronisée !");
  onOpenChange(false);
}
```

### 2. Synchronisation de l'État Local - EventFormAdvanced

**Fichier** : [`src/components/admin/EventFormAdvanced.tsx`](src/components/admin/EventFormAdvanced.tsx:251)

Un `useEffect` surveille les changements dans `initialData.programItems` et met à jour l'état local :

```typescript
// Sync programItems when they change externally (e.g., after cache invalidation)
useEffect(() => {
  if (!initialData?.programItems) return;
  
  // Only update if the content actually changed (deep comparison)
  const currentProgramItemsJson = JSON.stringify(formData.programItems);
  const newProgramItemsJson = JSON.stringify(initialData.programItems);
  
  if (currentProgramItemsJson !== newProgramItemsJson) {
    console.log("🔄 [EventFormAdvanced] Syncing programItems from external update");
    setFormData(prev => ({
      ...prev,
      programItems: mapProgramItems(initialData.programItems || [])
    }));
  }
}, [initialData?.programItems]);
```

### 3. Synchronisation de l'État Local - EventProgramForm

**Fichier** : [`src/components/admin/EventProgramForm.tsx`](src/components/admin/EventProgramForm.tsx:370)

Un `useEffect` surveille les changements dans `existingItems` (prop) et met à jour l'état local :

```typescript
// Sync items when existingItems changes (e.g., after React Query invalidation)
useEffect(() => {
  if (existingItems.length > 0) {
    const freshItems = mapExistingItems(existingItems);
    setItems(freshItems);
    initialItemsRef.current = existingItems;
    isDirtyFlagRef.current = false;
  }
}, [existingItems]);
```

## 🔄 Flux de Synchronisation

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User modifie la config dans ContestConfigModal              │
│    (Dashboard Contest Manager)                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Mutation Supabase : UPDATE event_schedule.contest_config    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. onSuccess : Invalidation de TOUS les caches React Query     │
│    - admin-events, events, event-program, contest-config, etc. │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. React Query re-fetch automatiquement les données fraîches   │
│    depuis Supabase                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. AdminEvents reçoit les nouvelles données                    │
│    → initialData.programItems est mis à jour                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. EventFormAdvanced détecte le changement via useEffect       │
│    → Met à jour formData.programItems                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. EventProgramForm reçoit les nouvelles existingItems         │
│    → Met à jour son état local items                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. L'UI affiche les données synchronisées ! ✅                  │
└─────────────────────────────────────────────────────────────────┘
```

## 🧪 Test de Validation

Pour vérifier que la synchronisation fonctionne :

1. **Ouvrir le Dashboard Contest Manager** (`/admin/contest/:id`)
2. **Modifier l'heure de pré-judging** (ex: de "10:00" à "16:30")
3. **Cliquer sur "Enregistrer"**
4. **Naviguer vers "Admin > Événements > Modifier l'événement"**
5. **Aller dans l'onglet "Programme"**
6. **Vérifier que l'heure affichée est "16:30"** ✅

## 📝 Notes Techniques

- **Deep Comparison** : On utilise `JSON.stringify()` pour comparer les objets et éviter les mises à jour inutiles
- **Dirty State** : Le flag `isDirtyFlagRef` est réinitialisé à `false` lors de la synchronisation pour éviter les faux positifs
- **Performance** : Les `useEffect` ne se déclenchent que si les données ont réellement changé
- **Type Safety** : Utilisation de `mapProgramItems()` pour garantir la structure des données

## 🔗 Fichiers Modifiés

1. [`src/components/admin/ContestConfigModal.tsx`](src/components/admin/ContestConfigModal.tsx:132) - Invalidation du cache
2. [`src/components/admin/EventFormAdvanced.tsx`](src/components/admin/EventFormAdvanced.tsx:251) - Sync programItems
3. [`src/components/admin/EventProgramForm.tsx`](src/components/admin/EventProgramForm.tsx:370) - Sync items

## 🎉 Résultat

Les deux interfaces sont maintenant **parfaitement synchronisées** grâce à React Query et aux `useEffect` de synchronisation !
