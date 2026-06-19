# Setup

## Prérequis

- Node.js ≥ 20.9
- npm (fourni avec Node)
- Un projet Supabase (pour l'auth et les données)

## Installation

```bash
npm install
cp .env.example .env.local   # puis renseigner les clés Supabase
npm run dev                  # http://localhost:3000
```

## Variables d'environnement

| Variable                        | Portée             | Description                                           |
| ------------------------------- | ------------------ | ----------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | client + serveur   | URL du projet Supabase                                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + serveur   | Clé publique (anon) — sécurité via RLS                |
| `SUPABASE_SERVICE_ROLE_KEY`     | serveur uniquement | Clé admin — **jamais** exposée au client ni committée |

> Tant que `NEXT_PUBLIC_SUPABASE_*` ne sont pas renseignées, le middleware laisse passer les requêtes (pas d'auth active).

## Scripts

| Script              | Rôle                                     |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | serveur de développement (Turbopack)     |
| `npm run build`     | build de production                      |
| `npm run start`     | serveur de production                    |
| `npm run lint`      | ESLint                                   |
| `npm run typecheck` | vérification TypeScript (`tsc --noEmit`) |
| `npm run format`    | formatage Prettier                       |

## Déploiement (Vercel)

- Connecter le dépôt à Vercel ; framework détecté : **Next.js**.
- Renseigner les variables d'environnement par environnement (Preview / Production).
- Déploiements automatiques : Preview par PR, Production sur `main`.
- Le dossier `legacy/` est ignoré par le build Next.js.

## Base de données (Supabase CLI)

```bash
npx supabase migration new <nom>     # nouvelle migration
npx supabase db push                 # appliquer
npx supabase gen types typescript --linked > src/types/database.ts
```
