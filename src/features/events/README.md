# Feature : events

Événements, agenda unifié, fiche événement, concours cosplay, parties/lineups, souvenirs.

> 📋 **Spécification détaillée** : [`docs/features/events.md`](../../../docs/features/events.md).

## Implémenté (étape 1 — 1er jet)

- **Agenda** `/agenda` (espace membre) : onglets temporels (à venir/en cours/passés/tous), filtres ville & type, bascule **liste / carte Leaflet**, filtre « mes événements », favoris.
- **Fiche événement** `/evenements/[id]` : en-tête (image, dates, lieu, participants), description, **RSVP** (participer), **favori**, et **programme** (`event_schedule` groupé par jour).
- **Données** : `api/events.ts` (lectures), `api/participation.ts` (RSVP + favoris via `user_favorites`), `actions.ts` (toggle RSVP/favori), `server.ts` (orchestration), `lib.ts` (statut temporel, géoloc), `format.ts`.

## À venir (sous-étapes)

Ouverture publique (SEO) via migration anon ; exposants, parties/squads, lineups cosplay, souvenirs, quêtes d'événement ; CRUD admin & concours (étape 4). Voir la fiche.

## Notes

- L'agenda est en **espace membre** car la RLS `events_select_all` est `to authenticated`. L'accès anonyme nécessitera une migration (policy anon sur `status='published'`).
- Carte : `leaflet` chargé dynamiquement côté client (`circleMarker`, pas d'asset d'icône).
- Données de démo : `supabase/seed.sql`.
