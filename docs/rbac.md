# RBAC — Rôles & autorisations

> L'ancienne app avait **deux systèmes de rôles concurrents** (`profiles.role`/`role_function` **et** `user_roles`), 16+ rôles vérifiés en dur sur 51 fichiers. On repart d'une **source unique**.

## Principes

1. **Une seule source de vérité** par niveau :
   - **Rôles globaux** : table `user_roles` (enum `app_role` : `admin`, `moderator`, `member`, `premium`, `volunteer`, `partner`).
   - **Rôles contextuels** : tables d'appartenance (`association_memberships.role`, `pro_partner_members.role`).
2. **La RLS est le rempart d'autorisation.** Le serveur refuse ; le front ne fait qu'afficher/masquer.
3. **Un seul point d'accès côté app** :
   - `src/lib/rbac.ts` — helpers purs (a-t-il tel rôle ?).
   - `useRole()` (client) + gardes serveur (Server Components / route handlers).
   - Garde de routes centralisée dans `src/proxy.ts` (Next 16 : la convention `middleware` est renommée `proxy`) qui délègue à `lib/supabase/middleware.ts`.
4. **Jamais** de vérification de rôle ad hoc dispersée dans les composants.

## Helpers RLS (repris de l'existant, à recréer proprement)

`is_association_admin`, `is_association_leader`, `is_association_member`, `is_association_writable`, `is_pro_partner_admin`, `has_role`… (voir `legacy/supabase/migrations/`).

## État (Étape 0/1)

- [x] `lib/rbac.ts` — types (`AppRole`, `Area`), helpers purs (`hasRole`, `hasAnyRole`, `isAdmin`, `isStaff`,
