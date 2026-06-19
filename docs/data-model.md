# Modèle de données & migrations

Recréation d'un schéma Supabase **propre** à partir de l'ancien (sans reprise de données). Migrations versionnées via Supabase CLI dans `supabase/migrations/`, numérotées séquentiellement par domaine.

## Sources de vérité

| Source                                      | Couvre                                                                                                                                 |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `legacy/src/integrations/supabase/types.ts` | **66 tables core** (profiles, events, cosplay, communauté, gamification, shop, associations base, pro_partners) — colonnes & relations |
| `legacy/supabase/migrations/*.sql`          | **RLS, fonctions, triggers, storage** + **modules récents absents de types.ts** (voir ⚠️)                                              |

> ⚠️ **`types.ts` est partiellement périmé** (types jamais régénérés). Il **manque** : bénévolat (`volunteer_*`), mission schema, **formulaires d'adhésion** (`membership_*`), `association_fiche_config`, `contest_registrations`/`event_contest_config`, `squads`, `event_lineups`/`event_cosplay_lineups`, colonnes `admin_status`, géoloc PostGIS. Pour ces modules → **lire les migrations**.

## Conventions

- Un fichier `00NN_<domaine>.sql`, **auto-suffisant** (enums + tables + index + fonctions + triggers + RLS du domaine).
- `gen_random_uuid()` (pgcrypto) pour les PK uuid ; `created_at`/`updated_at timestamptz` + trigger `handle_updated_at()`.
- Enums PG quand l'ensemble de valeurs est stable (l'ancien utilisait parfois TEXT+CHECK faute de régénération des types — on normalise en enums).
- RLS activée sur **toutes** les tables ; la base est le rempart. Helpers `SECURITY DEFINER` (`set search_path = public`) pour éviter la récursion.
- Les FK vers une table d'une migration **antérieure** sont autorisées (exécution dans l'ordre numérique). Ne jamais recréer une table appartenant à une autre migration.

## Cleanups structurants

- **Rôles unifiés** : suppression de `profiles.role` / `role_function` → `user_roles` (global) + rôles contextuels. ✅ (0001)
- **Partenaires** : suppression des colonnes `profiles.partner_*` → module `pro_partners`. ✅ (0001)
- **PII** : santé / tuteur / naissance / coordonnées isolées dans `profiles_private` (self/admin). ✅ (0001)
- **Cosplay unifié** : une seule table `cosplay_plans` (l'ancien : `cosplay_vestiaire` → migré → `cosplay_plans` → `lot1_unification`). `cosplay_vestiaire` **non recréée**.
- **Contest** : `contest_registrations` + `event_contest_config` recréées proprement (étaient en `as any`), avec les colonnes réellement utilisées (`passage_order`, etc.).
- **Doublons ignorés** : fichiers `* 2.sql`, `APPLY_*`, `DIAGNOSTIC_*`, `BACKFILL_*`, `VERIFY_*` de l'ancien dossier.

## Ordre & dépendances

L'ordre suit le graphe de dépendances (FK + helpers RLS) :
`associations` + `pro_partners` **avant** `events` (events FK + RLS organisateur) · `cosplay` **avant** `events_social` (lineups → cosplays) · tout dépend de `0001` (profiles/roles).

## Plan des migrations

> Légende **État** : ✅ = migration **écrite** dans `supabase/migrations/`. L'**exécution** (`supabase db push`) reste en attente de la création du projet Supabase (voir « Vérification » plus bas).

| #    | Fichier                      | Domaine                                                                                                                                                                                                               | État |
| ---- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 0001 | `0001_foundation.sql`        | extensions, helpers, `app_role`/`membership_tier`, `profiles`, `profiles_private`, `user_roles`, `has_role`/`is_admin`                                                                                                | ✅   |
| 0002 | `0002_reference.sql`         | `ref_universes`, `ref_characters`, `official_mangas`, `official_animes`, `mangas`, `otaku_library` + FK `profiles.best/worst_character_id`                                                                            | ✅   |
| 0003 | `0003_associations.sql`      | `associations` (+`admin_status`), `association_memberships`/`_invitations`/`_contacts`/`_documents`/`_fiche_config` + helpers RLS asso                                                                                | ✅   |
| 0004 | `0004_pro_partners.sql`      | `pro_partners` (+`admin_status`), `pro_partner_members`, `pro_partner_applications` + helpers RLS pro                                                                                                                 | ✅   |
| 0005 | `0005_events_core.sql`       | `events`, `event_series`, `event_schedule`, `event_participants`, `event_exhibitors`, `event_quests`, `event_proposals`                                                                                               | ✅   |
| 0006 | `0006_cosplay.sql`           | `cosplay_plans`, `cosplay_plan_tasks`, `cosplay_folders`, `cosplay_photos`, `cosplay_photo_tags`, `cosplay_showcase_photos`, `cosplay_achievements`                                                                   | ✅   |
| 0007 | `0007_events_social.sql`     | `event_parties`/`_members`, `party_invitations`, `squads`/`_members`/`_slots`, `event_lineups`, `event_cosplay_lineups`, `cosplay_lineups`, `event_encounters`, `event_memories`/`_photos`, `meetups`/`_participants` | ✅   |
| 0008 | `0008_community.sql`         | PostGIS + géoloc profils, `friendships`, `posts`/`post_comments`/`post_likes`, `notifications`, `user_favorites`, `chat_*`                                                                                            | ✅   |
| 0009 | `0009_guilds_labs.sql`       | `guild_categories`, `guilds`, `guild_members`/`_invitations`/`_posts`/`_events`, `labs_ideas`/`labs_votes`                                                                                                            | ✅   |
| 0010 | `0010_gamification_shop.sql` | `badges`/`user_badges`, `quests`/`user_quests`/`quest_submissions`, `leagues`/`user_league_stats`, `otk_transactions`, `shop_items`/`shop_orders`                                                                     | ✅   |
| 0011 | `0011_membership_forms.sql`  | `membership_form_definitions`, `membership_submissions`/`_answers`, `membership_consents`/`_signatures`, requests/historique                                                                                          | ✅   |
| 0012 | `0012_volunteers.sql`        | `volunteer_*` (applications, missions, shifts, assignments, documents, messages, `activity_log`), `mission_templates`, `mission_schema_*`                                                                             | ✅   |
| 0013 | `0013_contest.sql`           | `contest_registrations`, `event_contest_config`                                                                                                                                                                       | ✅   |
| 0014 | `0014_misc.sql`              | `newsletter_subscribers`, `user_preferences`                                                                                                                                                                          | ✅   |
| 0015 | `0015_storage.sql`           | buckets (`avatars`, `covers`, `cosplay-photos`, `showcase-photos`, `association-documents`) + policies                                                                                                                | ✅   |

## TODO transverses

- [ ] Vue publique « safe » de `profiles` (colonnes non sensibles) pour l'accès anonyme / SEO.
- [ ] FK `profiles.best_character_id` / `worst_character_id` → `ref_characters` (en 0002).
- [ ] Accès des admins d'association aux données mineurs (santé/tuteur) lié à leurs événements (policy ciblée).
- [ ] Auth Hook : injecter les rôles dans le JWT (voir [rbac.md](rbac.md)).
- [ ] Régénérer `src/types/database.ts` une fois le projet Supabase lié.

## Vérification

Tant que le projet Supabase n'est
