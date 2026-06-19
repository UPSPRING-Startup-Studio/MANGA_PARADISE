# Feature — profile

**Statut implémentation : 🟡 partiel (étape 1).** Fait : onboarding léger, page `/profil` (édition pseudo/bio/ville/goûts), profil public `/u/[username]` (vue `public_profiles`). Reste : réglages avancés, « modes » d'identité.

## Périmètre

Profil membre (table `profiles`, très large) : identité, abonnement/adhésion, consentements, et plusieurs « modes » d'identité (otaku, gamer, cosplayer, créateur). Onboarding (complétion initiale), édition via réglages, et profil public agrégé (cosplays, bibliothèque otaku, achievements, roadmap). PII (santé, tuteur, naissance) isolée dans `profiles_private`.

## Écrans legacy → cible

| Legacy                                           | Rôle                                         | Route cible                                | Statut                                        |
| ------------------------------------------------ | -------------------------------------------- | ------------------------------------------ | --------------------------------------------- |
| `Onboarding.tsx` + `MembershipWizard` (5 étapes) | Complétion initiale                          | `/onboarding` (léger : identité + serment) | 🟡 léger fait ; pack/paiement/santé → étape 3 |
| `Settings.tsx` (743 l.)                          | Réglages identité/compte                     | `/reglages`                                | ✅ base (`/profil`)                           |
| `SettingsPublicProfile.tsx` (312 l.)             | Pseudo, visibilité, sections                 | `/reglages/profil-public`                  | ⬜                                            |
| `SettingsSocials.tsx` (379 l.)                   | Liens réseaux (`social_links`)               | `/reglages/reseaux`                        | ⬜                                            |
| `SettingsOtaku.tsx` (1694 l.)                    | Mode otaku : biblio manga/anime, top3, duels | `/reglages/otaku`                          | ⬜ à découper                                 |
| `SettingsCosplayer.tsx` (1147 l.)                | Profil cosplayer, vestiaire, achievements    | `/reglages/cosplayer`                      | ⬜ à découper                                 |
| `SettingsCreative.tsx` (632 l.)                  | Mode créateur (domaines, commissions)        | `/reglages/createur`                       | ⬜                                            |
| `SettingsGamer.tsx` (533 l.)                     | Mode gamer (plateformes/IDs)                 | `/reglages/gamer`                          | ⬜                                            |
| `PublicProfile.tsx` (1064 l.)                    | Profil public agrégé + édition inline        | `/u/[username]`                            | ✅ lecture ; édition inline → réglages        |
| `PublicProfileRoadmap.tsx` (300 l.)              | Onglet roadmap/agenda du profil public       | `/u/[username]/roadmap`                    | ⬜                                            |

## Tables Supabase

`profiles`, `profiles_private` (PII), `public_profiles` (vue safe, migration 0016), `user_preferences`, `otaku_library`, `ref_universes`/`ref_characters`, `user_favorites`, `user_badges`. Buckets `avatars`/`covers`.

## Hooks legacy clés

`useProfile` (fetch impératif — **migrer vers TanStack Query**), `useUpdateProfile`/`useUploadProfileImage`, `useCosplayerProfile`, `usePreferences`, `usePublicUserRoadmap`, `useOtakuCollections`, `useReferenceData`.

## Doublons / consolidation

- **6 pages `Settings*` + `Settings.tsx`** ré-implémentent chacune état local + dirty-state + save → consolider en `/reglages` avec sous-routes/onglets et schémas zod par « mode ».
- `useProfile` impératif coexiste avec des hooks Query → uniformiser sur Query.
- `PublicProfile` et `PublicProfileRoadmap` refont chacun un `from("profiles")` inline → hook partagé.

## Points d'attention

- `profiles` est un **god-table** (50+ colonnes) → déjà partiellement éclaté (PII → `profiles_private`) ; envisager d'autres satellites (cosplayer, préférences).
- Données santé/tuteur/consentements → RLS stricte (déjà isolées).
- Monolithes >1000 l. (`SettingsOtaku`, `SettingsCosplayer`, `PublicProfile`) à découper.
- `social_links` (`Record<string,string>`) saisi par 2 écrans → source unique.

## Reste à faire

Réglages par « mode » (otaku/gamer/créateur/cosplayer), visibilité fine des sections, roadmap publique, upload avatar/cover.
