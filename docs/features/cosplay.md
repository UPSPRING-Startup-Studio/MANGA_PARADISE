# Feature — cosplay

**Statut implémentation : ⬜ à faire (étape 2).** Cœur fonctionnel de l'app. Schéma déjà unifié côté DB (`cosplay_plans`).

## Périmètre

Gestion des **projets cosplay** via une fiche unifiée (Hub) à onglets : vue d'ensemble, tâches (kanban craft/achat/dressing + budget + auto-progression), photos (WIP + showcase, tags de personnes, EXIF date/GPS, association d'événement), événements/lineups (quel costume porté quel jour), dossiers de référence. Autour : vestiaire/garde-robe (grille + arbre de dossiers, DnD), galerie photo perso, coscard (QR + stats), achievements concours (modérés), lineup maker, feed cosplay.

## Écrans legacy → cible

| Legacy                         | Rôle                                                          | Route cible                                             |
| ------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------- |
| `CosplayHub.tsx`               | Fiche unifiée à onglets (overview/tasks/photos/lineup/files)  | `/cosplay/[id]`                                         |
| `CosplayWardrobe.tsx`          | Garde-robe : arbre de dossiers + grille DnD                   | `/cosplay` (ou `/cosplay/vestiaire`)                    |
| `MesPhotosCosplay.tsx` (27 Ko) | Galerie perso globale, vues par event/cosplay/personne, batch | `/cosplay/photos`                                       |
| `CosFeed.tsx`                  | Feed cosplay (WIP/showcase/nakamas/local)                     | `/cosplay/feed` → **fusionner avec le feed communauté** |
| `CosplayProjectDashboard.tsx`  | **MORT** (redirigé vers Hub)                                  | ❌ ne pas porter                                        |
| `CosplayShowcase.tsx` (40 Ko)  | **MORT** (redirigé vers Hub)                                  | ❌ ne pas porter                                        |

## Tables Supabase

**Retenues (schéma unifié)** : `cosplay_plans`, `cosplay_plan_tasks`, `cosplay_folders`, `cosplay_photos`, `cosplay_photo_tags`, `cosplay_showcase_photos`, `cosplay_achievements`, `cosplay_lineups`. Auxiliaires : `cosplan_reactions`, `events`/`event_participants`, `posts` (feed). **Abandonnées** : `cosplay_vestiaire`, `cosplays`, `cosplay_registrations`, `event_lineups` (doublon). Buckets : consolider `cosplay-photos` + `showcase-photos`.

## Hooks legacy clés

`useCosplans` (CRUD plans), `useCosplayProject` (un projet), `useWardrobeItems` (grille), `useCosplanTasks` (kanban), `useCosplanStats` (réactions), `useCosplayFolders` (arbre), `useCosplayPhotos` (28 Ko, photos+tags), `useAllCosplayPhotos`, `useShowcasePhotos`, `useCosplayLineups`/`useQuickLineup`/`useLineUpMaker` (planning), `useCosplayWearCount`, `useCosplayAchievements`, `useCosCard`/`useCosCardStats` (QR+stats — **à reclasser côté profil/social**).

## Doublons / consolidation

- **Vestiaire vs plans** : `cosplay_vestiaire` ↔ `cosplay_plans` = même concept dédoublé (`source_vestiaire_id` trace la migration) → **une seule entité `cosplay_plans`**. ✅ acté côté schéma.
- **Lineups ×2** : `cosplay_lineups` (vieux hooks, join vestiaire) vs `event_lineups` (wear-count/photos) → trancher (le schéma garde `cosplay_lineups`).
- **Lineup maker éclaté** : 7 composants (`useLineUpMaker` state-only + `useQuickLineup` + `useCosplayLineups` + `LineUpCanvas/Grid/Modal/...`) → fusionner.
- **Showcase vs Hub** : `cosplay_showcase_photos` coexiste avec `cosplay_photos.photo_type='showcase'` → éviter le double stockage.
- **Galerie ×2 chemins** : `MesPhotosCosplay` (global) et onglet Photos du Hub (scopé) partagent les sous-composants → mutualiser.

## Stubs / placeholders

- `hub/FilesTab.tsx` : onglet « Dossiers » non fonctionnel (`onSelectFolder` no-op).
- `useLineUpMaker`/`usePhotoSelection` : state local, à recâbler.
- `CosplayShowcase`/`CosplayProjectDashboard` : code vivant mais **routes redirigées** → ne pas porter.
- `CreateSquadWizard`/`PartyFinder*` dans `components/cosplay/` relèvent des **squads d'événement** (feature events), pas du cosplay perso.

## Points d'attention

- **Monolithes** : `CosplanModal` (40 Ko), `PartyFinderModal` (40 Ko), `CosplayGridWithDnd` (34 Ko), `useCosplayPhotos` (28 Ko), `MesPhotosCosplay` (27 Ko)… → découper.
- **`as any` massif** (86 occurrences + casts client) → types générés, accès `features/cosplay/api/`.
- **DnD** (grille/dossiers + lineup) → `dnd-kit`, vérifier compat React 19.
- **Upload/EXIF** : `exifr` extrait date+GPS ; uploads vers 3 buckets avec **fallback codé en dur** → un bucket, validation, suppression du fallback.
- **Statuts incohérents** : `wishlist|started|paused|finished` vs `in_progress|completed` → harmoniser l'enum.
- Accès Supabase éparpillés hors `api/` (ex `useCosplayFolders`) → recentrer.
