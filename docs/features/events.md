# Feature — events

**Statut implémentation : ⬜ à faire (étape 1).** Domaine le plus volumineux du legacy (~25 tables, EventDetail = 1750 l.).

## Périmètre

Découverte d'événements (agenda + carte), fiche événement (programme/schedule, exposants, parties/squads, lineups cosplay, souvenirs, quêtes, galerie, meetups), propositions d'événements, séries d'éditions, et le **concours cosplay** (inscriptions, manager admin, live view scène, scan QR de check-in).

## Écrans legacy → cible

### Agenda

| Legacy                             | Rôle                                                                 | Route cible                                         |
| ---------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------- |
| `Agenda.tsx` (704 l.)              | Agenda public riche : filtres ville/type/orga, liste + carte Leaflet | `/agenda` (**socle**)                               |
| `AgendaPage.tsx` (772 l.)          | Agenda alt : onglets temporels, tri, bookmarks DB, pagination        | **doublon → fusionner dans /agenda**                |
| `MemberAgenda.tsx` (1319 l.)       | Agenda perso : participations, RSVP, concours, souvenirs, QR         | `/agenda/mes-evenements` (filtre, pas page séparée) |
| `AgendaFavoritesPage.tsx` (178 l.) | Événements bookmarkés                                                | `/agenda/favoris`                                   |
| `Evenements.tsx` (462 l.)          | Landing marketing événements (favoris localStorage)                  | `/evenements` (fusion possible)                     |

### Événement & admin

| Legacy                                   | Rôle                                                                                        | Route cible                                    |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `EventDetail.tsx` (**1750 l.**)          | Fiche monolithique (header/RSVP/programme/meetups/exposants/parties/lineups/quêtes/galerie) | `/evenements/[id]` (**à découper en onglets**) |
| `EventMemoryCapsule.tsx` (214 l.)        | Capsule souvenir post-event                                                                 | `/evenements/[id]/souvenirs`                   |
| `admin/AdminEvents.tsx` (652 l.)         | CRUD événements                                                                             | `/admin/evenements`                            |
| `admin/AdminEventSeries.tsx` (352 l.)    | Séries d'éditions                                                                           | `/admin/evenements/series`                     |
| `admin/AdminEventProposals.tsx` (617 l.) | Modération propositions                                                                     | `/admin/evenements/propositions`               |
| `admin/AdminExhibitors.tsx` (16 l.)      | Wrapper → composant                                                                         | `/admin/exposants`                             |

### Concours

| Legacy                               | Rôle                                                        | Route cible                            |
| ------------------------------------ | ----------------------------------------------------------- | -------------------------------------- |
| `admin/ContestManager.tsx` (538 l.)  | Candidats (validation), config, ordre de passage, export    | `/admin/evenements/[id]/concours`      |
| `admin/ContestLiveView.tsx` (373 l.) | Vue scène live (défilement par `passage_order`, fullscreen) | `/admin/evenements/[id]/concours/live` |
| `admin/ScanPage.tsx` (31 l.)         | Wrapper scan QR check-in                                    | `/admin/evenements/[id]/scan`          |

## Tables Supabase

`events`, `event_series`, `event_schedule` (+ `contest_config` JSONB, `category='contest'`), `event_participants`, `event_exhibitors`, `event_parties`/`_members`, `party_invitations`, `squads`/`_slots`/`_members`, `event_lineups`, `cosplay_lineups`, `event_memories`/`_photos`, `event_encounters`, `event_quests`, `event_proposals`, `meetups`/`_participants`, `contest_registrations`, `event_contest_config`. RPC : `complete_quest`, comptages cosplay.

## Hooks legacy clés

`useEvents`/`useAgendaEvents`/`useUnifiedAgenda` (liste + statut temporel), `useEventSchedule`, `useEventParticipants` (RSVP/check-in), `useEventExhibitors`, `useEventParties`/`useSquads`/`usePartyInvitations`, `useEventLineups`/`useUnifiedLineups`, `useEventMemories`, `useEventQuests`, `useEventProposals`/`useEventSeries`, `useMeetups`, `useContestRegistration`/`useApprovedContestants`/`useUserContestRegistrations`.

## Doublons / consolidation

- **3 agendas** (`Agenda` / `AgendaPage` / `MemberAgenda`) → **un seul** : socle `Agenda` + onglets temporels + bookmarks d'`AgendaPage` ; « mes événements » = filtre.
- **Favoris** localStorage (`Evenements`, `useScheduleFavorites`) vs table `event_bookmarks` → **unifier sur la DB**.
- **Parties vs Squads** : `event_parties`+`_members` et `squads`+`_slots`+`_members` modélisent le même concept (groupes, slots, modes squad/shooting/concours) → **unifier en une table**.
- **Lineups** : `useEventLineups` / `useUnifiedLineups` / `useCosplayerAgenda` lisent tous `event_lineups` avec mappings différents → garder `useUnifiedLineups`. Ancienne `cosplay_lineups` à clarifier.
- **Inscription concours** : `contest_registrations` (actif) vs `cosplay_registrations` (legacy, costumes/musique/`is_minor`) → trancher.

## Stubs / placeholders

- `EventDetail` : `demoSchedule` désactivé mais `demoMeetups` **encore concaténé** aux meetups DB → retirer.
- `AdminExhibitors`/`ScanPage` : wrappers quasi vides.
- Favoris `localStorage` → migrer DB.

## Points d'attention

- **`EventDetail` 1750 l.** → éclater en onglets/sous-composants (`/evenements/[id]/...`).
- **`(supabase as any)`** sur contest, bookmarks, lineups, cosplay_registrations → types générés + accès `features/events/api/`.
- **Concours** : modélisé en `event_schedule.contest_config` (JSONB) dans le legacy ; le nouveau schéma a une table `event_contest_config` + `contest_registrations` (`passage_order`…) → caler le portage dessus, valider en zod.
- **QR/scan** : `ScannerModal` met à jour `event_participants.is_present`/`checked_in_at` et **crédite +25 OTK** côté client (XP annoncé mais non implémenté) → **RPC/Edge transactionnelle** (ADR 0002).
- Double jeu de colonnes de dates (`date`/`end_date`/`time` vs `date_debut`/`date_fin`) → nettoyer.
- Logs de debug laissés en prod (`useUnifiedAgenda`).
- Leaflet → `dynamic(..., { ssr:false })`.
