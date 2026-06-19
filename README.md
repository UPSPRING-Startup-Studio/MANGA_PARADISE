# Manga Paradise

Plateforme communautaire **manga · cosplay · événementiel** : espace membre gamifié, réseau social, agenda d'événements, back-office associations, gestion de bénévolat, constructeur de formulaires d'adhésion, espace partenaires pro et console d'administration.

Reconstruction propre (Next.js) d'une ancienne application générée par Lovable.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS v4 · shadcn/ui · TanStack Query · Supabase · déploiement Vercel.

## Démarrage rapide

```bash
npm install
cp .env.example .env.local   # renseigner les clés Supabase
npm run dev                  # http://localhost:3000
```

## Documentation

- [`REBUILD_PLAN.md`](REBUILD_PLAN.md) — plan de reconstruction (stack, périmètre, ordre de construction)
- [`docs/`](docs/) — [setup](docs/setup.md) · [architecture](docs/architecture.md) · [conventions](docs/conventions.md) · [design system](docs/design-system.md) · [RBAC](docs/rbac.md) · [ADR](docs/adr/)
- `legacy/` — ancienne application, **référence en lecture seule** pendant le portage (supprimée en fin de chantier)

## Scripts

`npm run dev` · `build` · `start` · `lint` · `typecheck` · `format`
