# Feature : cosplay

Hub cosplay unifié : projets, tâches, photos & tags, vestiaire, lineups, achievements.

> 📋 **Spécification détaillée** : [`docs/features/cosplay.md`](../../../docs/features/cosplay.md).

## Implémenté (étape 2 — 1er jet)

- **Vestiaire** `/cosplay` : grille de mes projets (personnage/univers, statut, progression).
- **Création / édition** `/cosplay/nouveau`, `/cosplay/[id]/modifier` (personnage, univers, statut, année, deadline, budget, confection, notes, image).
- **Fiche projet** `/cosplay/[id]` : en-tête + **tâches en kanban drag & drop** (dnd-kit, tactile), ajout/suppression, suppression du projet, et **galerie photos** (upload vers le bucket privé `cosplay-photos`, affichage par **URLs signées**, suppression).
- `api/plans.ts` + `api/tasks.ts`, `actions.ts`, `server.ts`, `lib.ts` (statuts, catégories), `schemas.ts`.

## À venir

Tags de personnes sur les photos, vestiaire avec dossiers (DnD), lineups par événement, achievements concours. Voir la fiche.

## Notes

- RLS self (`owns_cosplan`) : chacun ne voit/édite que ses projets et tâches.
- Kanban tactile via `@dnd-kit/core` (PointerSensor + TouchSensor) ; colonnes en scroll horizontal sur mobile.
