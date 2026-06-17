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

## Git

- Commits avec emoji : ✨ feature · 🐛 bug · 🔥 suppression · 🎨 refactor · 📝 doc · 🚧 WIP.
- Branches : `DEVELOPMENT` → `staging` → `main` (via PR).

## Qualité avant commit

```bash
npm run typecheck && npm run lint && npm run format:check
```
