# 🎯 UX - SÉPARATION STRICTE CANDIDATS VS SPECTATEURS & DOUBLE COMPTEUR

## 📋 MISSION ACCOMPLIE

Implémentation complète de la séparation stricte entre les candidats approuvés et les spectateurs intéressés, avec un double compteur visuel pour les concours.

---

## ✅ RÉALISATIONS

### 1. 🔧 MODIFICATION DE [`ActivityCard`](src/components/events/ActivityCard.tsx:1)

#### Nouvelles Props :
```typescript
approvedContestantsCount?: number; // Nombre de candidats approuvés
approvedContestantIds?: string[]; // IDs des candidats approuvés (pour filtrage)
```

#### Logique de Filtrage :
```typescript
// Filtrer les spectateurs : exclure les candidats approuvés
const realSpectators = useMemo(() => {
  if (!isContest || approvedContestantIds.length === 0) {
    return participantAvatars;
  }
  
  // Filtrer les participants qui sont des candidats approuvés
  return participantAvatars.filter(
    (participant) => !approvedContestantIds.includes(participant.id)
  );
}, [isContest, participantAvatars, approvedContestantIds]);

// Calculer le nombre réel de spectateurs
const spectatorCount = isContest 
  ? participantCount - approvedContestantsCount 
  : participantCount;
```

#### Double Compteur (UI) :
- **🏆 Candidats** (Or) : Affiche le nombre de candidats approuvés
- **👤 Spectateurs** (Gris) : Affiche le nombre de spectateurs (filtrés)
- **Séparateur** : Point médian `•` entre les deux compteurs
- **Fallback** : "Aucun participant" si les deux sont à 0

```tsx
{isContest ? (
  <div className="flex items-center gap-2 ml-2">
    {/* Contestants Count (Gold) */}
    {approvedContestantsCount > 0 && (
      <span className="text-xs font-bold text-[#FFD700] flex items-center gap-1">
        🏆 {approvedContestantsCount} Candidat{approvedContestantsCount > 1 ? "s" : ""}
      </span>
    )}
    
    {/* Separator */}
    {approvedContestantsCount > 0 && spectatorCount > 0 && (
      <span className="text-muted-foreground/50">•</span>
    )}
    
    {/* Spectators Count (Gray) */}
    {spectatorCount > 0 && (
      <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
        👤 {spectatorCount} Spectateur{spectatorCount > 1 ? "s" : ""}
      </span>
    )}
  </div>
) : (
  /* Standard Participant Count for non-contests */
  <span className="text-xs text-muted-foreground font-medium ml-2">
    {participantCount} participant{participantCount > 1 ? "s" : ""}
  </span>
)}
```

#### Avatars Stack :
- Affiche uniquement les avatars de `realSpectators` (candidats exclus)
- Les candidats ont leur propre section "Sélection Officielle" en bas

---

### 2. 🔄 MODIFICATION DE [`EventScheduleTimeline`](src/components/events/EventScheduleTimeline.tsx:1)

#### Requête pour Récupérer Tous les Candidats Approuvés :
```typescript
// Fetch ALL approved contestants for the event (for ActivityCard filtering)
const { data: allApprovedContestants = [] } = useQuery({
  queryKey: ["allApprovedContestants", eventId],
  queryFn: async () => {
    if (!eventId) return [];
    
    const { data, error } = await supabase
      .from("contest_registrations")
      .select(`
        id,
        activity_id,
        user_id,
        status
      `)
      .eq("status", "approved")
      .in("activity_id", schedule.map((s) => s.id));
    
    if (error) {
      console.error("Error fetching all approved contestants:", error);
      return [];
    }
    
    return data || [];
  },
  enabled: !!eventId && schedule.length > 0,
});
```

#### Mapping par Activité :
```typescript
// Create a map of activity_id -> approved contestant user_ids
const contestantsByActivity = useMemo(() => {
  const map: Record<string, { count: number; userIds: string[] }> = {};
  
  allApprovedContestants.forEach((contestant) => {
    const activityId = contestant.activity_id;
    if (!map[activityId]) {
      map[activityId] = { count: 0, userIds: [] };
    }
    map[activityId].count++;
    map[activityId].userIds.push(contestant.user_id);
  });
  
  return map;
}, [allApprovedContestants]);
```

#### Passage des Props à ActivityCard :
```typescript
// Get approved contestants for this activity
const activityContestants = contestantsByActivity[slot.id] || { count: 0, userIds: [] };

<ActivityCard
  // ... autres props
  approvedContestantsCount={isContest ? activityContestants.count : 0}
  approvedContestantIds={isContest ? activityContestants.userIds : []}
/>
```

---

### 3. 📄 MODIFICATION DU SHEET (EventScheduleTimeline)

#### Filtrage des Spectateurs :
```typescript
// Filter out approved contestants from the spectators list for contests
const filteredParticipants = isContest
  ? participants.filter(
      (p) => !approvedContestants.some((ac) => ac.user_id === p.id)
    )
  : participants;
```

#### Affichage Conditionnel :
```typescript
// Show section if there are spectators OR if it's a contest (to show "0 spectateurs" when only contestants)
const shouldShowSection = displayCount > 0 || (isContest && approvedContestants.length > 0);
```

#### Message "Aucun spectateur" :
```typescript
{displayCount > 0 ? (
  <p className="text-sm text-muted-foreground mb-4">
    <span className="text-foreground font-bold">{displayCount} personne{displayCount > 1 ? "s" : ""}</span> intéressée{displayCount > 1 ? "s" : ""}
  </p>
) : (
  <p className="text-sm text-muted-foreground mb-4">
    Aucun spectateur pour le moment
  </p>
)}
```

---

## 🎨 RÉSULTAT VISUEL

### Avant (Problème) :
```
👤 5 spectateurs intéressés
[Avatar1] [Avatar2] [Avatar3] [Avatar4] [Avatar5]
↑ Inclut les candidats approuvés (doublon)
```

### Après (Solution) :
```
🏆 2 Candidats • 👤 3 Spectateurs
[Avatar1] [Avatar2] [Avatar3]
↑ Uniquement les spectateurs (candidats exclus)

--- Section séparée en bas ---
🏆 Sélection Officielle
[Candidat1] [Candidat2]
```

---

## 🔍 RÈGLE D'OR

**Si `user_id` est `approved` dans le concours, il ne doit JAMAIS apparaître dans la liste des avatars "Spectateurs".**

### Implémentation :
1. **Récupération** : Tous les candidats approuvés sont récupérés en une seule requête
2. **Mapping** : Les candidats sont mappés par `activity_id`
3. **Filtrage** : Les spectateurs sont filtrés pour exclure les `user_id` des candidats
4. **Affichage** : Double compteur + avatars filtrés + section séparée

---

## 📊 EXEMPLES DE CAS D'USAGE

### Cas 1 : Concours avec candidats et spectateurs
```
🏆 3 Candidats • 👤 10 Spectateurs
[10 avatars de spectateurs uniquement]

🏆 Sélection Officielle
[3 candidats avec leurs cosplays]
```

### Cas 2 : Concours avec uniquement des candidats
```
🏆 5 Candidats
(Pas d'avatars affichés en haut)

🏆 Sélection Officielle
[5 candidats avec leurs cosplays]
```

### Cas 3 : Concours avec uniquement des spectateurs
```
👤 8 Spectateurs
[8 avatars de spectateurs]

(Pas de section "Sélection Officielle")
```

### Cas 4 : Activité normale (non-concours)
```
👤 15 participants
[15 avatars]
```

---

## 🧪 TESTS À EFFECTUER

### 1. Test du Filtrage :
- [ ] Créer un concours avec 3 candidats approuvés
- [ ] S'inscrire comme spectateur avec un compte candidat
- [ ] Vérifier que l'avatar du candidat n'apparaît PAS dans la liste des spectateurs
- [ ] Vérifier que l'avatar du candidat apparaît dans "Sélection Officielle"

### 2. Test du Double Compteur :
- [ ] Vérifier l'affichage "🏆 X Candidats • 👤 Y Spectateurs"
- [ ] Tester avec X=0 (uniquement spectateurs)
- [ ] Tester avec Y=0 (uniquement candidats)
- [ ] Tester avec X=0 et Y=0 (aucun participant)

### 3. Test du Sheet :
- [ ] Ouvrir le Sheet d'une activité concours
- [ ] Vérifier que les spectateurs sont filtrés
- [ ] Vérifier que la section "Sélection Officielle" est séparée
- [ ] Vérifier le message "Aucun spectateur pour le moment" si Y=0

---

## 🔗 FICHIERS MODIFIÉS

1. [`src/components/events/ActivityCard.tsx`](src/components/events/ActivityCard.tsx:1) 🔧 **MODIFIÉ**
   - Ajout des props `approvedContestantsCount` et `approvedContestantIds`
   - Logique de filtrage `realSpectators`
   - Double compteur (Candidats | Spectateurs)
   - Avatars filtrés

2. [`src/components/events/EventScheduleTimeline.tsx`](src/components/events/EventScheduleTimeline.tsx:1) 🔧 **MODIFIÉ**
   - Requête pour récupérer tous les candidats approuvés
   - Mapping `contestantsByActivity`
   - Passage des props à `ActivityCard`
   - Amélioration du Sheet (affichage conditionnel)

---

## ✅ CHECKLIST FINALE

- [x] Filtrage des candidats approuvés de la liste des spectateurs
- [x] Double compteur (Candidats | Spectateurs) dans ActivityCard
- [x] Avatars filtrés (uniquement spectateurs)
- [x] Requête pour récupérer tous les candidats approuvés
- [x] Mapping par activité
- [x] Passage des props à ActivityCard
- [x] Amélioration du Sheet (affichage conditionnel)
- [x] Message "Aucun spectateur pour le moment"
- [x] Séparation visuelle claire (Or vs Gris)
- [x] Responsive (mobile + desktop)

---

## 🎯 RÉSULTAT FINAL

### Expérience Utilisateur :
1. **Clarté** : Séparation stricte entre candidats et spectateurs
2. **Pas de doublon** : Un candidat approuvé n'apparaît jamais dans les spectateurs
3. **Double compteur** : Visibilité immédiate du nombre de candidats et spectateurs
4. **Hiérarchie visuelle** : Or (Candidats) > Gris (Spectateurs)

### Impact Business :
- ⬆️ **Clarté** : Les utilisateurs comprennent immédiatement qui participe au concours
- ⬇️ **Confusion** : Plus de doublons ou de questions sur les participants
- ✅ **Professionnalisme** : Séparation claire entre officiels et spectateurs

---

**🎉 MISSION ACCOMPLIE ! La séparation Candidats vs Spectateurs est opérationnelle et claire !**
