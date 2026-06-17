# 📋 PHASE 3 - Sémantique 'Spectateurs' vs 'Candidats Officiels' - RÉCAPITULATIF

## 🎯 OBJECTIF
Distinguer clairement le public intéressé (spectateurs) des participants officiels (candidats validés) dans les concours.

---

## ✅ RÉALISATIONS

### 1. 🔌 Hook de Récupération des Candidats Approuvés

**Fichier créé :** [`src/hooks/useApprovedContestants.ts`](src/hooks/useApprovedContestants.ts)

**Fonctionnalités :**
- Récupère tous les candidats avec le statut `approved` pour une activité spécifique
- Inclut les informations du profil utilisateur (avatar, nom, username)
- Tri automatique par `passage_order` (ordre de passage)
- Utilise React Query avec un `staleTime` de 2 minutes

**Interface TypeScript :**
```typescript
export interface ApprovedContestant {
  id: string;
  user_id: string;
  character_name: string;
  universe: string;
  format: string;
  group_name?: string | null;
  passage_order?: number | null;
  profiles?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}
```

**Signature :**
```typescript
useApprovedContestants(activityId: string | null, enabled = true)
```

---

### 2. 🎴 Modification de ActivityCard

**Fichier modifié :** [`src/components/events/ActivityCard.tsx`](src/components/events/ActivityCard.tsx:231)

**Changement :**
- Détection automatique si l'activité est un concours (`type === "contest"` ou `category === "contest"`)
- Affichage conditionnel du texte :
  - **Concours** : `X spectateur(s) intéressé(s)`
  - **Autres activités** : `X participant(s)`

**Code :**
```tsx
{type === "contest" || category?.toLowerCase() === "contest" 
  ? `${participantCount} spectateur${participantCount > 1 ? "s" : ""} intéressé${participantCount > 1 ? "s" : ""}`
  : `${participantCount} participant${participantCount > 1 ? "s" : ""}`
}
```

---

### 3. 📊 Modification de la Sheet de Détail (EventScheduleTimeline)

**Fichier modifié :** [`src/components/events/EventScheduleTimeline.tsx`](src/components/events/EventScheduleTimeline.tsx:10)

#### A. Import du Hook
```typescript
import { useApprovedContestants } from "@/hooks/useApprovedContestants";
```

#### B. Utilisation du Hook
```typescript
const { data: approvedContestants = [] } = useApprovedContestants(
  selectedSlotForSheet?.id || null,
  !!selectedSlotForSheet && (selectedSlotForSheet.type === "contest" || selectedSlotForSheet.category?.toLowerCase() === "contest")
);
```

#### C. Section "Spectateurs intéressés" (Modifiée)
- **Titre** : "Spectateurs intéressés" (au lieu de "Qui participe ?")
- **Texte** : "X personne(s) intéressée(s)" (au lieu de "participe(nt)")
- Affichage conditionnel selon le type d'activité

**Code :**
```tsx
<h4 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
  <Users className="w-5 h-5 text-sakura" />
  {isContest ? "Spectateurs intéressés" : "Qui participe ?"}
</h4>

<p className="text-sm text-muted-foreground mb-4">
  <span className="text-foreground font-bold">{participantCount} personne{participantCount > 1 ? "s" : ""}</span> 
  {isContest ? `intéressée${participantCount > 1 ? "s" : ""}` : `participe${participantCount > 1 ? "nt" : ""}`}
</p>
```

#### D. Nouvelle Section "🏆 Sélection Officielle"
- **Condition d'affichage** : Uniquement si `approvedContestants.length > 0`
- **Design** : Gradient or/amber avec bordures dorées
- **Contenu** :
  - Titre avec icône Award et emoji 🏆
  - Résumé : "X participant(s) officiel(s) validé(s)"
  - Liste des candidats avec :
    - Avatar (gradient or/amber si pas d'image)
    - Nom du personnage (en or)
    - Univers
    - Nom du cosplayeur
    - Badge avec numéro d'ordre de passage (si défini)

**Design :**
```tsx
<div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-[#FFD700]/10 to-amber-600/10 border border-[#FFD700]/30 hover:border-[#FFD700]/50 transition-colors">
  {/* Avatar or/amber */}
  <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[#FFD700] to-amber-600 flex items-center justify-center text-sm font-bold text-black shrink-0">
    {avatarUrl ? <img src={avatarUrl} /> : initials}
  </div>

  {/* Info */}
  <div className="flex-1 min-w-0">
    <p className="text-sm font-bold text-[#FFD700]">{contestant.character_name}</p>
    <p className="text-xs text-muted-foreground">{contestant.universe}</p>
    <p className="text-xs text-muted-foreground">Par {displayName} (@{username})</p>
  </div>

  {/* Badge ordre de passage */}
  {contestant.passage_order && (
    <Badge className="bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/50 font-bold">
      #{contestant.passage_order}
    </Badge>
  )}
</div>
```

---

## 🎨 DESIGN SYSTEM APPLIQUÉ

### Couleurs
| Élément | Couleur | Usage |
|---------|---------|-------|
| **Spectateurs** | Sakura (#FF007F) | Icône Users, texte standard |
| **Sélection Officielle** | Or (#FFD700) | Icône Award, bordures, texte des noms |
| **Gradient Candidats** | Or → Amber | Fond des cartes, avatars |

### Hiérarchie Visuelle
1. **Spectateurs intéressés** : Section standard avec icône sakura
2. **Sélection Officielle** : Section premium avec :
   - Emoji 🏆 dans le titre
   - Gradient or/amber
   - Bordures dorées
   - Avatars avec fond or
   - Noms en couleur or

---

## 📁 FICHIERS CRÉÉS/MODIFIÉS

### Créés
1. [`src/hooks/useApprovedContestants.ts`](src/hooks/useApprovedContestants.ts) - Hook de récupération des candidats approuvés

### Modifiés
1. [`src/components/events/ActivityCard.tsx`](src/components/events/ActivityCard.tsx:231) - Texte "spectateurs intéressés"
2. [`src/components/events/EventScheduleTimeline.tsx`](src/components/events/EventScheduleTimeline.tsx:10) - Section spectateurs + Sélection Officielle

---

## 🧪 TESTS À EFFECTUER

### Scénario 1 : Activité normale (non-concours)
1. ✅ Aller sur la page Programme
2. ✅ Cliquer sur une activité de type "panel" ou "concert"
3. ✅ Vérifier que le texte affiche "X participant(s)"
4. ✅ Vérifier que la section "Qui participe ?" est affichée

### Scénario 2 : Concours sans candidats approuvés
1. ✅ Cliquer sur une activité de type "contest"
2. ✅ Vérifier que le texte affiche "X spectateur(s) intéressé(s)"
3. ✅ Vérifier que la section "Spectateurs intéressés" est affichée
4. ✅ Vérifier que la section "🏆 Sélection Officielle" n'est PAS affichée

### Scénario 3 : Concours avec candidats approuvés
1. ✅ En tant qu'admin, valider des candidatures (status = approved)
2. ✅ Retourner sur la page Programme en tant qu'utilisateur
3. ✅ Cliquer sur le concours
4. ✅ Vérifier que la section "Spectateurs intéressés" est affichée
5. ✅ Vérifier que la section "🏆 Sélection Officielle" est affichée
6. ✅ Vérifier que les candidats approuvés sont listés avec :
   - Avatar (or si pas d'image)
   - Nom du personnage en or
   - Univers
   - Nom du cosplayeur
   - Badge avec numéro d'ordre (si défini)

### Scénario 4 : Ordre de passage
1. ✅ En tant qu'admin, définir l'ordre de passage des candidats
2. ✅ Vérifier que les candidats sont triés par ordre de passage
3. ✅ Vérifier que le badge "#X" est affiché pour chaque candidat

---

## 🚀 PROCHAINES ÉTAPES SUGGÉRÉES

### Phase 4 : Gestion Avancée des Concours
- [ ] Permettre aux spectateurs de "liker" les candidats
- [ ] Afficher un classement en temps réel
- [ ] Ajouter un système de votes du public
- [ ] Créer une page dédiée au concours avec toutes les infos

### Phase 5 : Notifications & Communication
- [ ] Notifier les candidats quand l'ordre de passage est défini
- [ ] Envoyer un rappel 30 min avant le passage
- [ ] Permettre aux spectateurs de s'abonner aux notifications du concours

---

## 💡 NOTES TECHNIQUES

### Performance
- Le hook `useApprovedContestants` est conditionnel (enabled uniquement pour les concours)
- Stale time de 2 minutes (plus court que les autres hooks car les validations changent souvent)
- La section "Sélection Officielle" ne s'affiche que si nécessaire (pas de rendu inutile)

### Accessibilité
- Distinction claire entre spectateurs et participants officiels
- Emojis pour une meilleure compréhension visuelle
- Couleurs contrastées (or sur fond sombre)

### Maintenabilité
- Logique de détection des concours centralisée (`isContest`)
- Composants réutilisables
- Types TypeScript stricts

---

## 🎉 RÉSULTAT FINAL

L'utilisateur peut maintenant :
1. ✅ Voir clairement la différence entre "spectateurs intéressés" et "participants officiels"
2. ✅ Consulter la liste des candidats validés pour un concours
3. ✅ Voir l'ordre de passage des candidats
4. ✅ Identifier facilement les concours grâce à la section dorée "🏆 Sélection Officielle"

**Exemple concret :**
> Sur la carte du concours, je vois "150 spectateurs intéressés". En cliquant, si la sélection est faite, je vois en dessous "12 Participants Officiels" avec leurs têtes et l'ordre de passage.

**Mission accomplie ! 🚀**
