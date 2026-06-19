# Feature — association

**Statut implémentation : ⬜ à faire (étape 3).** Back-office de gestion d'association + fiche publique.

## Périmètre

Back-office complet : tableau de bord (KPI/funnel d'adhésion), membres & engagement, équipe/bureau (gouvernance), invitations (par user ou email), événements rattachés, contacts CRM, documents (workflow validation), réglages, et fiche publique configurable. Accès gardé par un layout injectant `association` + `role` ; capacités centralisées dans `useAssociationGovernance` (dérivées du rôle + `admin_status`).

## Écrans legacy → cible

| Legacy                         | Rôle                                                     | Route cible                       |
| ------------------------------ | -------------------------------------------------------- | --------------------------------- |
| `AssociationDashboard.tsx`     | KPI, historique membres, funnel, événements, validations | `/association`                    |
| `AssociationMembers.tsx`       | Liste/filtres membres, rôles, statut                     | `/association/membres`            |
| `AssociationTeam.tsx`          | Équipe/bureau, ordre, visibilité, engagement             | `/association/equipe`             |
| `AssociationInvitations.tsx`   | Invitations (user + email), relance/annulation           | `/association/invitations`        |
| `AssociationEventsPage.tsx`    | Événements rattachés (créer/attacher/détacher)           | `/association/evenements`         |
| `AssociationContactsPage.tsx`  | **STUB UI** (hook CRUD existe)                           | `/association/contacts`           |
| `AssociationDocumentsPage.tsx` | **STUB UI** (hook CRUD + workflow existe)                | `/association/documents`          |
| `AssociationSettings.tsx`      | Réglages + édition fiche/visibilité                      | `/association/parametres`         |
| `FicheAssociation.tsx`         | Fiche publique (président, ADN, équipe, docs, charte)    | `/a/[slug]`                       |
| `VieAssociative.tsx`           | Livret d'accueil membre (**statique en dur**)            | `/association/accueil` (ou fiche) |
| `AssociationSlugRedirect.tsx`  | `/asso/:slug` → back-office si membre                    | logique de routing → middleware   |
| `dev/AssociationPreview.tsx`   | **DEV** (bypass guard)                                   | ❌ ne pas porter                  |

## Tables Supabase

`associations`, `association_memberships`, `association_invitations`, `association_contacts`, `association_documents`, `association_fiche_config` (était en `as any`), `profiles`, `events`, `event_participants`.

## Hooks legacy clés

`useAssociation` (CRUD asso/membership, rôles), `useAssociationGovernance` (**pivot RBAC** : canEdit/canManageMembers/…), `useAssociationDashboard`, `useAssociationMembersV2` (engagement/bénévolat), `useAssociationInvitations`, `useAssociationContacts` (CRUD — non câblé à l'UI), `useAssociationDocuments` (CRUD + workflow — non câblé), `useAssociationFiche` (config + visibilité par section), `useAdminAssociations` (super-admin).

## Doublons / consolidation

- Deux familles de hooks membres : `useAssociation` (v1) vs `useAssociationMembersV2` → unifier.
- `VieAssociative` (contenu en dur) duplique `FicheAssociation` (dynamique via `association_fiche_config`) → converger.
- `AssociationSlugRedirect` ∩ `FicheAssociation` sur le routing slug.

## Stubs / placeholders

- **Confirmé** : `AssociationContactsPage` et `AssociationDocumentsPage` sont des pages-coquilles — **mais leurs hooks CRUD sont entièrement implémentés** : seule l'UI manque.
- `dev/AssociationPreview` : temporaire, à abandonner.

## Points d'attention

- **RBAC asso** : tout passe par `useAssociationGovernance` + `LEADER_ROLES` + `admin_status` côté front → reposer sur `user_roles`/rôle contextuel `association_memberships.role` + RLS + `lib/rbac.ts`.
- `association_fiche_config` était en `as any` → typer.
- Double mode membre vs super-admin injecté via contexte → modéliser proprement (groupes de routes).
