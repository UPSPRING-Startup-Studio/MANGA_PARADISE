# Feature — community

**Statut implémentation : ⬜ à faire (étape 2).** Inclut feed, amis, radar, annuaire, recherche, notifications, chat, **guildes** et **labs**.

## Périmètre

Cœur social : feed de posts (texte/galerie/cosplay), amis (« Nakamas »), radar géolocalisé (carte Leaflet + PostGIS), annuaire des membres, recherche multi-entités, notifications (« DenDenMushi »), messagerie temps réel (« Linkshell »), blog. Plus deux sous-domaines : **guildes** (communautés avec rôles/agenda/news) et **labs** (idées + votes).

## Écrans legacy → cible

### Communauté

| Legacy                   | Rôle                                      | Route cible                 |
| ------------------------ | ----------------------------------------- | --------------------------- |
| `Communaute.tsx`         | Landing marketing (statique)              | `/communaute` (hub)         |
| `CommunityFeed.tsx`      | Feed généraliste (catégories)             | `/communaute/feed`          |
| `CosFeed.tsx`            | Feed cosplay (nakamas/wip/showcase/local) | **doublon → fusionner**     |
| `CommunityRadar.tsx`     | Radar géoloc (Leaflet, PostGIS)           | `/communaute/radar`         |
| `MesAmis.tsx`            | Nakamas : amis, demandes                  | `/mes-amis`                 |
| `Search.tsx`             | Recherche profils/persos/univers/lieux    | `/recherche`                |
| `Annuaire.tsx`           | Annuaire membres + filtres                | `/annuaire`                 |
| `Blog.tsx`               | Articles **100 % mock**                   | `/blog` (ou hors périmètre) |
| `Contact.tsx`            | Formulaire **non câblé**                  | `/contact` (à brancher)     |
| `NousRejoindre.tsx`      | Recrutement + newsletter                  | `/nous-rejoindre`           |
| `components/linkshell/*` | Chat temps réel (drawer/FAB global)       | overlay global              |

### Guildes & Labs

| Legacy                    | Rôle                                               | Route cible                            |
| ------------------------- | -------------------------------------------------- | -------------------------------------- |
| `Guilds.tsx`              | Découverte + listing + mes guildes + invitations   | `/guildes` (**chemin canonique**)      |
| `GuildDetail.tsx`         | Fiche : membres/staff/agenda/posts, join/leave     | `/guildes/[id]`                        |
| `GuildAdmin.tsx` (630 l.) | Admin guilde (réglages/kick/promote/events/news)   | `/guildes/[id]/admin` (**à découper**) |
| `Labs.tsx`                | Idées + filtres + soumission                       | `/labs`                                |
| `LabsIdeaDetail.tsx`      | Détail idée : vote, votants, timeline, progression | `/labs/[id]`                           |

## Tables Supabase

`profiles` (+ géoloc PostGIS, `profile_visibility`, `privacy_settings`), `friendships`, `posts`/`post_likes`/`post_comments`, `notifications`, `chat_rooms`/`chat_messages`/`chat_participants`, `meetups`/`meetup_participants`, `newsletter_subscribers`, `user_favorites`, `guild_categories`/`guilds`/`guild_members`/`guild_invitations`/`guild_events`/`guild_posts`, `labs_ideas`/`labs_votes`. RPC géoloc : `get_nearby_profiles`, `update_location`.

## Hooks legacy clés

`useFriendships`/`useFriendshipExtras`, `usePosts` (filtres + JOIN profiles), `useNotifications` (polling 30 s), `useGeocoding` (Nominatim/OSM + offset confidentialité), `useLinkshell` (realtime channels), `useNotifyNakamas`, `useMeetups` (realtime) ; `useGuilds`/`useGuildDetails`/`useGuildEvents`/`useGuildInvitations`/`useGuildPosts` ; `useLabsIdeas`/`useLabsIdea`/`useVoteIdea`.

## Doublons / consolidation

- **Deux feeds** (`CommunityFeed` catégories vs `CosFeed` nakamas/local) → **un seul** avec les deux jeux de filtres. Deux familles de cartes (`community/PostCard` vs `feed/SmartPostCard`) → mutualiser.
- `Annuaire` ∩ `Search` (onglet profils) → factoriser le listing de profils.
- Guildes : `useGuilds` et `usePublicGuilds` font tous deux du listing public → consolider ; comptage membres dupliqué → vue/RPC.

## Stubs / placeholders

- `Blog.tsx` (mock), `Contact.tsx` (sans handler), `Communaute.tsx` (statique).
- `useMeetups` : « table may not exist — degrade gracefully ».
- Guildes : images de catégories en dur (Unsplash). Labs : bloc « comment ça marche » en dur.

## Points d'attention

- **PostGIS** : `location_geo` (POINT), RPC `get_nearby_profiles` ; offset de confidentialité géré côté client → reconsidérer côté serveur.
- **Leaflet** → `dynamic(..., { ssr:false })`.
- **Realtime** (Linkshell, Meetups) → channels Supabase à porter proprement.
- **Nominatim** : dépendance externe (User-Agent + rate-limit) → encapsuler dans `features/community/api/`.
- Requêtes friendships éclatées pour contourner le cache PostGREST → clarifier les FK dans le nouveau schéma.
- `GuildAdmin` 630 l. → découper ; autorisations owner/staff → RLS + `lib/rbac.ts`.
- Workflow d'approbation des idées labs (review/approved) sans écran admin visible → cadrer (RBAC + transitions DB).
