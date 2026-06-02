# 🏗️ Architecture : Dimension Sociale du Programme

## 📊 Diagramme de flux de données

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER ACTION                              │
│              (Clique sur le signet d'une activité)              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    useUserFavorites Hook                         │
│  • toggleFavorite(activityId)                                   │
│  • Optimistic Update (UI instantanée)                           │
│  • Mutation Supabase (INSERT/DELETE user_favorites)             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                             │
│  Table: user_favorites                                          │
│  ├─ user_id (UUID)                                              │
│  ├─ activity_id (UUID)                                          │
│  ├─ event_id (UUID)                                             │
│  └─ created_at (TIMESTAMP)                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Vue: activity_participation_stats                   │
│  • Agrège les favoris par activité                              │
│  • JOIN avec profiles pour récupérer avatars/pseudos            │
│  • Retourne: participant_count + participants[]                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              useActivityParticipation Hook                       │
│  • React Query (cache + invalidation)                           │
│  • Real-time subscription (Supabase Realtime)                   │
│  • Retourne: participationByActivity{}                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              EventScheduleTimeline Component                     │
│  • Map sur filteredSchedule                                     │
│  • Pour chaque activité:                                        │
│    - Récupère participationByActivity[slot.id]                  │
│    - Passe participants + count à ParticipantStack              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  ParticipantStack Component                      │
│  • Affiche les 3 premiers avatars (facepile)                   │
│  • Affiche le compteur total                                    │
│  • Tooltip avec liste des pseudos                               │
│  • Animations Framer Motion                                     │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Synchronisation Optimiste

### Étape 1 : Click sur le signet
```typescript
// EventScheduleTimeline.tsx
<Button onClick={() => toggleFavorite(slot.id)}>
  {isSlotFavorite ? <BookmarkCheck /> : <Bookmark />}
</Button>
```

### Étape 2 : Optimistic Update
```typescript
// useUserFavorites.ts - onMutate
queryClient.setQueryData(["user-favorites", eventId, user?.id], (old) => {
  if (isFavorite) {
    return old.filter((fav) => fav.activity_id !== activityId);
  } else {
    return [...old, { id: "temp", activity_id: activityId, ... }];
  }
});
```

### Étape 3 : Mutation Supabase
```typescript
// useUserFavorites.ts - mutationFn
if (isFavorite) {
  await supabase.from("user_favorites").delete()
    .eq("user_id", user.id)
    .eq("activity_id", activityId);
} else {
  await supabase.from("user_favorites").upsert({ ... });
}
```

### Étape 4 : Invalidation des caches
```typescript
// useUserFavorites.ts - onSuccess
queryClient.invalidateQueries({ queryKey: ["user-favorites", eventId] });
queryClient.invalidateQueries({ queryKey: ["activity-participation", eventId] });
```

### Étape 5 : Refetch automatique
```typescript
// useActivityParticipation.ts
// React Query refetch automatiquement grâce à l'invalidation
// + Real-time subscription pour les autres utilisateurs
```

## 🎯 Points clés de l'architecture

### 1. Séparation des responsabilités

| Composant | Responsabilité |
|-----------|----------------|
| `useUserFavorites` | Gestion des favoris de l'utilisateur connecté |
| `useActivityParticipation` | Agrégation des stats de participation (tous users) |
| `ParticipantStack` | Affichage UI des participants |
| `EventScheduleTimeline` | Orchestration et intégration |

### 2. Performance

- **React Query** : Cache intelligent, pas de requêtes inutiles
- **Optimistic Updates** : UI instantanée, pas d'attente serveur
- **Stale Time** : 30 secondes avant de considérer les données obsolètes
- **Real-time** : Subscription Supabase pour les mises à jour live

### 3. Scalabilité

- **Vue SQL** : Calculs côté serveur (pas côté client)
- **Indexation** : Index sur `user_id`, `activity_id`, `event_id`
- **Pagination** : Possible d'ajouter LIMIT/OFFSET si besoin
- **Caching** : React Query gère le cache automatiquement

## 🔐 Sécurité (RLS)

### Policies existantes

```sql
-- user_favorites : RLS activé
CREATE POLICY "user_favorites_select_policy" 
  ON user_favorites FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "user_favorites_insert_policy" 
  ON user_favorites FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_favorites_delete_policy" 
  ON user_favorites FOR DELETE 
  USING (auth.uid() = user_id);
```

### Vue publique

```sql
-- activity_participation_stats : Lecture publique
GRANT SELECT ON activity_participation_stats TO authenticated;
```

**Pourquoi ?** Les stats de participation sont publiques (comme les likes sur Instagram). Seule l'action d'ajouter/retirer est protégée.

## 🎨 Composant ParticipantStack - Détails

### Props

```typescript
interface ParticipantStackProps {
  participants: ActivityParticipant[];  // Liste complète
  totalCount: number;                   // Nombre total
  maxAvatars?: number;                  // Combien afficher (défaut: 3)
  className?: string;                   // Classes Tailwind custom
}
```

### Logique d'affichage

```typescript
// Affiche les 3 premiers
const displayedParticipants = participants.slice(0, maxAvatars);

// Tooltip intelligent
if (participants.length <= 3) {
  // "Alice, Bob, Charlie"
} else {
  // "Alice, Bob, Charlie et 5 autres..."
}
```

### Animations

```typescript
// Fade-in progressif (stagger)
{displayedParticipants.map((p, idx) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: idx * 0.05 }}  // 50ms entre chaque
  >
    <Avatar />
  </motion.div>
))}
```

## 📈 Métriques de performance

### Requêtes SQL

```sql
-- Vue optimisée avec agrégation
SELECT 
  activity_id,
  COUNT(DISTINCT user_id) AS participant_count,
  json_agg(...) AS participants
FROM user_favorites
GROUP BY activity_id, event_id;
```

**Complexité** : O(n) où n = nombre de favoris pour l'événement

### React Query

- **Cache Hit** : 0ms (données déjà en mémoire)
- **Cache Miss** : ~100-300ms (requête Supabase)
- **Optimistic Update** : 0ms (UI instantanée)
- **Real-time Update** : ~500ms-2s (latence réseau)

## 🚀 Évolutions futures possibles

### 1. Filtrage par amis
```typescript
const friendParticipants = participants.filter(p => 
  friendIds.includes(p.id)
);
```

### 2. Notifications push
```typescript
// Quand un ami ajoute une activité
if (friendIds.includes(newParticipant.id)) {
  sendNotification("Ton ami X va à cette activité !");
}
```

### 3. Suggestions intelligentes
```typescript
// Activités populaires parmi tes amis
const suggestedActivities = activities
  .filter(a => a.friendCount > 2)
  .sort((a, b) => b.friendCount - a.friendCount);
```

### 4. Analytics
```typescript
// Tracking des activités les plus populaires
const popularActivities = Object.entries(participationByActivity)
  .sort((a, b) => b[1].participant_count - a[1].participant_count)
  .slice(0, 10);
```

---

**Créé le** : 14 février 2026  
**Auteur** : Kilo Code  
**Stack** : React + TypeScript + Supabase + React Query + Framer Motion
