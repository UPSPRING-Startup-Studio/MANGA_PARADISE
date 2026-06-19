# Feature — pro-partners

**Statut implémentation : ⬜ à faire (étape 3).** Le portail **Partner legacy** (`/partner/*`) est **supprimé** et son peu de réel absorbé dans Pro (`/pro/*`).

## Périmètre

Espace réservé aux structures professionnelles (`pro_partners`) : équipe multi-rôles (owner/admin/manager/member), édition de la fiche structure, gestion des événements, messagerie (stub), et formulaire public **Devenir partenaire** alimentant une file de candidatures modérée côté admin.

## Écrans legacy → cible

### Pro (à garder)

| Legacy                      | Rôle                                        | Route cible                     |
| --------------------------- | ------------------------------------------- | ------------------------------- |
| `pro/ProDashboard.tsx`      | Stats + prochains événements                | `/pro/dashboard`                |
| `pro/ProStructure.tsx`      | Édition fiche structure (admin/owner)       | `/pro/structure`                |
| `pro/ProEvents.tsx`         | CRUD événements (à venir/passés/annulation) | `/pro/evenements`               |
| `pro/ProDemandes.tsx`       | **Stub** messagerie partenaire ↔ équipe MP  | `/pro/demandes` (à implémenter) |
| `pro/ProSettings.tsx`       | Gestion membres/rôles                       | `/pro/parametres`               |
| `pro/DevenirPartenaire.tsx` | Formulaire public de candidature            | `/devenir-partenaire` (public)  |

### Partner legacy (à fusionner / abandonner)

| Legacy                                                           | Décision                                                        |
| ---------------------------------------------------------------- | --------------------------------------------------------------- |
| `partner/PartnerDashboard.tsx` (mock, `profiles.partner_status`) | → **fusionner** `/pro/dashboard`                                |
| `partner/PartnerSettings.tsx` (écrit `profiles.partner_*`)       | → **fusionner** `/pro/structure` + `/pro/parametres`            |
| `partner/PartnerEvents.tsx` (sponsoring statique)                | → `/pro/demandes` ou **abandon**                                |
| `partner/PartnerActions/Modalites/Dossier/FAQ/Contact.tsx`       | **100 % statique** → **abandon** (ou pages marketing publiques) |
| `PartnerLanding.tsx`                                             | → remplacé par `/devenir-partenaire`                            |

## Tables Supabase

`pro_partners` (`admin_status` active/restricted/blocked, soft-delete), `pro_partner_members` (user↔structure + rôle), `pro_partner_applications` (candidatures), `events` (rattachés à un partenaire), `profiles` (recherche membres ; **champs `partner_*` legacy → abandonner**).

## Hooks legacy clés

`useProPartner` (types/labels, `useMyProPartner`, members, update), `useProPartnerDashboard` (stats), `useProPartnerEvents` (CRUD events par `partner_id`), `useProPartnerGovernance` (**capacités RBAC**), `usePublicProPartners` (annuaire public), `useAdminProPartners` (candidatures : `useSubmitPartnerApplication`, approve/reject, soft-delete — réutilisé côté pro).

## Doublons / consolidation

- Mapping Partner → Pro ci-dessus : garder les versions Pro (réelles, tables `pro_partner_*`), abandonner le mock `profiles.partner_*`.
- Deux layouts/sidebars (`PartnerLayout` vs `ProPartnerLayout`) → garder Pro.

## Stubs / placeholders

- **`ProDemandes` = stub** (« en cours de développement », `mailto:`) — aucune table de messagerie.
- Tout `partner/*` non-CRUD est du mockup (0 appel Supabase).

## Points d'attention

- **RBAC** : `useIsPartner` (rôle `partner` dans `user_roles`) coexiste avec `pro_partner_members` → **deux sources d'autorité à unifier** sur le rôle contextuel `pro_partner_members.role` + RLS + `lib/rbac.ts`. `ProPartnerLayout` accorde un rôle admin fictif aux super-admins → à corriger.
- Champs `profiles.partner_*` orphelins → migration/abandon.
- `useProPartnerEvents` en `any` → typer.
