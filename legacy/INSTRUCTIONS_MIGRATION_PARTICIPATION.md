# 🎯 Instructions : Migration de la Dimension Sociale

## 📋 Résumé de l'implémentation

La dimension sociale a été implémentée sur le programme officiel des événements. Les utilisateurs peuvent maintenant voir qui participe à chaque activité avec :

- ✅ **Pile d'avatars** : Les 3 premiers participants affichés
- ✅ **Compteur de participants** : Nombre total de personnes intéressées
- ✅ **Info-bulle interactive** : Liste des pseudos au survol
- ✅ **Synchronisation temps réel** : Mise à jour instantanée lors de l'ajout/retrait de favoris
- ✅ **Optimistic UI** : Feedback immédiat sans attendre le serveur

## 🗄️ Migration SQL à appliquer

**IMPORTANT** : Avant de tester l'application, vous devez créer la vue SQL dans Supabase.

### Étapes :

1. **Ouvrir Supabase Dashboard** : https://supabase.com/dashboard
2. **Sélectionner votre projet** : Manga Paradise
3. **Aller dans SQL Editor** (menu de gauche)
4. **Créer une nouvelle query**
5. **Copier-coller le SQL suivant** :

```sql
-- =====================================================
-- MIGRATION: activity_participation_stats View
-- DATE: 2026-02-14
-- DESCRIPTION: Creates a view to aggregate participation stats
--              for each activity in the event schedule
-- =====================================================

-- Drop view if exists
DROP VIEW IF EXISTS public.activity_participation_stats;

-- Create view for activity participation statistics
CREATE OR REPLACE VIEW public.activity_participation_stats AS
SELECT 
  uf.activity_id,
  uf.event_id,
  COUNT(DISTINCT uf.user_id) AS participant_count,
  json_agg(
    json_build_object(
      'id', p.id,
      'username', p.username,
      'avatar_url', p.avatar_url,
      'display_name', COALESCE(p.display_name, p.username)
    ) ORDER BY uf.created_at ASC
  ) FILTER (WHERE p.id IS NOT NULL) AS participants
FROM public.user_favorites uf
LEFT JOIN public.profiles p ON p.id = uf.user_id
GROUP BY uf.activity_id, uf.event_id;

-- Add comment to view
COMMENT ON VIEW public.activity_participation_stats IS 'Aggregates participation statistics for each activity, including participant count and user details';

-- Grant access to authenticated users
GRANT SELECT ON public.activity_participation_stats TO authenticated;
```

6. **Exécuter la query** (bouton "Run" ou Cmd/Ctrl + Enter)
7. **Vérifier le succès** : Vous devriez voir "Success. No rows returned"

## 🧪 Comment tester

### 1. Accéder à un événement
- Connectez-vous à l'application : http://localhost:8083
- Naviguez vers la page d'un événement (ex: `/events/[event-id]`)
- Scrollez jusqu'à la section "Programme Officiel"

### 2. Tester l'ajout de favoris
- Cliquez sur l'icône de signet (📌) d'une activité
- **Résultat attendu** :
  - Toast de confirmation : "Activité ajoutée à ton programme ! 📌"
  - Votre avatar apparaît dans la pile d'avatars sous l'activité
  - Le compteur de participants s'incrémente (+1)
  - L'icône de signet devient rose/remplie

### 3. Tester l'info-bulle
- Survolez la pile d'avatars avec votre souris
- **Résultat attendu** :
  - Une info-bulle apparaît avec :
    - Le nombre total de participants
    - Les pseudos des participants (ex: "Pikatsu_Off, Sora_Cos et 5 autres...")

### 4. Tester le retrait de favoris
- Cliquez à nouveau sur l'icône de signet (maintenant remplie)
- **Résultat attendu** :
  - Toast : "Activité retirée de ton programme"
  - Votre avatar disparaît de la pile
  - Le compteur décrémente (-1)
  - L'icône de signet redevient vide

### 5. Tester le temps réel (avec 2 navigateurs)
- Ouvrez un second navigateur en mode incognito
- Connectez-vous avec un autre compte
- Allez sur le même événement
- Ajoutez une activité en favori dans le navigateur 1
- **Résultat attendu** : Le navigateur 2 se met à jour automatiquement (dans les 2-3 secondes)

## 📁 Fichiers créés/modifiés

### Nouveaux fichiers :
- ✅ `supabase/migrations/20260214_create_activity_participation_view.sql` - Vue SQL
- ✅ `src/hooks/useActivityParticipation.ts` - Hook React Query
- ✅ `src/components/events/ParticipantStack.tsx` - Composant UI

### Fichiers modifiés :
- ✅ `src/components/events/EventScheduleTimeline.tsx` - Intégration du composant
- ✅ `src/hooks/useUserFavorites.ts` - Invalidation de cache pour sync

## 🎨 Design System appliqué

Le composant `ParticipantStack` respecte le thème Manga Paradise :

- **Couleurs** :
  - Neon Pink (#FF007F) pour les rings et accents
  - Dégradés purple/pink pour les fallbacks d'avatars
  
- **Animations** :
  - Fade-in progressif des avatars (stagger effect)
  - Scale au hover (1.1x)
  - Transitions fluides (200ms)
  
- **Glassmorphism** :
  - Tooltip avec backdrop-blur
  - Bordures semi-transparentes

## 🐛 Troubleshooting

### La vue SQL ne se crée pas
- **Erreur** : "relation user_favorites does not exist"
- **Solution** : Vérifiez que la migration `20260214_create_user_favorites.sql` a été appliquée

### Les avatars ne s'affichent pas
- **Cause possible** : La vue n'a pas été créée
- **Solution** : Appliquez la migration SQL ci-dessus

### Le compteur reste à 0
- **Cause possible** : Aucun utilisateur n'a ajouté l'activité en favori
- **Solution** : Ajoutez l'activité en favori pour tester

### Le temps réel ne fonctionne pas
- **Cause possible** : Problème de connexion Supabase Realtime
- **Solution** : Vérifiez les logs de la console (F12) pour voir les messages de subscription

## 🚀 Prochaines étapes (optionnel)

Pour aller plus loin, vous pourriez :

1. **Filtrer par amis** : Afficher en priorité les amis qui participent
2. **Notifications** : Notifier quand un ami ajoute une activité
3. **Suggestions** : "X amis vont à cette activité, ça t'intéresse ?"
4. **Statistiques** : Graphique des activités les plus populaires

---

**Créé le** : 14 février 2026  
**Auteur** : Kilo Code (Mode Code)  
**Vibe** : Cyberpunk/Anime 🌸⚡
