# Feature : directory (annuaire)

Annuaire des membres — sous-domaine **communauté** (voir [`docs/features/community.md`](../../../docs/features/community.md)).

## Implémenté (étape 2)

- **/annuaire** : liste des membres (carte : avatar, pseudo, niveau, classe, ville), **recherche** par nom + **filtres** ville / classe. Lien vers chaque profil public.
- Lecture via la vue **`public_profiles`** (colonnes safe, visibilité publique respectée). `api/members.ts`, `server.ts`. Lien « Annuaire » dans la nav.

## À venir

Filtres rôle (bureau/staff/créateurs/cosplayeurs), pagination/recherche serveur si le nombre de membres grandit, recoupement avec la page Recherche multi-entités.
