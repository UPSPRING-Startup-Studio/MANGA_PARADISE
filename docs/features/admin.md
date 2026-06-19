# Feature — admin

**Statut implémentation : ⬜ à faire (étape 4).** ~18 écrans (la sidebar en expose 11, le routeur en monte plus).

## Périmètre

Console d'administration sous `/admin` derrière une garde admin. Couvre la modération communautaire (utilisateurs, banque OTK, quêtes, boutique, trophées, guildes), la gestion des structures (associations, partenaires pro, candidatures), les événements/exposants/concours (voir [events](events.md)), et un éditeur de référentiels.

## Écrans legacy → cible

| Legacy                                                                                                          | Rôle                                                 | Route cible                         |
| --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------- |
| `AdminIndex.tsx`                                                                                                | Redirige vers `/admin/users`                         | `/admin`                            |
| `AdminUsers.tsx`                                                                                                | Utilisateurs, rôles, notifications, transactions OTK | `/admin/users`                      |
| `AdminBank.tsx`                                                                                                 | Crédit/débit OTK via RPC `admin_process_transaction` | `/admin/bank`                       |
| `AdminAssociations.tsx` (+ `AdminAssociationLayout`)                                                            | CRUD associations + membres (soft-delete/restore)    | `/admin/associations`               |
| `AdminProPartners.tsx`                                                                                          | CRUD partenaires + candidatures (list/kanban/grid)   | `/admin/partners`                   |
| `AdminGuilds.tsx`                                                                                               | Guildes et membres                                   | `/admin/guilds`                     |
| `AdminShop.tsx`                                                                                                 | Articles boutique (`shop_items`)                     | `/admin/shop`                       |
| `AdminQuests.tsx`                                                                                               | Quêtes + `user_quests`                               | `/admin/quests`                     |
| `AdminAchievements.tsx`                                                                                         | Modération trophées cosplay soumis                   | `/admin/achievements`               |
| `AdminDatabase.tsx`                                                                                             | Éditeur CRUD de référentiels                         | `/admin/database` (**à sécuriser**) |
| `AdminEventProposals.tsx`                                                                                       | Modération propositions d'événements                 | `/admin/event-proposals`            |
| (hors sidebar) `AdminEvents`/`AdminEventSeries`/`AdminExhibitors`/`ContestManager`/`ContestLiveView`/`ScanPage` | Événements/séries/exposants/concours/scan            | voir [events](events.md)            |

## Tables Supabase

`profiles`, `user_roles`, `notifications`, `otk_transactions` (RPC `admin_process_transaction`), `quests`/`user_quests`, `shop_items`, `cosplay_achievements`, `guilds`/`guild_members`, `associations`/`association_memberships`, `pro_partners`/`pro_partner_members`/`pro_partner_applications`, `events`/`event_proposals`, référentiels `ref_universes`/`ref_characters` + manga/anime.

## Hooks legacy clés

`useAdminProPartners` (gestion partenaires + candidatures), `useAdminAssociations` (CRUD + membres + soft-delete), `useEventProposals`, `usePendingAchievements`/`useModerateAchievement`, `useIsAdmin` (**garde d'accès** du layout).

## Doublons / consolidation

- **Associations vs Pro-partners** : deux modules quasi parallèles (CRUD structure + membres + soft-delete) partageant les patterns (CandidateCard, EditSheet, Grid/Kanban) → mutualiser les composants génériques.
- OTK : `AdminBank` et `AdminUsers` lisent tous deux `otk_transactions`/`profiles` → éviter la logique de crédit dupliquée.
- Partner legacy n'a pas de pendant admin (seul `AdminProPartners` gère les `pro_partner_*`) ; `profiles.partner_status` devient mort.

## Stubs / placeholders

- `AdminDatabase` = éditeur de référentiels avec **delete direct côté client** (sans confirmation forte) → à cadenasser (RPC + RLS + audit + confirmations).
- `AdminExhibitors.tsx` : quasi-coquille (ré-export).

## Points d'attention

- **Sécurité** : `AdminDatabase` (suppressions directes sur référentiels partagés) et `AdminBank` (mutation monétaire) → RPC + RLS + journalisation, jamais de calcul de solde côté client.
- **RBAC** : unique garde = `useIsAdmin` au niveau layout (un admin a tout) → permissions granulaires (`lib/rbac.ts` : `admin` vs `moderator`) + RLS par sous-module. Supprimer le rôle legacy `partner` de `user_roles` au profit de `pro_partner_members`.
- **Cartographier les ~18 écrans** (dont hors-sidebar) avant la réécriture pour ne rien perdre.
