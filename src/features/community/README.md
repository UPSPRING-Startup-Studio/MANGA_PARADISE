# Feature : community

Feed social, amis (Nakamas), radar géoloc, annuaire, recherche, notifications, chat, guildes, labs.

> 📋 **Spécification détaillée** : [`docs/features/community.md`](../../../docs/features/community.md).

## Implémenté (étape 2 — 1er jet : feed)

- **Feed** `/communaute` : composer (texte + image), liste des publications (auteur, date relative, contenu, image), **like** (toggle), compteur de commentaires.
- **Détail** `/communaute/post/[id]` : publication + **commentaires** (ajout + liste).
- Compteurs likes/commentaires **calculés à la lecture** (pas de trigger ; les colonnes dénormalisées `likes_count`/`comments_count` ne sont pas utilisées). Images dans le bucket **public** `showcase-photos` (URL publique).
- `api/posts.ts`, `actions.ts`, `server.ts`, `lib.ts` (date relative), `schemas.ts`.

## À venir

Fusion CosFeed (filtres nakamas/wip/showcase/local), amis (Nakamas), radar géoloc (PostGIS + Leaflet), annuaire, recherche, notifications, chat temps réel, guildes, labs. Un trigger de compteurs (hardening) serait utile. Voir la fiche.
