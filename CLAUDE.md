# CLAUDE.md — Manga Paradise (reconstruction)

Projet en **reconstruction propre** d'une ancienne app Lovable. Lis ces docs avant d'agir :

- [`REBUILD_PLAN.md`](REBUILD_PLAN.md) — plan, périmètre, ordre de construction (étapes 0→5)
- [`docs/`](docs/) — architecture, conventions, design-system, rbac, ADR
- `legacy/` — ancienne app (React/Vite), **référence en lecture seule** pour le portage (à supprimer en fin de chantier — ne pas y modifier ni y ajouter de code)

## Stack

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind v4 · shadcn/ui (base-nova / Base UI) · TanStack Query · Supabase (`@supabase/ssr`). Gestion de paquets : **npm**.

## Règles non négociables

1. **`any` interdit**, `strict` activé. Valider les inputs avec zod.
2. **Aucun accès Supabase hors `src/features/*/api/`.** Les composants ne parlent pas à la DB.
3. **Pages `app/` fines** : composition, pas de logique métier.
4. **Autorisation** : source unique (`user_roles` + RLS + `lib/rbac.ts`). Jamais de check de rôle ad hoc.
5. **Couleurs/typo** via les tokens du design system (`docs/design-system.md`), jamais en dur.
6. **Secrets** (`SERVICE_ROLE_KEY`…) côté serveur uniquement.
7. Composants **< 300 lignes** ; découper sinon.

## Avant de committer

```bash
npm run typecheck && npm run lint && npm run format:check
```

Commits avec emoji (✨ 🐛 🔥 🎨 📝). Ne committer que sur demande explicite.
