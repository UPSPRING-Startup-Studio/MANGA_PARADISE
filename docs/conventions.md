# Conventions de code

## TypeScript

- `strict: true` + `noUncheckedIndexedAccess`. **`any` interdit** (règle ESLint en erreur).
- Variables inutilisées interdites (préfixer `_` si volontaire).
- Valider tout input utilisateur avec **zod** (schémas partagés client/serveur dans `features/*/schemas/`).

## Organisation

- Code organisé **par feature** (`src/features/<domaine>/`), pas par type technique.
- Aucun accès Supabase hors des modules `api/` d'une feature.
- Pages `app/` fines : composition uniquement, pas de logique métier.
- Secrets (`SERVICE_ROLE_KEY`…) uniquement côté serveur.

## Composants

- Budget de taille : viser **< 300 lignes**. Découper les gros composants.
- Primitives UI via shadcn/ui (`src/components/ui/`) — ajout : `npx shadcn@latest add <composant>`.
- Nommage : identifiants en **anglais**, copie UI en **français**.

## Style

- Prettier (config `.prettierrc.json`) + `prettier-plugin-tailwindcss` (tri des classes).
- Couleurs via tokens du design system uniquement (voir [design-system.md](design-system.md)), jamais de couleur en dur.

## Mobile-first (exigence forte)

Chaque écran doit être **irréprochable sur mobile**. On conçoit mobile-first : styles de base = mobile, puis `sm:`/`md:`/`lg:`. Règles : navigation repliée en menu sous `md` ; grilles en 1 colonne sur mobile (`grid-cols-1 sm:grid-cols-2
