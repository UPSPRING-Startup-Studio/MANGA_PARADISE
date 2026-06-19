# ADR 0001 — Stack & socle de la reconstruction

- **Statut** : accepté
- **Date** : 2026-06-17

## Contexte

L'ancienne application Manga Paradise (SPA Vite/React générée par Lovable, ~160k lignes, 109 pages) est saine fonctionnellement mais techniquement à jeter (TS strict désactivé, bundle monolithique, RBAC incohérent, doublons). Décision de réécrire proprement en conservant toutes les fonctionnalités, sur Vercel + Supabase (nouveau compte, sans reprise de données).

## Décision

- **Framework** : Next.js 16 (App Router) + React 19 + TypeScript strict.
- **UI** : Tailwind CSS v4 + shadcn/ui style « base-nova » (primitives **Base UI**).
- **Données** : `@supabase/ssr` (clients server/client/middleware), TanStack Query côté client.
- **Auth** : Supabase Auth natif (email + OAuth), **sans** `@lovable.dev/cloud-auth-js`.
- **Autorisation** : source unique `user_roles` + rôles contextuels + RLS (voir [rbac.md](../rbac.md)).
- **Architecture** : feature-first ; routes `app/` fines ; aucun accès Supabase hors `features/*/api/`.
- **Qualité** : ESLint (no-any, no-unused-vars) + Prettier + `tsc` strict ; CI lint+typecheck+build.
- **Reconstruction** : complète avant mise en ligne, par étages de dépendances (voir REBUILD_PLAN.md §9).
- **Gestion de paquets** : npm (corepack/pnpm indisponible sur le poste).

## Conséquences

- Les composants UI utilisent **Base UI** (et non Radix comme l'ancien) ; portage des composants legacy à adapter.
- L'ancienne app est conservée sous `legacy/` comme référence, supprimée en fin de chantier.
- Le schéma DB existant sert de cahier des charges ; recréation via migrations Supabase CLI propres.
