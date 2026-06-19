# Fiches features — plan directeur de portage

Une fiche par domaine métier, issue de l'**audit complet du legacy** (lecture seule sous `legacy/`). Chaque fiche cartographie : périmètre, écrans legacy → routes cibles, tables Supabase, hooks/logique clés, doublons à consolider, stubs à cadrer, points d'attention.

> Ces fiches sont le **cahier des charges** de la reconstruction (cf. [REBUILD_PLAN.md](../../REBUILD_PLAN.md) §6). Elles décrivent l'existant et la cible ; l'implémentation se fait par étapes (§9 du plan).

## Index

| Fiche                                   | Domaine                                       | Étape | Statut impl. |
| --------------------------------------- | --------------------------------------------- | ----- | ------------ |
| [auth](auth.md)                         | Authentification (email + OAuth Google)       | 0/1   | ✅ fait      |
| [profile](profile.md)                   | Profils, réglages, profil public, onboarding  | 1     | 🟡 partiel   |
| [events](events.md)                     | Événements, agenda, concours, parties/lineups | 1     | ⬜ à faire   |
| [gamification](gamification.md)         | XP, ligues, badges, quêtes, OTK, boutique     | 1     | ⬜ à faire   |
| [cosplay](cosplay.md)                   | Hub cosplay, vestiaire, photos, lineups       | 2     | ⬜ à faire   |
| [community](community.md)               | Feed, amis, radar, annuaire, guildes, labs    | 2     | ⬜ à faire   |
| [association](association.md)           | Back-office association, fiche publique       | 3     | ⬜ à faire   |
| [membership-forms](membership-forms.md) | Form builder d'adhésion, soumissions          | 3     | ⬜ à faire   |
| [volunteers](volunteers.md)             | Bénévolat : missions, planning, schéma        | 3     | ⬜ à faire   |
| [pro-partners](pro-partners.md)         | Espace partenaire pro (consolidé)             | 3     | ⬜ à faire   |
| [admin](admin.md)                       | Console d'administration                      | 4     | ⬜ à faire   |

## Constats transverses (tout le legacy)

- **Rôles à unifier** : le legacy lit les rôles depuis `profiles.role` / `role_function` **et** `user_roles` (+ rôle `partner`). Cible : `user_roles` + RLS + `lib/rbac.ts` uniquement.
- **`as any` massif** : contest, bookmarks, lineups, fiche asso, membership*\*, mission_schema*_ étaient accédés en `as any` (types jamais régénérés). Cible : types générés + accès dans `features/_/api/`.
- **Logique métier côté client** : crédit XP/OTK, achat boutique, activation d'adhésion, check-in QR… faits par updates directs depuis le navigateur (race conditions, contournables). Cible : RPC / Edge Functions transactionnelles (cf. [ADR 0002](../adr/0002-acces-donnees-et-logique-metier.md)).
- **Monolithes** : `EventDetail` 1750 l., `SettingsOtaku` 1694 l., `MissionSchemaConfigurator` 1508 l., `MemberAgenda` 1319 l., `VolunteerApplications` 1145 l., `SettingsCosplayer` 1147 l., `PublicProfile` 1064 l. → à découper (< 300 l.).
- **localStorage vs DB** : favoris d'agenda/créneaux en localStorage par endroits, en table `event_bookmarks` ailleurs → unifier sur la DB.
- **Tables hors migrations legacy** : social, guildes, labs, boutique, chat venaient de l'ancienne stack Lovable (absents de `legacy/supabase/migrations`) ; ils sont **déjà recréés** dans le nouveau schéma (`supabase/migrations/0001→0016`).
