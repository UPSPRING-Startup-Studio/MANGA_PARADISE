# Architecture

## Stack

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS v4 · shadcn/ui (base « base-nova », primitives Base UI) · TanStack Query · Supabase (`@supabase/ssr`).

## Principe : routes fines, métier dans les features

- `app/` ne contient que le **routage** (layouts, pages, route handlers). Les pages composent des features.
- `src/features/<domaine>/` contient le métier, **auto-suffisant** par domaine.
- **Règle d'or** : aucun composant n'appelle Supabase directement. Tout accès aux données passe par le module `api/` de la feature.

## Arborescence

```
app/                     # routage Next.js
  (public)/ (member)/ (association)/ (pro)/ (admin)/
  api/                   # route handlers (invite-member, webhooks)
  layout.tsx
src/
  features/<domaine>/    # components/ hooks/ api/ schemas/ types.ts README.md
  components/ui/         # primitives shadcn (partagées)
  components/            # transverses (layout, nav, providers)
  lib/
    supabase/            # client.ts (browser) · server.ts · middleware.ts
    rbac.ts              # modèle de rôles unique
    utils.ts             # cn()
  types/database.ts      # généré par Supabase CLI
  middleware.ts          # refresh session + (à venir) garde de routes
supabase/                # migrations/ seed.sql config.toml
docs/                    # cette documentation
legacy/                  # ancienne app (référence, temporaire)
```

## Données

- **Lecture serveur** : Server Components via `lib/supabase/server.ts`.
- **Interaction client / temps réel** : TanStack Query via `lib/supabase/client.ts`.
- **Mutations** : Server Actions ou route handlers ; les secrets restent côté serveur.
- **Sécurité** : la RLS Supabase est le rempart ; le front ne fait qu'afficher/masquer.
- **Logique métier dans la base** : contraintes de schéma + RLS + fonctions/RPC Postgres, et Edge Functions pour le code applicatif. Les Server Actions resten
