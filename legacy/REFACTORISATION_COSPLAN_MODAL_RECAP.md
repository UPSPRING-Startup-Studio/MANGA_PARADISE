# 🎯 Refactorisation de la Modale NouveauProjetCosplay - RÉCAPITULATIF

## 📋 Objectif
Améliorer la modale de création/édition de projets cosplay en ajoutant :
1. Un champ **Personnage** conditionné par l'Univers (déjà présent ✅)
2. Un champ **Événement cible** (Select/Autocomplete) pour lier le projet à une convention
3. Un champ **Date butoir** conditionnel (si pas d'événement sélectionné)
4. Un layout en **deux colonnes sur desktop** pour éviter le scroll

---

## ✅ Modifications Effectuées

### 1. **Composant Principal** : [`CosplanModal.tsx`](src/components/cosplay/CosplanModal.tsx:1)

#### Imports ajoutés
```typescript
import { MapPin } from "lucide-react";
import { useUpcomingEvents, Event } from "@/hooks/useEvents";
```

#### Nouveaux states
```typescript
const [targetEventId, setTargetEventId] = useState<string | null>(null);
const { data: upcomingEvents = [], isLoading: eventsLoading } = useUpcomingEvents();
```

#### Interface `CosplanModalProps` mise à jour
Ajout du champ `target_event_id` dans le type de données soumis :
```typescript
onSubmit: (data: {
  // ... autres champs
  target_event_id?: string | null;
  // ...
}) => Promise<void>;
```

#### Layout refactorisé en deux colonnes
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Colonne gauche : Année, Budget, Événement */}
  <div className="space-y-4">...</div>
  
  {/* Colonne droite : Date butoir, Notes */}
  <div className="space-y-4">...</div>
</div>
```

#### Nouveau champ "Événement cible"
- **Select** avec liste des événements à venir
- Affiche : Titre de l'événement + Date + Ville
- Optionnel (valeur "none" par défaut)
- **Auto-synchronisation** : Quand un événement est sélectionné, la deadline est automatiquement définie à la date de l'événement

```typescript
onValueChange={(v) => {
  if (v === "none") {
    setTargetEventId(null);
  } else {
    setTargetEventId(v);
    const selectedEvent = upcomingEvents.find(e => e.id === v);
    if (selectedEvent) {
      setDeadline(parseISO(selectedEvent.date));
    }
  }
}}
```

#### Champ "Date butoir" conditionnel
- **Désactivé** si un événement est sélectionné (date auto)
- **Actif** si aucun événement n'est choisi
- Indication visuelle : `(Auto depuis événement)` quand désactivé

---

### 2. **Hook TypeScript** : [`useCosplans.ts`](src/hooks/useCosplans.ts:1)

#### Interfaces mises à jour
```typescript
export interface CosplayPlan {
  // ... autres champs
  target_event_id?: string | null;
  // ...
}

export interface CreateCosplanInput {
  // ... autres champs
  target_event_id?: string | null;
  // ...
}

export interface UpdateCosplanInput {
  // ... autres champs
  target_event_id?: string | null;
  // ...
}
```

---

### 3. **Migration SQL** : [`20260224_add_target_event_to_cosplans.sql`](supabase/migrations/20260224_add_target_event_to_cosplans.sql:1)

```sql
ALTER TABLE cosplay_plans
ADD COLUMN IF NOT EXISTS target_event_id UUID REFERENCES events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cosplay_plans_target_event_id 
ON cosplay_plans(target_event_id);
```

**Caractéristiques** :
- Colonne **nullable** (pas d'impact sur les données existantes)
- **Foreign Key** vers `events(id)` avec `ON DELETE SET NULL`
- **Index** pour optimiser les requêtes
- Documentation via `COMMENT`

---

## 🎨 UX/UI Améliorations

### Dark Mode conservé ✅
- Fond : `bg-header-bg` (charcoal/black)
- Accents : Neon Pink (`#FF007F`), Cyan (`#00F0FF`), Gold (`#FFD700`)
- Glassmorphism : `bg-white/5 backdrop-blur-md border-white/20`

### Layout Responsive
- **Mobile** : Une seule colonne (stack vertical)
- **Desktop** (`md:` breakpoint) : Deux colonnes côte à côte
- Évite le scroll excessif sur grand écran

### Micro-interactions
- **Sparkles icon** (✨) quand un événement est sélectionné
- Message informatif : *"La date butoir sera automatiquement définie à la date de l'événement"*
- Loader animé pendant le chargement des événements

---

## 📦 Fichiers Modifiés

| Fichier | Type | Description |
|---------|------|-------------|
| [`src/components/cosplay/CosplanModal.tsx`](src/components/cosplay/CosplanModal.tsx:1) | Component | Ajout du champ événement + layout 2 colonnes |
| [`src/hooks/useCosplans.ts`](src/hooks/useCosplans.ts:1) | Hook | Ajout de `target_event_id` aux interfaces |
| [`supabase/migrations/20260224_add_target_event_to_cosplans.sql`](supabase/migrations/20260224_add_target_event_to_cosplans.sql:1) | Migration | Ajout de la colonne en BDD |
| [`supabase/migrations/APPLY_TARGET_EVENT_COSPLANS.md`](supabase/migrations/APPLY_TARGET_EVENT_COSPLANS.md:1) | Doc | Instructions d'application |

---

## 🚀 Prochaines Étapes

### 1. Appliquer la migration SQL
```bash
# Via Supabase Dashboard (Recommandé)
# 1. Ouvrir https://supabase.com/dashboard
# 2. SQL Editor
# 3. Copier-coller le contenu de 20260224_add_target_event_to_cosplans.sql
# 4. Run
```

### 2. Tester la fonctionnalité
- [ ] Se connecter à l'application
- [ ] Naviguer vers la section Cosplans
- [ ] Ouvrir la modale "Nouveau Projet Cosplay"
- [ ] Vérifier le layout en deux colonnes (desktop)
- [ ] Tester la sélection d'un événement
- [ ] Vérifier que la date butoir se remplit automatiquement
- [ ] Tester la création d'un projet avec événement
- [ ] Tester la création d'un projet sans événement (date manuelle)

### 3. Vérifications
- [ ] Le champ "Personnage" est bien conditionné par l'Univers (déjà fonctionnel)
- [ ] Les événements à venir sont bien chargés
- [ ] La date butoir est désactivée quand un événement est sélectionné
- [ ] Le formulaire reste responsive sur mobile
- [ ] Les données sont bien sauvegardées en BDD

---

## 🎯 Fonctionnalités Clés

### ✨ Auto-synchronisation Deadline ↔ Événement
Quand l'utilisateur sélectionne un événement (ex: "Japan Expo 2026"), la deadline du projet cosplay est **automatiquement définie** à la date de cet événement. Cela évite les erreurs de saisie et garantit la cohérence.

### 🔄 Logique Conditionnelle
- **Si événement sélectionné** → Date butoir = Date de l'événement (auto, non modifiable)
- **Si aucun événement** → Date butoir = Champ libre (calendrier manuel)

### 📱 Responsive Design
- **Mobile** : Formulaire vertical, scroll naturel
- **Tablet/Desktop** : Deux colonnes, pas de scroll, meilleure lisibilité

---

## 🐛 Notes Techniques

### Erreurs TypeScript préexistantes
Des erreurs TypeScript dans [`CosplayLineup.tsx`](src/components/events/CosplayLineup.tsx:17) concernant `participant.cosplay` existent déjà et ne sont **pas liées** à cette refactorisation.

### Compatibilité
- ✅ Compatible avec les projets cosplay existants (colonne nullable)
- ✅ Pas de breaking changes
- ✅ Rétrocompatible avec l'ancien formulaire

---

## 📸 Captures d'écran (À venir)
Une fois la migration appliquée et l'application testée, ajouter des captures d'écran :
- [ ] Modale en mode création (desktop, 2 colonnes)
- [ ] Sélection d'un événement
- [ ] Date butoir auto-remplie
- [ ] Modale en mode mobile (1 colonne)

---

## ✅ Checklist Finale

- [x] Champ "Personnage" conditionné par Univers (déjà présent)
- [x] Champ "Événement cible" ajouté (Select avec fetch events)
- [x] Champ "Date butoir" conditionnel
- [x] Layout en deux colonnes sur desktop
- [x] Interfaces TypeScript mises à jour
- [x] Migration SQL créée
- [ ] Migration SQL appliquée (à faire manuellement)
- [ ] Tests visuels effectués

---

**Date de refactorisation** : 24 février 2026  
**Développeur** : Kilo Code (Senior Frontend/Fullstack)  
**Stack** : React + TypeScript + Tailwind + Supabase
